# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentProvision is an enterprise-grade unified data & AI lakehouse platform built as a monorepo. It provides multi-tenant control plane capabilities for managing AI agents, data pipelines, and deployments. The platform deploys exclusively via Kubernetes (GKE) using Helm charts and GitHub Actions.

## Architecture

### Monorepo Structure

This is a **Turborepo monorepo** managed with `pnpm` workspaces:

- **`apps/api`**: FastAPI backend (Python 3.11)
  - Multi-tenant JWT-secured REST API
  - Synchronous SQLAlchemy with PostgreSQL (not async despite asyncpg driver)
  - Temporal workflow integration for orchestration
  - Seed data initialization on startup via `init_db.py`

- **`apps/web`**: React SPA (JavaScript, React 18, Create React App)
  - Bootstrap 5 + React Bootstrap UI
  - React Router v7 for navigation
  - i18next for internationalization
  - Authenticated console at `/dashboard/*`, marketing landing page at `/`

- **`apps/adk-server`**: Google Agent Development Kit (ADK) server (Python 3.11)
  - Multi-agent orchestration with supervisor pattern
  - Sub-agents: data_analyst, report_generator, knowledge_manager
  - Tools for data, analytics, knowledge, and actions
  - Connects to MCP server for Databricks operations

- **`apps/mcp-server`**: Model Context Protocol server for data integration (Python 3.11)
  - MCP-compliant server following Anthropic's specification
  - 9 tools: PostgreSQL connections, data ingestion, Databricks queries
  - Bronze/Silver/Gold data layer architecture via Databricks Unity Catalog

- **`helm/`**: Kubernetes Helm charts
  - `charts/microservice/`: Reusable base chart for all services
  - `values/`: Per-service configuration (api, web, worker, adk, temporal, redis, postgresql)

- **`infra/terraform`**: Infrastructure as Code for AWS deployment (EKS, Aurora PostgreSQL, VPC)

- **`scripts`**: Utility scripts
  - `deploy.sh`: Legacy VM deployment (deprecated, use Kubernetes)
  - `e2e_test_production.sh`: End-to-end test suite (22 test cases)

### Key Architectural Patterns

**Multi-tenancy**: All data models include a `tenant_id` foreign key. The API enforces tenant isolation via JWT token validation. Users belong to tenants; all operations are scoped to the authenticated user's tenant.

**Authentication flow**:
1. `POST /api/v1/auth/register` creates tenant + admin user
2. `POST /api/v1/auth/login` returns JWT access token
3. All protected endpoints require `Authorization: Bearer <token>` header
4. Demo credentials: `test@example.com` / `password`

**Database initialization**: On API startup, `apps/api/app/main.py` calls `init_db()` which creates tables and seeds demo data.

**LLM Integration**: Chat uses Claude AI (`/api/v1/chat`) with context management, tool execution, and fallback to static templates if `ANTHROPIC_API_KEY` is not set.

**Temporal workflows**: Durable workflow execution at `apps/api/app/services/workflows.py`. Databricks worker uses Temporal for async dataset sync jobs.

**Databricks Integration**: Datasets sync to Unity Catalog via MCP server (Bronze/Silver layers). Status tracked in dataset metadata (`sync_status`: pending/syncing/synced/failed).

## Development Commands

### Local Development (Docker Compose)

```bash
# Start all services with custom ports
DB_PORT=8003 API_PORT=8001 WEB_PORT=8002 docker-compose up --build

# Services: API (8001), Web (8002), DB (8003), MCP (8086), ADK (8085), Temporal (7233/8233)

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Connect to PostgreSQL
docker-compose exec db psql -U postgres agentprovision
```

### API Development

```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Testing (pytest configured with asyncio_mode=auto in root pytest.ini)
pytest                                # Run all tests
pytest tests/test_api.py              # Run specific file
pytest tests/test_api.py::test_login  # Run specific test
pytest -v                             # Verbose output

# Linting
ruff check app
```

### Web Development

```bash
cd apps/web
npm install
npm start                              # Dev server (port 3000)
npm test                               # Tests in watch mode
npm test -- --ci --watchAll=false      # CI mode (single run)
npm test -- WizardStepper.test.js      # Specific test file
npm run build                          # Production build
```

### MCP Server Development

```bash
cd apps/mcp-server
pip install -e ".[dev]"
pytest tests/ -v
python -m src.server                   # Runs on http://localhost:8085
```

### ADK Server Development

```bash
cd apps/adk-server
pip install -r requirements.txt
python server.py                       # Runs on http://localhost:8080
```

### Monorepo Commands

```bash
pnpm install && pnpm build && pnpm lint
```

## API Structure

### Models (`apps/api/app/models/`)

Core domain models (all inherit from SQLAlchemy Base, include `tenant_id` ForeignKey):
- `tenant.py`, `user.py`: Multi-tenancy and users
- `agent.py`, `agent_kit.py`: AI agent definitions and kits
- `deployment.py`: Agent deployment tracking
- `data_source.py`, `data_pipeline.py`: Data engineering entities
- `dataset.py`: Dataset management with DuckDB/Parquet support
- `tool.py`, `connector.py`: Tool and integration definitions
- `chat.py`: Chat sessions and messages

### Services (`apps/api/app/services/`)

