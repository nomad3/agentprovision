# Databricks Integration Plan for AgentProvision

**Version:** 1.0
**Date:** October 30, 2025
**Status:** Planning Phase

## Executive Summary

This document outlines the comprehensive plan to integrate Databricks as the primary data processing and AI workload engine for AgentProvision. Databricks will handle all heavy lifting for data jobs, AI model serving, and analytics, while leveraging the existing dentalERP MCP server for external system integrations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Integration Strategy](#integration-strategy)
3. [Core Components](#core-components)
4. [Implementation Phases](#implementation-phases)
5. [API Design](#api-design)
6. [MCP Server Integration](#mcp-server-integration)
7. [Security & Governance](#security--governance)
8. [Monitoring & Observability](#monitoring--observability)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AgentProvision Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Web App    │────▶ │  FastAPI     │────▶ │  PostgreSQL  │  │
│  │   (React)    │      │   Backend    │      │   Database   │  │
│  └──────────────┘      └──────┬───────┘      └──────────────┘  │
│                               │                                  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  Databricks Unity    │        │   DentalERP MCP      │
    │     Catalog          │        │      Server          │
    ├──────────────────────┤        ├──────────────────────┤
    │ • Data Lakehouse     │        │ • ADP Integration    │
    │ • Jobs API 2.2       │        │ • NetSuite API       │
    │ • Model Serving      │        │ • DentalIntel        │
    │ • SQL Warehouse      │        │ • Eaglesoft/Dentrix  │
    │ • Iceberg Tables     │        │ • Snowflake Bridge   │
    │ • LakeFlow Connect   │        └──────────────────────┘
    └──────────────────────┘
```

### Key Design Principles

1. **Databricks as Compute Engine**: All heavy data processing, transformations, and AI workloads run on Databricks
2. **MCP as Integration Hub**: External system integrations remain in MCP server (proven, battle-tested)
3. **Unity Catalog as Source of Truth**: Centralized data governance and metadata management
4. **API-First Design**: All interactions via REST APIs for flexibility and scalability
5. **Multi-Tenancy**: Tenant isolation at both AgentProvision and Databricks Unity Catalog levels

---

## Integration Strategy

### Phase 1: Foundation (Weeks 1-2)

**Objective**: Establish basic Databricks connectivity and authentication

**Deliverables**:
- Databricks workspace setup with Unity Catalog
- Authentication mechanism (OAuth 2.0 or Personal Access Tokens)
- Basic connector service in AgentProvision API
- Health check endpoints
- Configuration management

### Phase 2: Data Pipelines (Weeks 3-5)

**Objective**: Implement data ingestion and processing pipelines

**Deliverables**:
- LakeFlow Connect integration for data ingestion
- Data pipeline orchestration via Jobs API 2.2
- Bronze/Silver/Gold layer architecture
- MCP server data source integration
- Scheduled data sync jobs

### Phase 3: AI Workloads (Weeks 6-8)

**Objective**: Enable AI agent execution on Databricks

**Deliverables**:
- Model serving infrastructure setup
- Agent execution environment (MLflow integration)
- Vector store integration (Unity Catalog + Vector Search)
- Real-time inference endpoints
- Agent deployment pipeline

### Phase 4: Advanced Features (Weeks 9-12)

**Objective**: Production-ready features and optimization

**Deliverables**:
- Query federation (cross-system queries)
- Advanced monitoring and alerting
- Cost optimization strategies
- Auto-scaling policies
- Disaster recovery procedures

---

## Core Components

### 1. Databricks Connector Service

**Location**: `apps/api/app/services/databricks/`

**Responsibilities**:
- Manage Databricks REST API connections
- Handle authentication and token refresh
- Provide high-level abstractions for common operations
- Implement retry logic and circuit breakers
- Cache frequently accessed metadata

**Key Files**:
```
apps/api/app/services/databricks/
├── __init__.py
├── client.py           # Base Databricks REST client
├── jobs.py             # Jobs API 2.2 wrapper
├── clusters.py         # Cluster management
├── unity_catalog.py    # Unity Catalog operations
├── model_serving.py    # Model serving endpoints
├── sql_warehouse.py    # SQL warehouse queries
└── utils.py            # Helper functions
```

### 2. Data Pipeline Orchestrator

**Purpose**: Coordinate data flows between MCP server, AgentProvision DB, and Databricks

**Architecture**:
```python
# Workflow Example
1. Trigger: User creates a data source
2. AgentProvision API → Create Unity Catalog external table
3. AgentProvision API → Submit Databricks Job (ingestion)
4. Databricks → Fetch data from MCP server endpoint
5. Databricks → Transform and load to Bronze layer
6. Databricks → Trigger Silver layer transformations
7. Databricks → Update metadata in AgentProvision DB
8. AgentProvision API → Notify user of completion
```

**Technologies**:
- Databricks Jobs API 2.2 (multi-task workflows)
- Temporal (optional, for complex orchestration)
- PostgreSQL (metadata tracking)

### 3. Unity Catalog Integration

**Metadata Structure**:
```
unity_catalog/
├── catalogs/
│   └── agentprovision_{tenant_id}/    # Tenant-isolated catalogs
│       ├── bronze/                     # Raw ingested data
│       │   ├── mcp_adp_employees
│       │   ├── mcp_netsuite_transactions
│       │   └── raw_customer_data
│       ├── silver/                     # Cleaned & standardized
│       │   ├── employees
│       │   ├── transactions
│       │   └── customers
│       └── gold/                       # Business-ready aggregates
│           ├── monthly_kpis
│           ├── agent_performance
│           └── ml_features
```

**Governance Features**:
- Row-level security per tenant
- Column-level masking for PII
- Audit logging (all access tracked)
- Data lineage tracking

### 4. AI Agent Execution Engine

**Components**:

**Agent Runtime**:
- Databricks notebooks or Python wheels
- MLflow for experiment tracking
- Model registry for versioning
- Secrets management for API keys

**Model Serving**:
- Real-time endpoints (< 100ms latency)
- Batch inference jobs
- Auto-scaling (0 to 250k QPS)
- A/B testing support

**Example Agent Workflow**:
```python
# 1. User creates agent in AgentProvision UI
# 2. AgentProvision API creates MLflow experiment
# 3. Agent code packaged as Python wheel
# 4. Wheel uploaded to Unity Catalog
# 5. Databricks job created for agent execution
# 6. Model serving endpoint deployed
# 7. API routes traffic to Databricks endpoint
```

---

## API Design

### New API Endpoints

#### Databricks Jobs Management

```python
# Create a data pipeline job
POST /api/v1/databricks/jobs
{
  "name": "Ingest MCP Data",
  "tasks": [
    {
      "task_key": "fetch_from_mcp",
      "notebook_task": {
        "notebook_path": "/Shared/ingestion/mcp_fetch",
        "base_parameters": {
          "tenant_id": "{{tenant_id}}",
          "source": "adp_employees"
        }
      }
    },
    {
      "task_key": "transform_bronze_to_silver",
      "depends_on": [{"task_key": "fetch_from_mcp"}],
      "spark_python_task": {
        "python_file": "/ingestion/transform.py"
      }
    }
  ],
  "schedule": {
    "quartz_cron_expression": "0 0 2 * * ?",
    "timezone_id": "America/Los_Angeles"
  }
}

# Run a job
POST /api/v1/databricks/jobs/{job_id}/run
{
  "job_parameters": {
    "date": "2025-10-30"
  }
}

# Get job run status
GET /api/v1/databricks/runs/{run_id}

# List job runs
GET /api/v1/databricks/jobs/{job_id}/runs?limit=25
```

#### Unity Catalog Operations

```python
# Create tenant catalog
POST /api/v1/databricks/catalogs
{
  "name": "agentprovision_tenant_abc123",
  "comment": "Tenant ABC123 data catalog"
}

# Create schema
POST /api/v1/databricks/catalogs/{catalog_name}/schemas
{
  "name": "bronze",
  "comment": "Raw data layer"
}

# Query data
POST /api/v1/databricks/sql/query
{
  "warehouse_id": "abc123",
  "catalog": "agentprovision_tenant_abc123",
  "schema": "gold",
  "statement": "SELECT * FROM monthly_kpis WHERE month = '2025-10'"
}
```

#### Model Serving

```python
# Deploy agent as model
POST /api/v1/databricks/serving-endpoints
{
  "name": "customer-support-agent",
  "config": {
    "served_models": [
      {
        "name": "prod-model",
        "model_name": "customer_support_agent",
        "model_version": "3",
        "workload_size": "Small",
        "scale_to_zero_enabled": true
      }
    ]
  }
}

# Invoke agent
POST /api/v1/agents/{agent_id}/invoke
{
  "input": {
    "query": "What are our top performing locations?",
    "context": {"user_id": "user123"}
  }
}
```

---

## MCP Server Integration

### Integration Points

#### 1. Data Source Registration

**Flow**:
```
User adds data source in AgentProvision UI
    ↓
AgentProvision creates connector config
    ↓
MCP Server registers external system credentials
    ↓
Databricks job created to sync data
    ↓
LakeFlow Connect pulls data via MCP REST API
```

**MCP Endpoints Used**:
- `POST /api/v1/integrations/register` - Register new integration
- `GET /api/v1/integrations/{integration_id}/data` - Fetch data
- `GET /api/v1/integrations/status` - Health check

#### 2. Real-Time Data Access

**Scenario**: Agent needs current employee data from ADP

**Flow**:
```
Agent query → AgentProvision API → Databricks endpoint
    ↓
Databricks checks cache (Unity Catalog)
    ↓
If stale → Databricks REST call to MCP server
    ↓
MCP fetches from ADP → Returns to Databricks
    ↓
Databricks caches in Unity Catalog
    ↓
Returns to agent
```

**Implementation**:
```python
# In Databricks notebook
import requests

def fetch_from_mcp(entity_type: str, filters: dict):
    """Fetch data from MCP server"""
    mcp_url = dbutils.secrets.get("mcp", "api_url")
    mcp_token = dbutils.secrets.get("mcp", "api_token")

    response = requests.get(
        f"{mcp_url}/api/v1/data/{entity_type}",
        headers={"Authorization": f"Bearer {mcp_token}"},
        params=filters
    )
    response.raise_for_status()
    return response.json()

# Load into Spark DataFrame
df = spark.createDataFrame(fetch_from_mcp("employees", {"location": "SF"}))
df.write.mode("overwrite").saveAsTable("bronze.mcp_employees")
```

#### 3. Bidirectional Sync

**Use Case**: Agent insights written back to external systems

**Example**: Agent identifies at-risk employees → Update ADP records

**Flow**:
```
Agent generates insights (Databricks)
    ↓
Writes to Unity Catalog gold.agent_insights table
    ↓
Databricks job detects new records
    ↓
Calls MCP server /api/v1/integrations/adp/update
    ↓
MCP updates ADP system
    ↓
Logs success in AgentProvision database
```

---

## Security & Governance

### Authentication

**Databricks**:
- OAuth 2.0 M2M (machine-to-machine) for service accounts
- Personal Access Tokens (PAT) for development
- Service Principal for production workloads

**MCP Server**:
- JWT tokens issued by AgentProvision
- Rotate credentials every 90 days
- Stored in Databricks Secrets

### Authorization

**Unity Catalog Permissions**:
```sql
-- Tenant isolation
GRANT USE CATALOG ON CATALOG agentprovision_tenant_abc123 TO `tenant_abc123_role`;
GRANT SELECT ON CATALOG agentprovision_tenant_abc123 TO `tenant_abc123_analysts`;

-- Cross-tenant analytics (admins only)
GRANT SELECT ON ALL CATALOGS TO `agentprovision_admins`;
```

**Role-Based Access Control (RBAC)**:
- Tenant Admin: Full access to tenant catalog
- Data Engineer: Bronze/Silver read/write, Gold read
- Data Analyst: Gold read only
- Agent: Specific table access per agent config

### Data Encryption

- **At Rest**: Unity Catalog volumes encrypted with customer-managed keys
- **In Transit**: TLS 1.3 for all API calls
- **Secrets**: Databricks Secrets Scopes for API keys

### Compliance

- **GDPR**: Row-level deletion support, data lineage tracking
- **HIPAA**: PHI data in separate schemas with extra controls
- **SOC 2**: Audit logs for all data access
- **Data Residency**: Regional Databricks deployments (US, EU)

---

## Monitoring & Observability

### Metrics to Track

**Performance**:
- Job execution time (p50, p95, p99)
- Query latency (SQL warehouse)
- Model serving response time
- Data freshness (last sync timestamp)

**Cost**:
- DBU consumption by tenant
- Storage costs (Unity Catalog volumes)
- Compute cluster utilization
- SQL warehouse active time

**Reliability**:
- Job success rate
- Failed job retry count
- API error rates (4xx, 5xx)
- Circuit breaker trips

### Implementation

**Tools**:
- Databricks System Tables (usage monitoring)
- Prometheus + Grafana (custom metrics)
- DataDog or New Relic (APM)
- AgentProvision audit logs (user actions)

**Alerting Rules**:
```yaml
# Example: Job failure alert
- name: databricks_job_failure
  condition: job_run_status == "FAILED"
  threshold: 2 failures in 1 hour
  action: Send to PagerDuty + Slack #data-ops

- name: high_cost_alert
  condition: daily_dbu_usage > budget * 1.2
  action: Email finance team + Slack #data-ops

- name: model_serving_latency
  condition: p95_latency > 500ms for 5 minutes
  action: Auto-scale endpoint + Alert on-call
```

---

## Implementation Roadmap

### Week 1-2: Foundation Setup

**Tasks**:
- [ ] Set up Databricks workspace (AWS/Azure/GCP)
- [ ] Configure Unity Catalog metastore
- [ ] Create tenant catalog structure
- [ ] Implement Databricks client service in AgentProvision API
- [ ] Add environment variables for Databricks credentials
- [ ] Create health check endpoints
- [ ] Write integration tests

**Deliverables**:
- Working Databricks connection
- Basic catalog operations (create, list, delete)
- Documentation for developers

### Week 3-4: Data Ingestion Pipelines

**Tasks**:
- [ ] Design Bronze/Silver/Gold layer schemas
- [ ] Create Databricks notebooks for data ingestion
- [ ] Implement MCP server data fetching
- [ ] Set up LakeFlow Connect connectors
- [ ] Create Jobs API wrapper service
- [ ] Schedule recurring sync jobs
- [ ] Add monitoring for pipeline failures

**Deliverables**:
- Automated data ingestion from MCP
- Data quality checks
- Pipeline monitoring dashboard

### Week 5-6: SQL Warehouse Integration

**Tasks**:
- [ ] Provision SQL warehouse
- [ ] Create Gold layer views for analytics
- [ ] Implement query execution service
- [ ] Add result caching layer
- [ ] Build query builder UI component
- [ ] Optimize query performance

**Deliverables**:
- Ad-hoc query interface
- Pre-built analytical queries
- Query performance baseline

### Week 7-8: AI Agent Execution

**Tasks**:
- [ ] Design agent execution framework
- [ ] Create MLflow experiment templates
- [ ] Implement model serving integration
- [ ] Build agent deployment pipeline
- [ ] Add vector store for RAG
- [ ] Create agent monitoring dashboard

**Deliverables**:
- Agents running on Databricks
- Model serving endpoints
- Agent performance metrics

### Week 9-10: Advanced Features

**Tasks**:
- [ ] Implement query federation
- [ ] Add auto-scaling policies
- [ ] Create cost allocation reports
- [ ] Build data lineage visualization
- [ ] Add anomaly detection
- [ ] Implement backup/restore procedures

**Deliverables**:
- Production-ready platform
- Comprehensive monitoring
- Disaster recovery plan

### Week 11-12: Testing & Optimization

**Tasks**:
- [ ] Load testing (10k+ queries/sec)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] User training materials
- [ ] Production deployment

**Deliverables**:
- Load test reports
- Security compliance certification
- User guides
- Production launch

---

## Cost Estimation

### Databricks Costs (Monthly)

**Assumptions**: 10 tenants, moderate usage

| Component | DBU/Hour | Hours/Month | Total DBUs | Cost ($) |
|-----------|----------|-------------|------------|----------|
| Jobs Compute (S) | 0.75 | 720 | 540 | $270 |
| SQL Warehouse (M) | 2.0 | 400 | 800 | $400 |
| Model Serving | 1.0 | 720 | 720 | $360 |
| Storage (5 TB) | - | - | - | $115 |
| **Total** | | | **2,060** | **$1,145** |

**Note**: Costs scale linearly with tenant count and usage

### Optimization Strategies

1. **Auto-scaling**: Scale to zero for model serving endpoints
2. **Spot Instances**: Use for non-critical batch jobs (50% savings)
3. **Caching**: Reduce redundant queries
4. **Compaction**: Regular Delta Lake optimization
5. **Archiving**: Move cold data to cheaper storage

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Databricks outage | High | Low | Multi-region setup, MCP fallback |
| Cost overrun | High | Medium | Budget alerts, auto-scaling |
| Data loss | Critical | Low | Daily backups, Delta Lake time travel |
| Performance issues | Medium | Medium | Load testing, query optimization |
| Security breach | Critical | Low | Regular audits, least privilege |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Vendor lock-in | Medium | High | Use open formats (Iceberg, Parquet) |
| Skills gap | Medium | Medium | Training program, documentation |
| Migration complexity | High | Low | Phased rollout, parallel run |

---

## Success Criteria

### Technical Metrics

- [ ] 99.9% uptime for Databricks endpoints
- [ ] < 100ms p95 latency for model serving
- [ ] < 5 minute data freshness for critical tables
- [ ] 100% tenant data isolation (zero cross-tenant leaks)
- [ ] < $0.10 per 1000 agent invocations

### Business Metrics

- [ ] 50% reduction in query latency vs. current system
- [ ] 10x increase in data processing capacity
- [ ] 80% reduction in manual data pipeline management
- [ ] Support for 100+ tenants without performance degradation
- [ ] < 2 hour time-to-insight for new data sources

---

## Next Steps

1. **Get Approval**: Review plan with stakeholders
2. **Provision Resources**: Set up Databricks workspace
3. **Assign Team**: Designate tech lead and developers
4. **Kickoff Meeting**: Align on goals and timeline
5. **Week 1 Sprint**: Begin foundation setup

---

## References

- [Databricks Unity Catalog Best Practices](https://docs.databricks.com/data-governance/unity-catalog/best-practices)
- [Jobs API 2.2 Documentation](https://docs.databricks.com/workflows/jobs/jobs-api-updates.html)
- [Model Serving Guide](https://docs.databricks.com/machine-learning/model-serving/)
- [DentalERP MCP Server](../dentalerp/mcp-server/README.md)

---

**Document Owner**: AgentProvision Platform Team
**Last Updated**: October 30, 2025
**Review Cycle**: Monthly during implementation, quarterly post-launch
