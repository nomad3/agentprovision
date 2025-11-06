# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentProvision is an enterprise-grade unified data & AI lakehouse platform built as a monorepo. It provides multi-tenant control plane capabilities for managing AI agents, data pipelines, notebooks, and deployments across multi-cloud environments. The platform consists of a FastAPI backend and a React frontend.

**Recent Features**:
- ✅ **Real-time Analytics Dashboard**: Live platform metrics pulling real data from database (agents, deployments, chat activity, datasets)
- ✅ **Conversation Context & Memory Management**: Automatic token tracking, conversation summarization, and smart context window management (see `CONTEXT_MANAGEMENT_README.md`)
- ✅ **Tool Execution Framework**: Extensible system for agents with SQL Query, Calculator, and Data Summary tools (see `TOOL_FRAMEWORK_README.md`)
- ✅ **Claude AI Integration**: Intelligent chat responses for data analysis (see `LLM_INTEGRATION_README.md`)
- ✅ **UX Redesign**: Business-friendly interface with simplified navigation (INSIGHTS, AI ASSISTANT, WORKSPACE)
- ✅ **Dataset Management**: CSV/Excel upload with Parquet storage and DuckDB querying
- ✅ **Multi-tenant Architecture**: Full isolation with JWT authentication

## Architecture

### Monorepo Structure

This is a **Turborepo monorepo** managed with `pnpm` workspaces:

- **`apps/api`**: FastAPI backend (Python 3.11)
  - Multi-tenant JWT-secured REST API
  - Async SQLAlchemy with PostgreSQL
  - Temporal workflow integration for orchestration
  - Seed data initialization on startup via `init_db.py`

- **`apps/web`**: React SPA (JavaScript, React 18)
  - Bootstrap 5 + React Bootstrap UI
  - React Router v7 for navigation
  - i18next for internationalization
  - Authenticated console at `/dashboard/*`
  - Marketing landing page at `/`

- **`infra/terraform`**: Infrastructure as Code for AWS deployment (EKS, Aurora PostgreSQL, VPC, IAM)

- **`packages`**: Future shared libraries (currently placeholder)

### Key Architectural Patterns

**Multi-tenancy**: All data models include a `tenant_id` foreign key. The API enforces tenant isolation via JWT token validation. Users belong to tenants; all operations are scoped to the authenticated user's tenant.

**Authentication flow**:
1. `POST /api/v1/auth/register` creates tenant + admin user
2. `POST /api/v1/auth/login` returns JWT access token
3. All protected endpoints require `Authorization: Bearer <token>` header
4. Current user/tenant retrieved via `GET /api/v1/users/me`

**Database initialization**: On API startup, `apps/api/app/main.py` calls `init_db()` which:
- Creates all SQLAlchemy tables via metadata.create_all
- Seeds demo tenants and users (see `apps/api/app/db/init_db.py`)
- Demo credentials: `test@example.com` / `password`

**LLM Integration**: The chat functionality (`/api/v1/chat`) now uses Claude AI for intelligent responses:
- Analyzes datasets with statistical insights
- Context-aware conversations with full history
- Agent kit-driven analysis based on objectives and metrics
- Falls back to static templates if `ANTHROPIC_API_KEY` is not configured
- See `LLM_INTEGRATION_README.md` for setup and usage

**Temporal workflows**: The platform integrates Temporal for durable workflow execution. Workflow service located at `apps/api/app/services/workflows.py`. Configuration via `TEMPORAL_ADDRESS` and `TEMPORAL_NAMESPACE` environment variables.

**Databricks Integration**: Datasets automatically sync to Databricks Unity Catalog via MCP server using Temporal workflows:
- Bronze layer: External table pointing to Parquet file
- Silver layer: Managed table with type inference and data cleaning
- Asynchronous sync with automatic retry logic (3 attempts, 5-minute intervals)
- Multi-tenant isolation via Unity Catalog per-tenant catalogs
- Status tracking in dataset metadata (`sync_status`: pending/syncing/synced/failed)
- Graceful degradation: Local DuckDB always available, Databricks is additive
- See `DATABRICKS_SYNC_README.md` for detailed documentation

## Development Commands

### Initial Setup

```bash
# Install dependencies
pnpm install

# Start Docker services (API, Web, DB)
docker-compose up --build
```

### API Development

```bash
cd apps/api

# Run API server locally (outside Docker)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run tests with async support (configured in pytest.ini)
pytest -v

# Lint code
ruff check app

# Run a single test file
pytest tests/test_api.py

# Run specific test
pytest tests/test_api.py::test_login
```

### Web Development

```bash
cd apps/web

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Linting (if configured)
npm run lint
```

### Monorepo Commands (from root)