Business logic layer (one service per model):
- `base.py`: Generic CRUD base service
- `llm.py`: Claude AI integration with fallback handling
- `context_manager.py`: Token counting, conversation summarization
- `tool_executor.py`: Tool execution framework (SQL Query, Calculator, Data Summary)
- `chat.py`: LLM-powered chat with tool integration
- Pattern: `{resource}s.py` (e.g., `agents.py`, `datasets.py`)

### Routes (`apps/api/app/api/v1/`)

FastAPI routers mounted at `/api/v1`. All routes use dependency injection via `deps.py` for database sessions and current user extraction.

## Web Frontend Structure

### Pages (`apps/web/src/pages/`)

Organized in 3-section navigation:
- **INSIGHTS**: `DashboardPage.js`, `DatasetsPage.js`
- **AI ASSISTANT**: `ChatPage.js`, `AgentsPage.js`, `AgentKitsPage.js`
- **WORKSPACE**: `DataSourcesPage.js`, `DataPipelinesPage.js`, `SettingsPage.js`

### Components (`apps/web/src/components/`)

- `Layout.js`: Authenticated layout with glassmorphic dark theme sidebar
- `wizard/`: Agent creation wizard (5-step flow with localStorage draft persistence)

## Environment Configuration

### Docker Compose Ports (root `.env`)

```
API_PORT=8001    # FastAPI backend
WEB_PORT=8002    # React frontend
DB_PORT=8003     # PostgreSQL
MCP_PORT=8086    # MCP server
ADK_PORT=8085    # ADK server
```

### API Configuration (`apps/api/.env`)

Loaded via pydantic-settings. See `apps/api/app/core/config.py`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
DATABASE_URL=postgresql://postgres:postgres@db:5432/agentprovision
SECRET_KEY=your-jwt-secret

# Temporal
TEMPORAL_ADDRESS=temporal:7233  # Use localhost:7233 for local dev

# MCP/Databricks
MCP_SERVER_URL=http://mcp-server:8000
DATABRICKS_SYNC_ENABLED=true

# ADK
ADK_BASE_URL=http://adk-server:8080
ADK_APP_NAME=agentprovision_supervisor
```

### Web Configuration (`apps/web/.env.local`)

```
REACT_APP_API_BASE_URL=http://localhost:8001
```

Uses `REACT_APP_` prefix (Create React App requirement).

## Deployment

### Kubernetes (Production - GKE)

Production deploys exclusively via Kubernetes using Helm charts and GitHub Actions.

```bash
# Deploy all services
gh workflow run deploy-all.yaml -f deploy_infrastructure=false -f environment=prod

# Deploy ADK server when agent logic changes
gh workflow run adk-deploy.yaml -f deploy=true -f environment=prod

# Watch rollout status
kubectl get pods -n prod -w
kubectl rollout status deployment/agentprovision-api -n prod
kubectl rollout status deployment/agentprovision-adk -n prod

# Validate Helm releases
helm list -n prod | grep agentprovision
helm status agentprovision-adk -n prod

# Rollback if needed
helm rollback agentprovision-api -n prod
```

**GitHub Actions Workflows** (`.github/workflows/`):
- `deploy-all.yaml`: Full stack deployment
- `adk-deploy.yaml`: ADK server only
- `agentprovision-api.yaml`: API service
- `agentprovision-web.yaml`: Web frontend
- `agentprovision-worker.yaml`: Temporal worker
- `kubernetes-infrastructure.yaml`: Initial infra setup

**Required GCP Secrets** (Secret Manager):
- `agentprovision-secret-key`, `agentprovision-database-url`
- `agentprovision-anthropic-api-key`, `agentprovision-mcp-api-key`

See `docs/KUBERNETES_DEPLOYMENT.md` for full runbook.

### E2E Testing

```bash
# Test against any environment
BASE_URL=http://localhost:8001 ./scripts/e2e_test_production.sh
BASE_URL=https://agentprovision.com ./scripts/e2e_test_production.sh
```


## Important Patterns

### Adding a New Resource

1. **Model**: `apps/api/app/models/` - SQLAlchemy model with `tenant_id` ForeignKey
2. **Schema**: `apps/api/app/schemas/` - `{Resource}Create`, `{Resource}Update`, `{Resource}InDB`
3. **Service**: `apps/api/app/services/` - Extend `base.py` CRUD, ensure tenant isolation
4. **Routes**: `apps/api/app/api/v1/` - Mount in `routes.py`
5. **Frontend**: `apps/web/src/pages/` - Add route in `App.js`, nav in `Layout.js`
6. **Helm**: Update `helm/values/` if new service needs Kubernetes resources

### Multi-tenant Query Pattern

```python
# Always filter by tenant
def get_agents(db: Session, tenant_id: uuid.UUID):
    return db.query(Agent).filter(Agent.tenant_id == tenant_id).all()
```

### Infrastructure Sync Rule

When making manual changes, always replicate them to Helm, Git, and Terraform to prevent drift.

## Additional Documentation

- `docs/KUBERNETES_DEPLOYMENT.md`: Full Kubernetes deployment runbook
- `docs/plans/`: Implementation plans (including Google ADK/Gemini integration)
- `LLM_INTEGRATION_README.md`, `TOOL_FRAMEWORK_README.md`, `DATABRICKS_SYNC_README.md`: Feature docs
