# Databricks Dataset Sync Design

**Date:** November 6, 2025
**Status:** Approved for Implementation
**Feature:** Automatic Dataset Sync to Databricks Unity Catalog

---

## Goal

Automatically sync uploaded datasets from ServiceTsunami to Databricks Unity Catalog (Bronze + Silver layers) using Temporal workflows, with graceful degradation and retry logic.

## Architecture Overview

### System Flow

```
User Uploads Dataset
       ↓
[ServiceTsunami API]
       ↓
1. Ingest to local Parquet (DuckDB) ← Always succeeds
       ↓
2. Start Temporal workflow (async, non-blocking)
       ↓
[Temporal Worker]
       ↓
3. Activity: Call MCP Server
   POST /servicetsunami/v1/databricks/datasets
       ↓
[MCP Server]
       ↓
4. Download parquet via HTTP:
   GET /internal/storage/datasets/{uuid}.parquet
       ↓
5. Upload to Databricks DBFS/Volume
       ↓
6. Create Bronze external table (raw data)
       ↓
7. Create Silver managed table (typed, cleaned)
       ↓
8. Return metadata to Temporal activity
       ↓
[Temporal Worker]
       ↓
9. Activity: Update dataset.metadata in PostgreSQL
       ↓
[ServiceTsunami Database]
       ↓
Dataset marked as synced with table names
```

### Key Design Decisions

**1. Event-Driven Architecture**
- Upload succeeds locally immediately (fast UX)
- Temporal workflow handles sync asynchronously
- User can query local data right away
- Databricks becomes available after sync completes

**2. Graceful Degradation**
- If MCP server is down → dataset still uploaded locally
- Temporal workflow retries automatically (3 attempts, 5-min intervals)
- User sees sync status in UI
- Can always fall back to local DuckDB queries

**3. Via MCP Server (Not Direct)**
- ServiceTsunami → MCP Server → Databricks
- MCP handles Databricks auth, table creation, schema inference
- Clean separation of concerns

**4. Bronze + Silver Layers**
- Bronze: External table pointing to parquet (raw data preservation)
- Silver: Managed table with type inference and cleaning (query performance)

**5. HTTP File Transfer**
- Both services in Docker containers (separate)
- ServiceTsunami exposes internal endpoint for parquet downloads
- Secured with shared MCP_API_KEY
- No volume mounting complexity

## Components

### 1. Temporal Workflow

**File:** `apps/api/app/workflows/dataset_sync.py`

```python
from temporalio import workflow, activity
from datetime import timedelta

@workflow.defn
class DatasetSyncWorkflow:
    @workflow.run
    async def run(self, dataset_id: str, tenant_id: str):
        # Activity 1: Sync to Bronze (external table)
        bronze_result = await workflow.execute_activity(
            sync_to_bronze,
            args=[dataset_id, tenant_id],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=workflow.RetryPolicy(
                maximum_attempts=3,
                initial_interval=timedelta(minutes=5)
            )
        )

        # Activity 2: Transform to Silver (managed table)
        silver_result = await workflow.execute_activity(
            transform_to_silver,
            args=[bronze_result["bronze_table"], tenant_id],
            start_to_close_timeout=timedelta(minutes=10)
        )

        # Activity 3: Update dataset metadata
        await workflow.execute_activity(
            update_dataset_metadata,
            args=[dataset_id, bronze_result, silver_result]
        )

        return {
            "status": "synced",
            "bronze_table": bronze_result["bronze_table"],
            "silver_table": silver_result["silver_table"]
        }
```

### 2. Temporal Activities

**File:** `apps/api/app/workflows/activities/databricks_sync.py`

```python
from temporalio import activity
from app.services.mcp_client import get_mcp_client
from app.db.session import SessionLocal
from app.models.dataset import Dataset

@activity.defn
async def sync_to_bronze(dataset_id: str, tenant_id: str):
    """Create Bronze external table in Databricks"""
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

        # Get parquet file name
        file_name = dataset.file_name  # e.g., "abc-123.parquet"

        # Call MCP server
        mcp = get_mcp_client()
        result = await mcp.create_dataset_in_databricks(
            tenant_id=tenant_id,
            dataset_id=dataset_id,
            dataset_name=dataset.name,
            parquet_file_name=file_name,
            schema=dataset.schema_
        )

        return result
    finally:
        db.close()

@activity.defn
async def transform_to_silver(bronze_table: str, tenant_id: str):
    """Trigger Silver transformation"""
    mcp = get_mcp_client()
    return await mcp.transform_to_silver(
        bronze_table=bronze_table,
        tenant_id=tenant_id
    )

@activity.defn
async def update_dataset_metadata(dataset_id: str, bronze_result, silver_result):
    """Update dataset with Databricks metadata"""
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        dataset.metadata_ = {
            **dataset.metadata_,
            "databricks_enabled": True,
            "sync_status": "synced",
            "bronze_table": bronze_result["bronze_table"],
            "silver_table": silver_result["silver_table"],
            "last_sync_at": datetime.utcnow().isoformat()
        }
        db.commit()
    finally:
        db.close()
```