```bash
# Build all apps
pnpm build
# or
turbo build

# Run all dev servers
pnpm dev
# or
turbo dev

# Lint all apps
pnpm lint
# or
turbo lint

# Format code
pnpm format
```

### Integration Tests

```bash
# Start services for integration testing
docker-compose -f docker-compose.yml -p agentprovision-integration-tests up -d db redis api n8n

# Run integration tests
cd apps/api
pytest tests/test_integrations.py
```

### Database Operations

```bash
# Connect to PostgreSQL in Docker
docker-compose exec db psql -U postgres agentprovision

# View logs
docker-compose logs -f api
docker-compose logs -f web
```

### Demo Workflow Script

```bash
# Run end-to-end workflow demo (requires Temporal)
./scripts/run_demo_workflow.sh

# Skip workflow execution, only create dataset
SKIP_WORKFLOW=true ./scripts/run_demo_workflow.sh

# Describe workflow after creation
DESCRIBE=true ./scripts/run_demo_workflow.sh
```

### Docker Port Management

To avoid port conflicts when running multiple projects:

```bash
# Use custom ports (recommended for development)
DB_PORT=8003 API_PORT=8001 WEB_PORT=8002 docker-compose up -d

# Stop and remove all containers
docker-compose down

# Rebuild after code changes
docker-compose up --build -d

# View service logs
docker-compose logs -f api
docker-compose logs -f web
```

## API Structure

### Models (`apps/api/app/models/`)

Core domain models (all inherit from SQLAlchemy Base):
- `tenant.py`: Tenant entity for multi-tenancy
- `user.py`: Users belong to tenants
- `agent.py`, `agent_kit.py`: AI agent definitions and kits
- `deployment.py`: Agent deployment tracking
- `data_source.py`, `data_pipeline.py`: Data engineering entities
- `dataset.py`: Dataset management with DuckDB/Parquet support
- `notebook.py`: Jupyter-style notebook metadata
- `tool.py`, `connector.py`: Tool and integration definitions
- `vector_store.py`: Vector database configurations
- `chat.py`: Chat sessions and messages

### Services (`apps/api/app/services/`)

Business logic layer (one service per model):
- `base.py`: Generic CRUD base service
- `analytics.py`: Aggregated tenant metrics
- `workflows.py`: Temporal workflow client integration
- `llm.py`: **NEW** - Claude AI integration for intelligent chat responses
  - Anthropic SDK wrapper
  - Conversation history management
  - Dynamic system prompt builder for data analysis
  - Fallback handling for unavailable LLM
- `context_manager.py`: **NEW** - Conversation context & memory management
  - Token counting and tracking
  - Automatic conversation summarization
  - Smart context window management
  - Prevents exceeding Claude's token limits
- `tool_executor.py`: **NEW** - Tool execution framework for agents
  - Base Tool class and ToolRegistry
  - Built-in tools: SQL Query, Calculator, Data Summary
  - Extensible system for adding custom tools
- `chat.py`: Chat service now uses real LLM responses (previously static templates)
  - Integrated with tool framework for SQL queries, calculations, and summaries
  - Context-aware with automatic memory management
- Other services follow pattern: `{resource}s.py` (e.g., `agents.py`, `datasets.py`)

### Routes (`apps/api/app/api/v1/`)

FastAPI routers (mounted at `/api/v1`):
- `auth.py`: Registration, login
- `analytics.py`: Dashboard summaries, public metrics
- `agents.py`, `agent_kits.py`: Agent management
- `deployments.py`: Deployment CRUD
- `data_sources.py`, `data_pipelines.py`: Data engineering
- `datasets.py`: Dataset ingestion and queries
- `notebooks.py`: Notebook management
- `tools.py`, `connectors.py`: Tool/connector catalog
- `vector_stores.py`: Vector store configurations
- `chat.py`: Chat session endpoints
- `databricks.py`: Databricks integration via MCP server

All routes use dependency injection via `deps.py` for database sessions and current user extraction.

**Important**: The API uses **synchronous** SQLAlchemy (not async) despite having `asyncpg` in the DATABASE_URL. The async driver is for future compatibility, but current code uses `Session` and synchronous queries.

## Web Frontend Structure

### Pages (`apps/web/src/pages/`)

One page per resource type (organized in 3-section navigation):

**INSIGHTS Section**:
- `DashboardPage.js`: Analytics overview (home)
- `DatasetsPage.js`: Reports & Data management (with AI analysis)

**AI ASSISTANT Section**:
- `ChatPage.js`: Ask AI - Intelligent chat interface with Claude
- `AgentsPage.js`: AI Assistants management
- `AgentKitsPage.js`: AI Templates (playbook orchestration)

**WORKSPACE Section**:
- `DataSourcesPage.js`: Data Connections
- `DataPipelinesPage.js`: Automations (ETL workflows)
- `SettingsPage.js`: Settings (currently NotebooksPage)

