# AgentProvision

AgentProvision is an enterprise-grade platform for orchestrating AI agents across multi-cloud environments. The monorepo contains a Next.js experience for the marketing site and operator console, a FastAPI backend with seeded demo tenants, and IaC assets for provisioning infrastructure.

## Highlights

- **Multi-tenant control plane**: Manage isolated tenants, agents, deployments, and users with JWT-secured APIs.
- **Enterprise-ready authentication**: Password hashing, token issuance, and demo seed data (`retail-demo@agentprovision.com` / `SecurePass!23`) for instant evaluation.
- **Interactive console**: Protected dashboard at `/dashboard` featuring live analytics, fleet overview, deployment status, and workspace settings.
- **Composable marketing site**: Landing experience at `/` describing compliance, integrations, and workflow story for AgentProvision.
- **Infrastructure foundations**: Docker-compose for local development plus Terraform scaffolding targeting AWS (EKS, Aurora, S3).

## Repository layout

- `apps/web` – Next.js 14 + Tailwind + TypeScript. Implements landing page, auth flows, and authenticated console sections.
- `apps/api` – FastAPI service exposing auth, user, analytics, agent, and deployment endpoints with async SQLAlchemy models.
- `infra/terraform` – Terraform modules and variables for VPC, EKS, Aurora PostgreSQL, IAM roles, and log storage.
- `infra/docker` – Container definitions for API (`python:3.11-slim`) and web (`node:20-alpine`).
- `packages` – Placeholder for future shared libraries.

## Getting started

1. Copy env defaults:
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   # Create apps/web/.env.local manually if it does not exist
   # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```
2. Install dependencies:
   - Frontend: `cd apps/web && pnpm install`
   - Backend: `cd apps/api && pip install -r requirements.txt`
3. Launch via Docker Compose (recommended):
   ```bash
   docker compose up --build
   ```
   This starts FastAPI (`:8000`), Next.js (`:3000`), Postgres, and Redis. API tables seed automatically on first boot.

## Environment configuration

| File | Description |
| --- | --- |
| `.env` | Shared settings for Docker Compose (database URL, Redis, API secrets, Next.js API base). |
| `apps/api/.env` | Service-specific overrides for FastAPI (loaded via `pydantic-settings`). |
| `apps/web/.env.local` | Browser-exposed variables such as `NEXT_PUBLIC_API_BASE_URL`. |

Update `SECRET_KEY` and any external API keys before deploying. The default CORS configuration allows `http://localhost:3000` and `http://127.0.0.1:3000`.

## Demo experience

- Marketing site: visit `/` to explore positioning, features, and compliance highlights.
- Console: authenticated routes live under `/dashboard` with navigation for agents, deployments, marketplace, teams, and settings.
- Seeded accounts: try `retail-demo@agentprovision.com` / `SecurePass!23` or `health-demo@agentprovision.com` / `CareOps!42` to inspect preloaded tenants.

## API surface

Key FastAPI endpoints (all prefixed with `/api/v1`):

- `POST /auth/register` – Provision tenant + admin user.
- `POST /auth/login` – Retrieve JWT access token.
- `GET /users/me` – Fetch current user profile and tenant metadata.
- `GET /analytics/summary` – Aggregated agent + deployment stats for the tenant.
- `GET /agents` / `POST /agents` / `PUT /agents/{id}` – Tenant-scoped agent management.
- `GET /deployments` / `POST /deployments` – Deployment catalog per tenant.

Tokens follow the standard `Authorization: Bearer <token>` header pattern.

## Testing & quality

- **API**: `cd apps/api && pytest` (includes auth flow smoke test) and `ruff check app` for linting.
- **Web**: `pnpm --filter web lint` and `pnpm --filter web build` to validate Next.js compilation.
- **Terraform**: `terraform fmt -check`, `terraform init -backend=false`, and `terraform validate` under `infra/terraform`.

The CI workflow in `.github/workflows/ci.yml` runs these checks automatically on pushes/PRs.

## Integration Tests

Run integration tests that validate the Integrations Hub and n8n connector. These tests spin up the docker-compose stack (API, Postgres, Redis, n8n) and exercise live endpoints.

```
docker compose -f docker-compose.yml -p agentprovision-integration-tests up -d db redis api n8n
pnpm --filter api test -- --maxfail=1 -k integration
```

Tests expect n8n to expose `http://localhost:5678/rest/health` and the API at `http://localhost:8000`.

## Development tips

- Auth tokens persist in `localStorage`; use the sign-out button in the console header to clear the session.
- API client requests default to `cache: "no-store"` ensuring fresh data for dashboards.
- To inspect the seeded database, connect to the Postgres container (`docker compose exec db psql -U postgres agentprovision`).
- Customize tenant seed data in `apps/api/app/db/init_db.py` or extend models/services for additional resources (workflows, cost policies, etc.).

## Roadmap ideas

- Integrate OAuth/SAML SSO providers (e.g., Okta, Azure AD).
- Add agent creation wizards, evaluation dashboards, and LangGraph visual editor.
- Expand observability: connect OpenTelemetry traces to Grafana dashboards, expose FinOps insights via cost APIs.
- Automate deployments with GitHub Actions to a managed environment (EKS/GKE) using the Terraform modules.

> 🚀 AgentProvision is the foundation for building agent lifecycle management, multi-tenant security, and infrastructure automation across enterprise environments.

## Production deployment

- Build hardened images with `docker compose -f docker-compose.prod.yml build` (uses multi-stage Next.js container).
- Provide production secrets via environment variables: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `CORS_ORIGINS`, and `NEXT_PUBLIC_API_BASE_URL`.
- Set `SEED_DEMO_DATA=false` in production to skip loading demo tenants during startup.
- Run `docker compose -f docker-compose.prod.yml up -d` to launch API, web, Postgres, and Redis.

## Observability & public metrics

- Health checks: `/health/live` and `/health/ready`.
- Tenant analytics: `/api/v1/analytics/summary` (JWT protected).
- Public landing metrics: `/api/v1/analytics/public/metrics` (used by the marketing site).
