# Google ADK + Gemini 2.5 Flash Integration

## Overview

AgentProvision now uses **Google Agent Development Kit (ADK)** with **Gemini 2.5 Flash** as the core AI engine, replacing the previous Claude/Anthropic integration.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  API Service    │────▶│  ADK Service    │
│  (React)        │     │  (FastAPI)      │     │  (Google ADK)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Gemini 2.5     │
                                               │  Flash (Vertex) │
                                               └─────────────────┘
```

### Service Components

| Service | Purpose | Port |
|---------|---------|------|
| `agentprovision-web` | React frontend | 80 |
| `agentprovision-api` | FastAPI backend, auth, data | 80 → 8000 |
| `agentprovision-adk` | Google ADK agent server | 80 → 8080 |
| `mcp-server` | Databricks MCP connector | 80 → 8000 |

## Agent Structure

The ADK service uses a **supervisor pattern** with specialist sub-agents:

```
agentprovision_supervisor (root)
├── data_analyst
│   ├── discover_datasets
│   ├── query_sql
│   ├── generate_insights
│   └── forecast
├── report_generator
│   ├── generate_report
│   ├── format_output
│   └── create_visualization
└── knowledge_manager
    ├── search_knowledge
    ├── store_entity
    └── record_observation
```

## Configuration

### Environment Variables (API Service)

| Variable | Description | Example |
|----------|-------------|---------|
| `ADK_BASE_URL` | ADK service URL | `http://agentprovision-adk` |
| `ADK_APP_NAME` | ADK app name | `agentprovision_supervisor` |

### Environment Variables (ADK Service)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_GENAI_USE_VERTEXAI` | Use Vertex AI | `TRUE` |
| `ADK_MODEL` | Gemini model | `gemini-2.5-flash` |
| `VERTEX_PROJECT` | GCP project | `ai-agency-479516` |
| `VERTEX_LOCATION` | GCP region | `us-central1` |

## Authentication

The ADK service uses **Workload Identity** for GCP authentication:
- No API keys needed
- Service account: `dev-backend-app@ai-agency-479516.iam.gserviceaccount.com`
- Permissions: Vertex AI User, AI Platform Admin

## Chat Flow

1. User sends message via frontend (`/chat` page)
2. Frontend calls `POST /api/v1/chat/sessions/{id}/messages`
3. API service creates session with ADK via `POST /apps/{app}/users/{user}/sessions`
4. API sends message to ADK via `POST /run`
5. ADK routes to appropriate sub-agent
6. Gemini generates response
7. Response returned through chain to frontend

## Deployment

### CI/CD Workflows

- `.github/workflows/agentprovision-api.yaml` - API service
- `.github/workflows/adk-deploy.yaml` - ADK service

### Helm Values

- `helm/values/agentprovision-api.yaml`
- `helm/values/agentprovision-adk.yaml`

## Monitoring

Check ADK logs:
```bash
kubectl logs -n prod -l app.kubernetes.io/name=agentprovision-adk --tail=100
```

Verify ADK health:
```bash
kubectl exec -n prod $(kubectl get pods -n prod -l app.kubernetes.io/name=agentprovision-adk -o name) -- curl http://localhost:8080/list-apps
```

## Date Completed

December 18, 2025