**Authentication**:
- `LoginPage.js`, `RegisterPage.js`: Login and registration
- `LandingPage.js`: Marketing landing page

### Components (`apps/web/src/components/`)

- `Layout.js`: Authenticated layout with 3-section sidebar navigation
  - Glassmorphic design with dark theme
  - Sections: INSIGHTS, AI ASSISTANT, WORKSPACE
  - User dropdown in footer
- `Layout.css`: Updated with scrollable sidebar, visible scrollbar
- `marketing/`: Landing page components

### Services (`apps/web/src/services/`)

API client wrappers (uses axios):
- Centralized API base URL configuration
- JWT token management via localStorage

## Environment Configuration

### `.env` (root level, used by docker-compose)

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/agentprovision
SECRET_KEY=your_secret_key
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
API_PORT=8001
WEB_PORT=8002
DB_PORT=8003
```

### `apps/api/.env` (API service overrides)

Loaded via pydantic-settings. See `apps/api/app/core/config.py` for available settings:
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`: Auth config
- `DATABASE_URL`: PostgreSQL connection string
- `DATA_STORAGE_PATH`: Local data file storage
- `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`: Temporal connection
- `DEFAULT_WORKFLOW_TIMEOUT_SECONDS`: Workflow timeout
- **MCP Configuration**:
  - `MCP_SERVER_URL`: MCP server endpoint (default: `http://localhost:8085`)
  - `MCP_API_KEY`: Authentication key for MCP server
  - `MCP_ENABLED`: Feature flag for MCP/Databricks integration (default: `True`)
- **LLM Configuration**:
  - `ANTHROPIC_API_KEY`: Your Anthropic API key (required for AI chat)
  - `LLM_MODEL`: Claude model to use (default: `claude-3-5-sonnet-20241022`)
  - `LLM_MAX_TOKENS`: Maximum response length (default: `4096`)
  - `LLM_TEMPERATURE`: Response creativity (default: `0.7`)

**Example `.env` file**:
```
# Required for LLM features
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx

# Optional LLM customization
LLM_MODEL=claude-3-5-sonnet-20241022
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7
```

### `apps/web/.env.local` (Web app)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Note: Despite the naming, this is a **React app** (Create React App), not Next.js. The `NEXT_PUBLIC_` prefix is used for consistency but is not required.

## Deployment

### Docker Compose (Development)

```bash
# Use specific ports to avoid conflicts
DB_PORT=8003 API_PORT=8001 WEB_PORT=8002 docker-compose up -d --build

# Or simply (uses default .env ports):
docker-compose up --build
```

Services exposed:
- API: `http://localhost:8001`
- Web: `http://localhost:8002`
- DB: `localhost:8003`

**Important**: Ensure `ANTHROPIC_API_KEY` is set in `apps/api/.env` for AI chat functionality.

### Production Deployment (GCP VM)

Use the `deploy.sh` script for production deployment:

```bash
./deploy.sh
```

Prerequisites:
- Docker, Docker Compose, Nginx, Certbot installed on VM
- DNS A record for `agentprovision.com` pointing to VM IP
- Update `PROJECT_ROOT` variable in `deploy.sh`

The deployment script performs the following steps:
1. Stops existing services
2. Dynamically generates `docker-compose.temporal.yml` with configured ports
3. Builds and starts Docker containers (including Temporal server) with fixed ports
4. Configures Nginx reverse proxy
5. Obtains/renews SSL certificate via Certbot
6. **Waits for API to be ready** (up to 60 seconds)
7. **Runs end-to-end tests automatically** (`scripts/e2e_test_production.sh`)
8. Reports test results and exits with error code if tests fail

The deployment script automatically includes Temporal server setup, exposing:
- Temporal gRPC on port `7233` (configurable via `TEMPORAL_GRPC_PORT`)
- Temporal Web UI on port `8233` (configurable via `TEMPORAL_WEB_PORT`)

**Important**: The deployment will **fail** (exit code 1) if E2E tests don't pass, preventing broken deployments from being considered successful. Review test output to identify and fix issues before redeploying.

### Terraform (AWS Infrastructure)

```bash
cd infra/terraform

# Initialize (skip backend for validation)
terraform init -backend=false

# Validate configuration
terraform validate

# Format check
terraform fmt -check

# Plan deployment
terraform plan

# Apply (creates EKS cluster, Aurora DB, VPC, etc.)
terraform apply
```

## Testing Strategy

### End-to-End Tests (Production)

Location: `scripts/e2e_test_production.sh`

Comprehensive E2E test suite that validates the entire platform:
- 22 test cases covering all major endpoints
- Automatic execution during deployment via `deploy.sh`
- Can be run manually against any environment

