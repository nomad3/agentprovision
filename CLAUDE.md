# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentProvision is an enterprise-grade unified data & AI lakehouse platform built as a monorepo. It provides multi-tenant control plane capabilities for managing AI agents, data pipelines, notebooks, and deployments across multi-cloud environments. The platform consists of a FastAPI backend and a React frontend.

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
- Demo credentials: `retail-demo@agentprovision.com` / `SecurePass!23`

**Temporal workflows**: The platform integrates Temporal for durable workflow execution. Workflow service located at `apps/api/app/services/workflows.py`. Configuration via `TEMPORAL_ADDRESS` and `TEMPORAL_NAMESPACE` environment variables.

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

All routes use dependency injection via `deps.py` for database sessions and current user extraction.

## Web Frontend Structure

### Pages (`apps/web/src/pages/`)

One page per resource type:
- `DashboardPage.js`: Analytics overview
- `AgentsPage.js`, `AgentKitsPage.js`: Agent management
- `DeploymentsPage.js`: Deployment tracking
- `DataSourcesPage.js`, `DataPipelinesPage.js`, `DatasetsPage.js`: Data management
- `NotebooksPage.js`: Notebook interface
- `ToolsPage.js`, `ConnectorsPage.js`, `VectorStoresPage.js`: Configuration
- `ChatPage.js`: Chat interface
- `LoginPage.js`, `RegisterPage.js`: Authentication

### Components (`apps/web/src/components/`)

- `Layout.js`: Authenticated layout wrapper with navigation
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

### `apps/web/.env.local` (Web app)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Note: Despite the naming, this is a **React app** (Create React App), not Next.js. The `NEXT_PUBLIC_` prefix is used for consistency but is not required.

## Deployment

### Docker Compose (Development)

```bash
docker-compose up --build
```

Services exposed:
- API: `http://localhost:8001`
- Web: `http://localhost:8002`
- DB: `localhost:8003`

### Production Deployment (GCP VM)

Use the `deploy.sh` script for production deployment:

```bash
./deploy.sh
```

Prerequisites:
- Docker, Docker Compose, Nginx, Certbot installed on VM
- DNS A record for `agentprovision.com` pointing to VM IP
- Update `PROJECT_ROOT` variable in `deploy.sh`

The script:
1. Stops existing services
2. Builds and starts Docker containers with fixed ports
3. Configures Nginx reverse proxy
4. Obtains/renews SSL certificate via Certbot

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

### API Tests

Location: `apps/api/tests/`

- `test_api.py`: Core auth flow and endpoint smoke tests
- `test_integrations.py`: Integration hub and n8n connector tests
- `data/sample_revenue_dataset.csv`: Test fixture for dataset ingestion

Test configuration: `pytest.ini` sets `asyncio_mode = auto` for async test support.

### Web Tests

Uses React Testing Library:
- Component tests via `@testing-library/react`
- User interaction tests via `@testing-library/user-event`
- Run with `npm test`

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
