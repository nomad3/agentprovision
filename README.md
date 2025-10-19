# AgentProvision: The Unified Data & AI Lakehouse Platform

AgentProvision is an enterprise-grade platform designed to bring together all your data, analytics, and AI workloads, much like a modern data lakehouse. It provides a unified environment for data engineering, data science, machine learning, and business intelligence, enabling seamless orchestration of AI agents across multi-cloud environments.

## Highlights

- **Multi-tenant control plane**: Manage isolated tenants, agents, deployments, and users with JWT-secured APIs.
- **Enterprise-ready authentication**: Password hashing, token issuance, and demo seed data (`retail-demo@agentprovision.com` / `SecurePass!23`) for instant evaluation.
- **Interactive console**: Protected dashboard at `/dashboard` featuring live analytics, fleet overview, deployment status, and workspace settings.
- **Composable marketing site**: Landing experience at `/` describing compliance, integrations, and workflow story for AgentProvision.
- **Infrastructure foundations**: Docker-compose for local development plus Terraform scaffolding targeting AWS (EKS, Aurora, S3).

## Repository layout

- `apps/web` – React + Bootstrap + JavaScript. Implements landing page, auth flows, and authenticated console sections.
- `apps/api` – FastAPI service exposing auth, user, analytics, agent, deployment, data source, data pipeline, and notebook endpoints with async SQLAlchemy models.
- `infra/terraform` – Terraform modules and variables for VPC, EKS, Aurora PostgreSQL, IAM roles, and log storage.
- `infra/docker` – Container definitions for API (`python:3.11-slim`) and web (`node:20-alpine` with Nginx).
- `packages` – Placeholder for future shared libraries.

## Getting started

To deploy AgentProvision to a GCP VM, use the provided `deploy.sh` script. This script handles:
- Checking for Docker, Docker Compose, Nginx, and Certbot prerequisites.
- Stopping any existing Docker Compose services for AgentProvision.
- Building and starting the Docker Compose services (API, Web, DB) with fixed, non-conflicting ports.
- Configuring Nginx on the host for `agentprovision.com` (HTTP to HTTPS redirect, proxying to Web and API services).
- Obtaining/renewing an SSL certificate using Certbot.

**Deployment Steps:**
1.  **Clone the repository** to your GCP VM.
2.  **Ensure prerequisites are installed** on your VM: Docker, Docker Compose, Nginx, Certbot.
3.  **Configure DNS:** Point the DNS A record for `agentprovision.com` to the external IP address of your GCP VM.
4.  **Update `PROJECT_ROOT`:** Edit the `deploy.sh` script and set the `PROJECT_ROOT` variable to the absolute path of your cloned repository on the VM.
5.  **Run the deployment script:**
    ```bash
    ./deploy.sh
    ```

## Environment configuration

| File | Description |
| --- | --- |
| `.env` | Shared settings for Docker Compose (database URL, Redis, API secrets, Next.js API base). |
| `apps/api/.env` | Service-specific overrides for FastAPI (loaded via `pydantic-settings`). |
| `apps/web/.env.local` | Browser-exposed variables such as `NEXT_PUBLIC_API_BASE_URL`. |

**Fixed Ports used by `deploy.sh`:**
- API Service: Host Port `8001` (maps to container port `8000`)
- Web Service: Host Port `8002` (maps to container port `80`)
- DB Service: Host Port `8003` (maps to container port `5432`)

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
- `GET /data_sources` / `POST /data_sources` – Tenant-scoped data source management.
- `GET /data_pipelines` / `POST /data_pipelines` – Tenant-scoped data pipeline management.
- `GET /notebooks` / `POST /notebooks` – Tenant-scoped notebook management.

Tokens follow the standard `Authorization: Bearer <token>` header pattern.

## Testing & quality

- **API**: `cd apps/api && pytest` (includes auth flow smoke test) and `ruff check app` for linting.
- **Web**: `cd apps/web && npm test` and `npm run build` to validate React compilation.
- **Terraform**: `terraform fmt -check`, `terraform init -backend=false`, and `terraform validate` under `infra/terraform`.

The CI workflow in `.github/workflows/ci.yml` runs these checks automatically on pushes/PRs.

## Integration Tests

Run integration tests that validate the Integrations Hub and n8n connector. These tests spin up the docker-compose stack (API, Postgres, Redis, n8n) and exercise live endpoints.

```bash
docker-compose -f docker-compose.yml -p agentprovision-integration-tests up -d db redis api n8n
# Assuming the API is accessible on port 8001 and web on 8002
# You might need to adjust the test command based on your test runner
# For example, if using pytest for API tests:
# docker-compose exec api pytest --maxfail=1 -k integration
```

Tests expect n8n to expose `http://localhost:5678/rest/health` and the API at `http://localhost:8001`.

## Development tips

- Auth tokens persist in `localStorage`; use the sign-out button in the console header to clear the session.
- API client requests default to `cache: "no-store"` ensuring fresh data for dashboards.
- To inspect the seeded database, connect to the Postgres container (`docker-compose exec db psql -U postgres agentprovision`).
- Customize tenant seed data in `apps/api/app/db/init_db.py` or extend models/services for additional resources (workflows, cost policies, etc.).

## Roadmap ideas

- Integrate OAuth/SAML SSO providers (e.g., Okta, Azure AD).
- Add agent creation wizards, evaluation dashboards, and LangGraph visual editor.
- Expand observability: connect OpenTelemetry traces to Grafana dashboards, expose FinOps insights via cost APIs.
- Automate deployments with GitHub Actions to a managed environment (EKS/GKE) using the Terraform modules.

> 🚀 AgentProvision is the foundation for building agent lifecycle management, multi-tenant security, and infrastructure automation across enterprise environments.

## Production deployment

To deploy to production, use the `deploy.sh` script on your target VM. Ensure the `PROJECT_ROOT` variable is correctly set within the script.

## Observability & public metrics

- Health checks: `/health/live` and `/health/ready`.
- Tenant analytics: `/api/v1/analytics/summary` (JWT protected).
- Public landing metrics: `/api/v1/analytics/public/metrics` (used by the marketing site).