```bash
# Test production
./scripts/e2e_test_production.sh

# Test staging or local
BASE_URL=https://staging.example.com ./scripts/e2e_test_production.sh
BASE_URL=http://localhost:8001 ./scripts/e2e_test_production.sh
```

**Test Coverage**:
- ✅ Public endpoints (homepage, API root)
- ✅ Authentication flow (registration, login, token validation)
- ✅ All 13 resource types (agents, datasets, deployments, etc.)
- ✅ Feature workflows (dataset ingestion, agent kit creation, chat sessions)

**Test Results**: See `E2E_TEST_FINDINGS.md` for detailed analysis of test results and known issues.

### API Unit Tests

Location: `apps/api/tests/`

- `test_api.py`: Core auth flow and endpoint smoke tests
- `test_integrations.py`: Integration hub and n8n connector tests
- `data/sample_revenue_dataset.csv`: Test fixture for dataset ingestion

Test configuration: Root `pytest.ini` configures pytest for the entire monorepo.

```bash
cd apps/api
pytest                                # Run all tests
pytest tests/test_api.py              # Run specific test file
pytest tests/test_api.py::test_login  # Run specific test
pytest -v                             # Verbose output
```

### Web Tests

Uses React Testing Library:
- Component tests via `@testing-library/react`
- User interaction tests via `@testing-library/user-event`

```bash
cd apps/web
npm test          # Run tests in watch mode
npm test -- --ci  # Run tests once (CI mode)
```

## Important Patterns

### Adding a New Resource

1. **Model**: Create SQLAlchemy model in `apps/api/app/models/`
   - Inherit from `Base`
   - Add `tenant_id` ForeignKey for multi-tenancy
   - Import in `apps/api/app/db/init_db.py`

2. **Schema**: Create Pydantic schemas in `apps/api/app/schemas/`
   - `{Resource}Create`, `{Resource}Update`, `{Resource}InDB`

3. **Service**: Create service in `apps/api/app/services/`
   - Extend `base.py` CRUD operations or implement custom logic
   - Ensure tenant isolation in queries

4. **Routes**: Create router in `apps/api/app/api/v1/`
   - Use `current_user` dependency for authentication
   - Mount in `apps/api/app/api/v1/routes.py`

5. **Frontend Page**: Create page in `apps/web/src/pages/`
   - Implement CRUD UI
   - Add route in `App.js`
   - Add navigation link in `Layout.js`

### Multi-tenant Query Pattern

Always filter by tenant:

```python
# In service
def get_agents(db: Session, tenant_id: uuid.UUID):
    return db.query(Agent).filter(Agent.tenant_id == tenant_id).all()

# In route
@router.get("/agents")
def list_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return agent_service.get_agents(db, current_user.tenant_id)
```

### Authentication in Frontend

```javascript
// Store token after login
localStorage.setItem('token', response.data.access_token);

// Include in API requests
axios.get('/api/v1/agents', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Clear on logout
localStorage.removeItem('token');
```

## Data Storage

### Datasets

- Ingested via `POST /api/v1/datasets/ingest` with JSON records
- Stored as Parquet files using DuckDB
- Storage path: `DATA_STORAGE_PATH` (default `/app/storage`)
- Query via `GET /api/v1/datasets/{id}/query?sql=<query>`

### Database Schema

Tables auto-created on startup. Key relationships:
- `tenants` ← (1:N) → `users`, `agents`, `deployments`, etc.
- `agent_kits` ← (1:N) → `agents` (optional relationship)
- `agents` ← (1:N) → `deployments`

## Temporal Integration

Workflow execution managed via Temporal:

```python
from app.services import workflows

# Start workflow
handle = await workflows.start_workflow(
    workflow_type="MorningRoutineWorkflow",
    tenant_id=tenant_uuid,
    task_queue="agentprovision-lifeops",
    arguments={"dataset_id": "..."},
)

# Describe workflow
info = await workflows.describe_workflow(
    workflow_id=handle.id,
    run_id=handle.first_execution_run_id,
)
```

Configuration:
- `TEMPORAL_ADDRESS`: Temporal server address (e.g., `localhost:7233`)
- `TEMPORAL_NAMESPACE`: Namespace (default: `default`)

Demo workflow script: `scripts/run_demo_workflow.sh`

## Additional Documentation

**Active Feature Documentation:**
- `LLM_INTEGRATION_README.md`: Claude AI integration setup and usage
- `CONTEXT_MANAGEMENT_README.md`: Conversation memory and token management
- `TOOL_FRAMEWORK_README.md`: Agent tool execution framework
- `DATABRICKS_SYNC_README.md`: Automatic dataset sync to Databricks Unity Catalog

**Planning & Design Documents:**
- `docs/plans/`: Implementation plans and design documents
- `docs/archive/`: Legacy planning docs and historical test results