### 3. Internal File Serving Endpoint

**File:** `apps/api/app/api/v1/internal.py`

```python
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from app.core.config import settings
import os

router = APIRouter()

@router.get("/storage/datasets/{file_name}")
async def serve_dataset_file(
    file_name: str,
    authorization: str = Header(...)
):
    """
    Internal endpoint for MCP server to download parquet files
    Secured with MCP_API_KEY
    """
    if authorization != f"Bearer {settings.MCP_API_KEY}":
        raise HTTPException(status_code=401)

    # Validate and serve file
    file_path = os.path.join(settings.DATA_STORAGE_PATH, "datasets", file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404)

    # Prevent directory traversal
    if ".." in file_name or "/" in file_name:
        raise HTTPException(status_code=400)

    return FileResponse(path=file_path, media_type="application/octet-stream")
```

### 4. MCP Client Extensions

**File:** `apps/api/app/services/mcp_client.py` (add methods)

```python
async def create_dataset_in_databricks(
    self,
    tenant_id: str,
    dataset_id: str,
    dataset_name: str,
    parquet_file_name: str,
    schema: List[Dict]
) -> Dict[str, Any]:
    """
    Create Bronze external table and Silver managed table

    MCP server will:
    1. Download parquet from ServiceTsunami
    2. Upload to Databricks DBFS/Volume
    3. CREATE EXTERNAL TABLE in Bronze
    4. CREATE TABLE in Silver with transformations
    """
    return await self._request(
        "POST",
        "/databricks/datasets",
        json={
            "tenant_id": tenant_id,
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "parquet_url": f"http://servicetsunami-api:8001/internal/storage/datasets/{parquet_file_name}",
            "schema": schema
        }
    )

async def get_dataset_sync_status(
    self,
    dataset_id: str
) -> Dict[str, Any]:
    """Check sync status from MCP/Databricks"""
    return await self._request(
        "GET",
        f"/databricks/datasets/{dataset_id}/status"
    )
```

### 5. Trigger Workflow on Upload

**File:** `apps/api/app/services/datasets.py` (modify `ingest_records`)

```python
from app.services import workflows

def ingest_records(...):
    # ... existing local ingestion ...

    dataset = Dataset(...)
    db.add(dataset)
    db.commit()

    # NEW: Trigger Databricks sync workflow
    if settings.DATABRICKS_AUTO_SYNC and settings.MCP_ENABLED:
        # Mark as pending sync
        dataset.metadata_ = {
            "databricks_enabled": True,
            "sync_status": "pending"
        }
        db.commit()

        # Start Temporal workflow (async, non-blocking)
        await workflows.start_workflow(
            workflow_type=DatasetSyncWorkflow,
            workflow_id=f"dataset-sync-{dataset.id}",
            task_queue="servicetsunami-databricks",
            arguments=[str(dataset.id), str(tenant_id)]
        )

    return dataset
```

### 6. Configuration

**Environment Variables:**
```bash
# .env
MCP_SERVER_URL=http://localhost:8085
MCP_API_KEY=dev-mcp-shared-secret-key
DATABRICKS_SYNC_ENABLED=true
DATABRICKS_AUTO_SYNC=true
DATABRICKS_RETRY_ATTEMPTS=3
DATABRICKS_RETRY_INTERVAL=300

# Temporal (already configured)
TEMPORAL_ADDRESS=temporal:7233
TEMPORAL_NAMESPACE=default
```

---

## Implementation Scope

**Phase 1 (This Implementation):**
- ✅ Temporal workflow for dataset sync
- ✅ MCP client dataset sync methods
- ✅ Internal file serving endpoint
- ✅ Workflow trigger on dataset upload
- ✅ UI sync status badges
- ✅ Unit tests + integration tests

**Future Phases (Not Included):**
- Query routing (local vs Databricks)
- Manual sync retry button
- Bulk sync for existing datasets
- Sync analytics/monitoring
- Jobs orchestration
- Notebook execution
- Model serving

---

**Design approved!** Ready to save and create the implementation plan?