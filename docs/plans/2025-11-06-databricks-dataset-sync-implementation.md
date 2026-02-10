# Databricks Dataset Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically sync uploaded datasets to Databricks Unity Catalog (Bronze + Silver layers) via MCP server using Temporal workflows

**Architecture:** Event-driven architecture where dataset uploads trigger async Temporal workflows. Workflows call MCP server which downloads parquet files via HTTP and creates Bronze (external) and Silver (managed) tables in Databricks Unity Catalog. Graceful degradation ensures local data always available.

**Tech Stack:** Temporal workflows, FastAPI, MCP server (HTTP client), Databricks Unity Catalog, PostgreSQL (metadata)

---

## Prerequisites

Before starting, verify:
1. Temporal server running (check `docker-compose ps` for temporal service)
2. MCP server accessible (check `MCP_SERVER_URL` in env)
3. Databricks credentials configured in MCP server
4. Storage directory exists at `DATA_STORAGE_PATH`

---

## Task 1: Add Configuration Settings

**Files:**
- Modify: `apps/api/app/core/config.py`
- Modify: `apps/api/.env`

**Step 1: Write test for new config settings**

Create: `apps/api/tests/test_config.py`

```python
from app.core.config import settings

def test_databricks_config_exists():
    """Test Databricks configuration settings are loaded"""
    assert hasattr(settings, 'DATABRICKS_SYNC_ENABLED')
    assert hasattr(settings, 'DATABRICKS_AUTO_SYNC')
    assert hasattr(settings, 'DATABRICKS_RETRY_ATTEMPTS')
    assert hasattr(settings, 'DATABRICKS_RETRY_INTERVAL')
    assert isinstance(settings.DATABRICKS_RETRY_ATTEMPTS, int)
    assert isinstance(settings.DATABRICKS_RETRY_INTERVAL, int)

def test_mcp_config_exists():
    """Test MCP configuration is present"""
    assert hasattr(settings, 'MCP_SERVER_URL')
    assert hasattr(settings, 'MCP_API_KEY')
    assert settings.MCP_SERVER_URL.startswith('http')
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api
pytest tests/test_config.py::test_databricks_config_exists -v
```

Expected: FAIL with AttributeError (settings don't exist yet)

**Step 3: Add settings to config.py**

Modify: `apps/api/app/core/config.py`

Find the Settings class and add after existing MCP settings:

```python
class Settings(BaseSettings):
    # ... existing settings ...

    # MCP Server Configuration (should already exist)
    MCP_SERVER_URL: str = "http://localhost:8085"
    MCP_API_KEY: str = "dev_mcp_key"
    MCP_ENABLED: bool = True

    # NEW: Databricks Sync Settings
    DATABRICKS_SYNC_ENABLED: bool = True
    DATABRICKS_AUTO_SYNC: bool = True
    DATABRICKS_RETRY_ATTEMPTS: int = 3
    DATABRICKS_RETRY_INTERVAL: int = 300  # seconds (5 minutes)
```

**Step 4: Add to .env file**

Modify: `apps/api/.env`

Add at the end:

```bash
# Databricks Sync Configuration
DATABRICKS_SYNC_ENABLED=true
DATABRICKS_AUTO_SYNC=true
DATABRICKS_RETRY_ATTEMPTS=3
DATABRICKS_RETRY_INTERVAL=300
```

**Step 5: Run test to verify it passes**

```bash
cd apps/api
pytest tests/test_config.py -v
```

Expected: PASS (all config tests pass)

**Step 6: Commit**

```bash
git add apps/api/app/core/config.py apps/api/.env apps/api/tests/test_config.py
git commit -m "feat: add Databricks sync configuration settings"
```

---

## Task 2: Create Internal File Serving Endpoint

**Files:**
- Create: `apps/api/app/api/v1/internal.py`
- Modify: `apps/api/app/api/v1/routes.py`
- Create: `apps/api/tests/test_internal_endpoints.py`

**Step 1: Write failing test**

Create: `apps/api/tests/test_internal_endpoints.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
import os
import tempfile

client = TestClient(app)

def test_serve_dataset_file_requires_auth():
    """Test internal endpoint requires MCP_API_KEY"""
    response = client.get("/internal/storage/datasets/test.parquet")
    assert response.status_code == 401

def test_serve_dataset_file_with_invalid_key():
    """Test invalid API key returns 401"""
    response = client.get(
        "/internal/storage/datasets/test.parquet",
        headers={"Authorization": "Bearer wrong-key"}
    )
    assert response.status_code == 401

def test_serve_dataset_file_not_found():
    """Test 404 for non-existent file"""
    response = client.get(
        "/internal/storage/datasets/nonexistent.parquet",
        headers={"Authorization": f"Bearer {settings.MCP_API_KEY}"}
    )
    assert response.status_code == 404

def test_serve_dataset_file_prevents_directory_traversal():
    """Test directory traversal attack prevention"""
    response = client.get(
        "/internal/storage/datasets/../../../etc/passwd",
        headers={"Authorization": f"Bearer {settings.MCP_API_KEY}"}
    )
    assert response.status_code == 400

def test_serve_dataset_file_success(tmp_path):
    """Test successful file serving"""
    # Create temp parquet file
    test_file = tmp_path / "test123.parquet"
    test_file.write_bytes(b"test parquet data")

    # Mock DATA_STORAGE_PATH to tmp_path
    original_path = settings.DATA_STORAGE_PATH
    settings.DATA_STORAGE_PATH = str(tmp_path.parent)

    # Create datasets subdirectory
    datasets_dir = tmp_path.parent / "datasets"
    datasets_dir.mkdir(exist_ok=True)
    (datasets_dir / "test123.parquet").write_bytes(b"test parquet data")

    try:
        response = client.get(
            "/internal/storage/datasets/test123.parquet",
            headers={"Authorization": f"Bearer {settings.MCP_API_KEY}"}
        )
        assert response.status_code == 200
        assert response.content == b"test parquet data"
    finally:
        settings.DATA_STORAGE_PATH = original_path
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/api
pytest tests/test_internal_endpoints.py -v
```

Expected: FAIL (internal router not imported, endpoints don't exist)

**Step 3: Create internal router**

Create: `apps/api/app/api/v1/internal.py`

```python
"""
Internal API endpoints for service-to-service communication
NOT exposed publicly via Nginx - only for MCP server access
"""

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from app.core.config import settings
from app.utils.logger import get_logger
import os

router = APIRouter()
logger = get_logger(__name__)


@router.get("/storage/datasets/{file_name}")
async def serve_dataset_file(
    file_name: str,
    authorization: str = Header(...)
):
    """
    Serve parquet files to MCP server

    Security:
    - Requires MCP_API_KEY in Authorization header
    - Validates file exists
    - Prevents directory traversal attacks

    Args:
        file_name: Parquet file name (e.g., "abc-123.parquet")
        authorization: Bearer token (must match MCP_API_KEY)

    Returns:
        FileResponse with parquet file content
    """
    # Verify MCP API key
    expected_auth = f"Bearer {settings.MCP_API_KEY}"
    if authorization != expected_auth:
        logger.warning(f"Unauthorized internal access attempt for file: {file_name}")
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Prevent directory traversal
    if ".." in file_name or "/" in file_name or "\\" in file_name:
        logger.warning(f"Directory traversal attempt: {file_name}")
        raise HTTPException(status_code=400, detail="Invalid file name")

    # Build file path
    file_path = os.path.join(settings.DATA_STORAGE_PATH, "datasets", file_name)

    # Validate file exists
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")

    # Validate it's actually a file (not directory)
    if not os.path.isfile(file_path):
        logger.error(f"Path is not a file: {file_path}")
        raise HTTPException(status_code=400, detail="Invalid file")

    logger.info(f"Serving file to MCP server: {file_name}")

    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=file_name
    )
```

**Step 4: Register internal router**

Modify: `apps/api/app/api/v1/routes.py`

Add import at top:
```python
from app.api.v1 import (
    # ... existing imports ...
    internal,
)
```

Add router registration in the main router:
```python
router.include_router(internal.router, prefix="/internal", tags=["internal"])
```

**Step 5: Run tests to verify they pass**

```bash
cd apps/api
pytest tests/test_internal_endpoints.py -v
```

Expected: PASS (all 5 tests pass)

**Step 6: Commit**

```bash
git add apps/api/app/api/v1/internal.py apps/api/app/api/v1/routes.py apps/api/tests/test_internal_endpoints.py
git commit -m "feat: add internal file serving endpoint for MCP server"
```

---

## Task 3: Extend MCP Client with Dataset Sync Methods

**Files:**
- Modify: `apps/api/app/services/mcp_client.py`
- Create: `apps/api/tests/test_mcp_client.py`

**Step 1: Write failing test**

Create: `apps/api/tests/test_mcp_client.py`

```python
import pytest
from unittest.mock import AsyncMock, patch
from app.services.mcp_client import MCPClient, MCPClientError

@pytest.mark.asyncio
async def test_create_dataset_in_databricks():
    """Test MCP client can create dataset in Databricks"""
    mcp = MCPClient()

    # Mock the HTTP request
    with patch.object(mcp, '_request', new_callable=AsyncMock) as mock_request:
        mock_request.return_value = {
            "bronze_table": "catalog.bronze.test_dataset",
            "silver_table": "catalog.silver.test_dataset_clean",
            "row_count": 100
        }

        result = await mcp.create_dataset_in_databricks(
            tenant_id="tenant-123",
            dataset_id="dataset-456",
            dataset_name="Test Dataset",
            parquet_file_name="test-file.parquet",
            schema=[{"name": "col1", "type": "string"}]
        )

        assert result["bronze_table"] == "catalog.bronze.test_dataset"
        assert result["silver_table"] == "catalog.silver.test_dataset_clean"

        # Verify correct endpoint called
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[0][0] == "POST"  # method
        assert "/databricks/datasets" in call_args[0][1]  # endpoint

@pytest.mark.asyncio
async def test_get_dataset_sync_status():
    """Test MCP client can check sync status"""
    mcp = MCPClient()

    with patch.object(mcp, '_request', new_callable=AsyncMock) as mock_request:
        mock_request.return_value = {
            "status": "synced",
            "bronze_exists": True,
            "silver_exists": True
        }

        result = await mcp.get_dataset_sync_status("dataset-456")

        assert result["status"] == "synced"
        mock_request.assert_called_once_with("GET", "/databricks/datasets/dataset-456/status")
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api
pytest tests/test_mcp_client.py -v
```

Expected: FAIL (methods don't exist on MCPClient)

**Step 3: Add methods to MCP client**

Modify: `apps/api/app/services/mcp_client.py`

Add after existing methods (around line 100+):

```python
    # ==================== Databricks Dataset Operations ====================

    async def create_dataset_in_databricks(
        self,
        tenant_id: str,
        dataset_id: str,
        dataset_name: str,
        parquet_file_name: str,
        schema: list
    ) -> Dict[str, Any]:
        """
        Create dataset in Databricks Unity Catalog (Bronze + Silver)

        This triggers the MCP server to:
        1. Download parquet file from ServiceTsunami
        2. Upload to Databricks DBFS/Volume
        3. Create Bronze external table
        4. Create Silver managed table with transformations

        Args:
            tenant_id: Tenant UUID
            dataset_id: Dataset UUID
            dataset_name: Display name for tables
            parquet_file_name: File name in storage (e.g., "abc-123.parquet")
            schema: List of column definitions [{"name": "col", "type": "string"}]

        Returns:
            Dict with bronze_table, silver_table, row_count
        """
        # Build internal file URL for MCP server to download
        # MCP server will call: GET http://servicetsunami-api:8001/internal/storage/datasets/{file_name}
        parquet_url = f"http://servicetsunami-api:8001/internal/storage/datasets/{parquet_file_name}"

        return await self._request(
            "POST",
            "/databricks/datasets",
            json={
                "tenant_id": tenant_id,
                "dataset_id": dataset_id,
                "dataset_name": dataset_name,
                "parquet_url": parquet_url,
                "schema": schema
            }
        )

    async def get_dataset_sync_status(
        self,
        dataset_id: str
    ) -> Dict[str, Any]:
        """
        Get dataset sync status from Databricks

        Returns:
            Dict with status, bronze_exists, silver_exists, last_sync_at, error
        """
        return await self._request(
            "GET",
            f"/databricks/datasets/{dataset_id}/status"
        )

    async def delete_dataset_from_databricks(
        self,
        dataset_id: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Delete dataset tables from Databricks Unity Catalog

        Drops both Bronze and Silver tables
        """
        return await self._request(
            "DELETE",
            f"/databricks/datasets/{dataset_id}",
            json={"tenant_id": tenant_id}
        )
```

**Step 4: Run tests to verify they pass**

```bash
cd apps/api
pytest tests/test_mcp_client.py -v
```

Expected: PASS (both tests pass)

**Step 5: Commit**

```bash
git add apps/api/app/services/mcp_client.py apps/api/tests/test_mcp_client.py
git commit -m "feat: add MCP client methods for Databricks dataset sync"
```

---

## Task 4: Create Temporal Workflow and Activities

**Files:**
- Create: `apps/api/app/workflows/__init__.py`
- Create: `apps/api/app/workflows/dataset_sync.py`
- Create: `apps/api/app/workflows/activities/__init__.py`
- Create: `apps/api/app/workflows/activities/databricks_sync.py`
- Create: `apps/api/tests/workflows/test_dataset_sync_workflow.py`

**Step 1: Write failing workflow test**

Create: `apps/api/tests/workflows/test_dataset_sync_workflow.py`

```python
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import timedelta
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from app.workflows.dataset_sync import DatasetSyncWorkflow
from app.workflows.activities.databricks_sync import (
    sync_to_bronze,
    transform_to_silver,
    update_dataset_metadata
)

@pytest.mark.asyncio
async def test_dataset_sync_workflow_success():
    """Test successful dataset sync workflow"""
    # Setup test environment
    async with await WorkflowEnvironment.start_local() as env:
        # Mock activities
        async def mock_sync_to_bronze(dataset_id: str, tenant_id: str):
            return {
                "bronze_table": "catalog.bronze.test_dataset",
                "row_count": 100
            }

        async def mock_transform_to_silver(bronze_table: str, tenant_id: str):
            return {
                "silver_table": "catalog.silver.test_dataset_clean",
                "row_count": 100
            }

        async def mock_update_metadata(dataset_id: str, bronze_result, silver_result):
            pass

        # Start worker with mocked activities
        async with Worker(
            env.client,
            task_queue="test-queue",
            workflows=[DatasetSyncWorkflow],
            activities=[mock_sync_to_bronze, mock_transform_to_silver, mock_update_metadata]
        ):
            # Execute workflow
            result = await env.client.execute_workflow(
                DatasetSyncWorkflow.run,
                args=["dataset-123", "tenant-456"],
                id="test-workflow-1",
                task_queue="test-queue"
            )

            assert result["status"] == "synced"
            assert result["bronze_table"] == "catalog.bronze.test_dataset"
            assert result["silver_table"] == "catalog.silver.test_dataset_clean"

@pytest.mark.asyncio
async def test_dataset_sync_workflow_retries_on_failure():
    """Test workflow retries on activity failure"""
    async with await WorkflowEnvironment.start_local() as env:
        call_count = {"bronze": 0}

        async def failing_then_succeeding_bronze(dataset_id: str, tenant_id: str):
            call_count["bronze"] += 1
            if call_count["bronze"] == 1:
                raise Exception("MCP server timeout")
            return {"bronze_table": "catalog.bronze.test", "row_count": 100}

        async def mock_transform_to_silver(bronze_table: str, tenant_id: str):
            return {"silver_table": "catalog.silver.test", "row_count": 100}

        async def mock_update_metadata(dataset_id: str, bronze_result, silver_result):
            pass

        async with Worker(
            env.client,
            task_queue="test-queue",
            workflows=[DatasetSyncWorkflow],
            activities=[failing_then_succeeding_bronze, mock_transform_to_silver, mock_update_metadata]
        ):
            result = await env.client.execute_workflow(
                DatasetSyncWorkflow.run,
                args=["dataset-123", "tenant-456"],
                id="test-workflow-2",
                task_queue="test-queue"
            )

            # Should succeed after retry
            assert result["status"] == "synced"
            assert call_count["bronze"] == 2  # Failed once, succeeded on retry
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api
pytest tests/workflows/test_dataset_sync_workflow.py -v
```

Expected: FAIL (workflow and activities don't exist)

**Step 3: Create workflow definition**

Create: `apps/api/app/workflows/__init__.py`

```python
"""
Temporal workflows for ServiceTsunami
"""
```

Create: `apps/api/app/workflows/dataset_sync.py`

```python
"""
Temporal workflow for syncing datasets to Databricks Unity Catalog
"""

from temporalio import workflow
from datetime import timedelta
from typing import Dict, Any

# Import activities (will be defined next)
from app.workflows.activities.databricks_sync import (
    sync_to_bronze,
    transform_to_silver,
    update_dataset_metadata
)


@workflow.defn
class DatasetSyncWorkflow:
    """
    Durable workflow for syncing datasets to Databricks

    Steps:
    1. Create Bronze external table (raw parquet)
    2. Create Silver managed table (typed, cleaned)
    3. Update dataset metadata in PostgreSQL

    Handles:
    - Automatic retries on failure
    - Progress tracking
    - Error recovery
    """

    @workflow.run
    async def run(self, dataset_id: str, tenant_id: str) -> Dict[str, Any]:
        """
        Execute dataset sync workflow

        Args:
            dataset_id: UUID of dataset to sync
            tenant_id: UUID of tenant (for catalog isolation)

        Returns:
            Dict with status, bronze_table, silver_table
        """
        workflow.logger.info(f"Starting dataset sync for {dataset_id}")

        # Step 1: Sync to Bronze layer
        bronze_result = await workflow.execute_activity(
            sync_to_bronze,
            args=[dataset_id, tenant_id],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=workflow.RetryPolicy(
                maximum_attempts=3,
                initial_interval=timedelta(minutes=5),
                maximum_interval=timedelta(minutes=10),
                backoff_coefficient=2.0
            )
        )

        workflow.logger.info(f"Bronze table created: {bronze_result['bronze_table']}")

        # Step 2: Transform to Silver layer
        silver_result = await workflow.execute_activity(
            transform_to_silver,
            args=[bronze_result["bronze_table"], tenant_id],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=workflow.RetryPolicy(
                maximum_attempts=3,
                initial_interval=timedelta(minutes=2)
            )
        )

        workflow.logger.info(f"Silver table created: {silver_result['silver_table']}")

        # Step 3: Update dataset metadata in PostgreSQL
        await workflow.execute_activity(
            update_dataset_metadata,
            args=[dataset_id, bronze_result, silver_result],
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=workflow.RetryPolicy(maximum_attempts=5)
        )

        workflow.logger.info(f"Dataset sync complete for {dataset_id}")

        return {
            "status": "synced",
            "bronze_table": bronze_result["bronze_table"],
            "silver_table": silver_result["silver_table"],
            "row_count": bronze_result.get("row_count", 0)
        }
```

**Step 4: Create workflow activities**

Create: `apps/api/app/workflows/activities/__init__.py`

```python
"""
Temporal activities for ServiceTsunami workflows
"""
```

Create: `apps/api/app/workflows/activities/databricks_sync.py`

```python
"""
Temporal activities for Databricks dataset synchronization
"""

from temporalio import activity
from typing import Dict, Any
from datetime import datetime

from app.services.mcp_client import get_mcp_client, MCPClientError
from app.db.session import SessionLocal
from app.models.dataset import Dataset
from app.utils.logger import get_logger

logger = get_logger(__name__)


@activity.defn
async def sync_to_bronze(dataset_id: str, tenant_id: str) -> Dict[str, Any]:
    """
    Create Bronze external table in Databricks Unity Catalog

    Calls MCP server to:
    1. Download parquet from ServiceTsunami
    2. Upload to Databricks DBFS/Volume
    3. Create external table in Bronze schema

    Args:
        dataset_id: UUID of dataset
        tenant_id: UUID of tenant

    Returns:
        Dict with bronze_table name and row_count

    Raises:
        MCPClientError: If MCP server call fails
    """
    activity.logger.info(f"Syncing dataset {dataset_id} to Bronze layer")

    db = SessionLocal()
    try:
        # Get dataset from database
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise ValueError(f"Dataset {dataset_id} not found")

        # Update status to 'syncing'
        if not dataset.metadata_:
            dataset.metadata_ = {}
        dataset.metadata_["sync_status"] = "syncing"
        dataset.metadata_["last_sync_attempt"] = datetime.utcnow().isoformat()
        db.commit()

        # Call MCP server
        mcp = get_mcp_client()
        result = await mcp.create_dataset_in_databricks(
            tenant_id=tenant_id,
            dataset_id=dataset_id,
            dataset_name=dataset.name,
            parquet_file_name=dataset.file_name,
            schema=dataset.schema_ or []
        )

        activity.logger.info(f"Bronze table created: {result['bronze_table']}")

        return result

    except MCPClientError as e:
        # Update status to 'failed'
        if dataset:
            dataset.metadata_["sync_status"] = "failed"
            dataset.metadata_["last_sync_error"] = str(e)
            db.commit()
        raise
    finally:
        db.close()


@activity.defn
async def transform_to_silver(bronze_table: str, tenant_id: str) -> Dict[str, Any]:
    """
    Create Silver managed table from Bronze

    MCP server applies transformations:
    - Type inference and casting
    - Data cleaning (nulls, duplicates)
    - Column renaming (snake_case)

    Args:
        bronze_table: Full table name (catalog.schema.table)
        tenant_id: UUID of tenant

    Returns:
        Dict with silver_table name and row_count
    """
    activity.logger.info(f"Transforming Bronze to Silver: {bronze_table}")

    mcp = get_mcp_client()
    result = await mcp.transform_to_silver(
        bronze_table=bronze_table,
        tenant_id=tenant_id
    )

    activity.logger.info(f"Silver table created: {result['silver_table']}")

    return result


@activity.defn
async def update_dataset_metadata(
    dataset_id: str,
    bronze_result: Dict[str, Any],
    silver_result: Dict[str, Any]
) -> None:
    """
    Update dataset metadata with Databricks table information

    Args:
        dataset_id: UUID of dataset
        bronze_result: Result from sync_to_bronze activity
        silver_result: Result from transform_to_silver activity
    """
    activity.logger.info(f"Updating metadata for dataset {dataset_id}")

    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise ValueError(f"Dataset {dataset_id} not found")

        # Update metadata with sync info
        if not dataset.metadata_:
            dataset.metadata_ = {}

        dataset.metadata_.update({
            "databricks_enabled": True,
            "sync_status": "synced",
            "bronze_table": bronze_result["bronze_table"],
            "silver_table": silver_result["silver_table"],
            "last_sync_at": datetime.utcnow().isoformat(),
            "last_sync_error": None,
            "row_count_databricks": bronze_result.get("row_count", 0)
        })

        db.commit()
        activity.logger.info(f"Metadata updated successfully for {dataset_id}")

    finally:
        db.close()
```

**Step 5: Add missing MCP method**

Modify: `apps/api/app/services/mcp_client.py`

Add after `create_dataset_in_databricks`:

```python
    async def transform_to_silver(
        self,
        bronze_table: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Transform Bronze table to Silver

        Args:
            bronze_table: Full Bronze table name
            tenant_id: Tenant UUID for isolation

        Returns:
            Dict with silver_table and row_count
        """
        return await self._request(
            "POST",
            "/databricks/transformations/silver",
            json={
                "bronze_table": bronze_table,
                "tenant_id": tenant_id
            }
        )
```

**Step 6: Run tests to verify they pass**

```bash
cd apps/api
pytest tests/workflows/test_dataset_sync_workflow.py -v
```

Expected: PASS (workflow tests pass)

**Step 7: Commit**

```bash
git add apps/api/app/workflows/ apps/api/tests/workflows/
git commit -m "feat: add Temporal workflow for Databricks dataset sync"
```

---

## Task 5: Trigger Workflow on Dataset Upload

**Files:**
- Modify: `apps/api/app/services/datasets.py`
- Create: `apps/api/tests/test_dataset_databricks_trigger.py`

**Step 1: Write failing integration test**

Create: `apps/api/tests/test_dataset_databricks_trigger.py`

```python
import pytest
from unittest.mock import patch, AsyncMock
from app.services import datasets as dataset_service
from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.core.config import settings
import uuid

@pytest.mark.asyncio
async def test_dataset_upload_triggers_workflow():
    """Test dataset upload triggers Databricks sync workflow"""
    db = SessionLocal()

    # Create test tenant
    tenant = Tenant(name="Test Tenant")
    db.add(tenant)
    db.commit()

    # Mock workflow start
    with patch('app.services.datasets.workflows.start_workflow', new_callable=AsyncMock) as mock_start:
        mock_start.return_value = AsyncMock(id="workflow-123")

        # Upload dataset
        records = [{"id": 1, "value": 100}]
        dataset = dataset_service.ingest_records(
            db=db,
            tenant_id=tenant.id,
            records=records,
            name="Test Dataset",
            description="Test",
            source_type="upload"
        )

        # Verify workflow was triggered if auto-sync enabled
        if settings.DATABRICKS_AUTO_SYNC and settings.MCP_ENABLED:
            mock_start.assert_called_once()
            call_args = mock_start.call_args
            assert "DatasetSyncWorkflow" in str(call_args)

            # Verify dataset marked as pending
            assert dataset.metadata_["databricks_enabled"] == True
            assert dataset.metadata_["sync_status"] == "pending"

    db.close()
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api
pytest tests/test_dataset_databricks_trigger.py -v
```

Expected: FAIL (workflow not triggered in dataset service)

**Step 3: Modify dataset service to trigger workflow**

Modify: `apps/api/app/services/datasets.py`

Find the `ingest_records` function and add at the end (before return):

```python
def ingest_records(
    db: Session,
    tenant_id: uuid.UUID,
    records: List[Dict],
    name: str,
    description: str = "",
    source_type: str = "upload"
) -> Dataset:
    # ... existing code to create dataset and save parquet ...

    dataset = Dataset(
        # ... existing fields ...
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # NEW: Trigger Databricks sync workflow if enabled
    if settings.DATABRICKS_AUTO_SYNC and settings.MCP_ENABLED:
        logger.info(f"Triggering Databricks sync for dataset {dataset.id}")

        # Initialize metadata
        if not dataset.metadata_:
            dataset.metadata_ = {}

        dataset.metadata_.update({
            "databricks_enabled": True,
            "sync_status": "pending",
            "last_sync_attempt": None
        })
        db.commit()

        # Start Temporal workflow (async, non-blocking)
        try:
            from app.services import workflows
            from app.workflows.dataset_sync import DatasetSyncWorkflow

            # Start workflow asynchronously
            import asyncio
            asyncio.create_task(
                workflows.start_workflow(
                    workflow_type=DatasetSyncWorkflow,
                    workflow_id=f"dataset-sync-{dataset.id}",
                    task_queue="servicetsunami-databricks",
                    arguments=[str(dataset.id), str(tenant_id)]
                )
            )

            logger.info(f"Databricks sync workflow started for dataset {dataset.id}")

        except Exception as e:
            # Don't fail dataset upload if workflow start fails
            logger.error(f"Failed to start Databricks sync workflow: {e}")
            dataset.metadata_["sync_status"] = "failed"
            dataset.metadata_["last_sync_error"] = str(e)
            db.commit()

    return dataset
```

Add import at top of file:
```python
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api
pytest tests/test_dataset_databricks_trigger.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/services/datasets.py apps/api/tests/test_dataset_databricks_trigger.py
git commit -m "feat: trigger Databricks sync workflow on dataset upload"
```

---

## Task 6: Add UI Sync Status Badges

**Files:**
- Create: `apps/web/src/components/SyncStatusBadge.js`
- Modify: `apps/web/src/pages/DatasetsPage.js`

**Step 1: Create SyncStatusBadge component**

Create: `apps/web/src/components/SyncStatusBadge.js`

```javascript
import React from 'react';
import { Badge, Spinner } from 'react-bootstrap';

/**
 * Display Databricks sync status with visual indicators
 *
 * @param {object} props
 * @param {string} props.status - One of: synced, syncing, failed, pending, null
 * @returns {JSX.Element}
 */
const SyncStatusBadge = ({ status }) => {
  if (!status) {
    return <Badge bg="secondary">Local Only</Badge>;
  }

  const statusConfig = {
    synced: {
      bg: 'success',
      icon: '✓',
      text: 'Synced to Databricks'
    },
    syncing: {
      bg: 'warning',
      icon: <Spinner animation="border" size="sm" />,
      text: 'Syncing...'
    },
    failed: {
      bg: 'danger',
      icon: '⚠️',
      text: 'Sync Failed'
    },
    pending: {
      bg: 'info',
      icon: '○',
      text: 'Pending Sync'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge bg={config.bg} className="d-flex align-items-center gap-1">
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </Badge>
  );
};

export default SyncStatusBadge;
```

**Step 2: Update DatasetsPage to show sync status**

Modify: `apps/web/src/pages/DatasetsPage.js`

Add import at top:
```javascript
import SyncStatusBadge from '../components/SyncStatusBadge';
```

Find the table where datasets are displayed and add a new column after the row_count column:

```javascript
<Table striped bordered hover>
  <thead>
    <tr>
      <th>Name</th>
      <th>Description</th>
      <th>Rows</th>
      {/* NEW COLUMN */}
      <th>Databricks Status</th>
      <th>Created</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {datasets.map((dataset) => (
      <tr key={dataset.id}>
        <td>{dataset.name}</td>
        <td>{dataset.description}</td>
        <td>{dataset.row_count?.toLocaleString()}</td>
        {/* NEW CELL */}
        <td>
          <SyncStatusBadge
            status={dataset.metadata?.sync_status}
          />
        </td>
        <td>{new Date(dataset.created_at).toLocaleDateString()}</td>
        <td>
          {/* existing action buttons */}
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

**Step 3: Test in browser**

```bash
# Rebuild web container
docker-compose up --build -d web

# Open browser to http://localhost:8002/dashboard/datasets
# Verify:
# - Existing datasets show "Local Only" badge
# - After uploading new dataset, shows "Pending Sync" or "Syncing..."
```

Expected: UI shows sync status badges

**Step 4: Commit**

```bash
git add apps/web/src/components/SyncStatusBadge.js apps/web/src/pages/DatasetsPage.js
git commit -m "feat: add Databricks sync status badges to datasets UI"
```

---

## Task 7: Add Temporal Worker Configuration

**Files:**
- Create: `apps/api/app/workers/databricks_worker.py`
- Modify: `apps/api/app/main.py` or create separate worker process

**Step 1: Create Temporal worker for Databricks workflows**

Create: `apps/api/app/workers/__init__.py`

```python
"""
Temporal workers for background task processing
"""
```

Create: `apps/api/app/workers/databricks_worker.py`

```python
"""
Temporal worker for Databricks synchronization workflows
"""

import asyncio
from temporalio.client import Client
from temporalio.worker import Worker

from app.core.config import settings
from app.workflows.dataset_sync import DatasetSyncWorkflow
from app.workflows.activities.databricks_sync import (
    sync_to_bronze,
    transform_to_silver,
    update_dataset_metadata
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def run_databricks_worker():
    """
    Start Temporal worker for Databricks workflows

    This worker processes:
    - DatasetSyncWorkflow
    - Related activities

    Task queue: servicetsunami-databricks
    """
    # Connect to Temporal server
    client = await Client.connect(settings.TEMPORAL_ADDRESS)

    logger.info("Starting Databricks Temporal worker...")
    logger.info(f"Temporal address: {settings.TEMPORAL_ADDRESS}")
    logger.info(f"Task queue: servicetsunami-databricks")

    # Create and run worker
    worker = Worker(
        client,
        task_queue="servicetsunami-databricks",
        workflows=[DatasetSyncWorkflow],
        activities=[
            sync_to_bronze,
            transform_to_silver,
            update_dataset_metadata
        ]
    )

    logger.info("Databricks worker started successfully")
    await worker.run()


if __name__ == "__main__":
    """Run worker as standalone process"""
    asyncio.run(run_databricks_worker())
```

**Step 2: Add worker startup script**

Create: `scripts/start_databricks_worker.sh`

```bash
#!/bin/bash
# Start Temporal worker for Databricks synchronization

cd "$(dirname "$0")/../apps/api"

echo "Starting Databricks Temporal worker..."
python -m app.workers.databricks_worker
```

Make executable:
```bash
chmod +x scripts/start_databricks_worker.sh
```

**Step 3: Update docker-compose for worker**

Modify: `docker-compose.yml`

Add new service after `api`:

```yaml
services:
  # ... existing services ...

  databricks-worker:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    command: python -m app.workers.databricks_worker
    env_file:
      - ./apps/api/.env
    depends_on:
      - db
      - temporal
    restart: unless-stopped
```

**Step 4: Test worker starts**

```bash
# Start worker service
docker-compose up -d databricks-worker

# Check logs
docker-compose logs databricks-worker

# Expected: "Databricks worker started successfully"
```

**Step 5: Commit**

```bash
git add apps/api/app/workers/ scripts/start_databricks_worker.sh docker-compose.yml
git commit -m "feat: add Temporal worker for Databricks sync workflows"
```

---

## Task 8: Add Dataset Sync Status Endpoint

**Files:**
- Modify: `apps/api/app/api/v1/datasets.py`
- Create: `apps/api/tests/test_dataset_sync_status.py`

**Step 1: Write failing test**

Create: `apps/api/tests/test_dataset_sync_status.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.dataset import Dataset
from app.models.tenant import Tenant
from app.models.user import User
from app.core.security import get_password_hash
import uuid

client = TestClient(app)

@pytest.fixture
def auth_token(db_session):
    """Create test user and return auth token"""
    tenant = Tenant(name="Test Tenant")
    db_session.add(tenant)
    db_session.commit()

    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password"),
        tenant_id=tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Login to get token
    response = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "password"
    })
    return response.json()["access_token"]

def test_get_dataset_sync_status(auth_token, db_session):
    """Test getting Databricks sync status for dataset"""
    # Create test dataset with sync metadata
    tenant = db_session.query(Tenant).first()
    dataset = Dataset(
        name="Test Dataset",
        source_type="upload",
        file_name="test.parquet",
        row_count=100,
        tenant_id=tenant.id,
        metadata_={
            "databricks_enabled": True,
            "sync_status": "synced",
            "bronze_table": "catalog.bronze.test",
            "silver_table": "catalog.silver.test"
        }
    )
    db_session.add(dataset)
    db_session.commit()

    # Call sync status endpoint
    response = client.get(
        f"/api/v1/datasets/{dataset.id}/databricks/status",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["sync_status"] == "synced"
    assert data["databricks_enabled"] == True
    assert "bronze_table" in data
    assert "silver_table" in data

def test_get_dataset_sync_status_not_synced(auth_token, db_session):
    """Test sync status for dataset not synced to Databricks"""
    tenant = db_session.query(Tenant).first()
    dataset = Dataset(
        name="Local Only Dataset",
        source_type="upload",
        file_name="local.parquet",
        row_count=50,
        tenant_id=tenant.id,
        metadata_={}
    )
    db_session.add(dataset)
    db_session.commit()

    response = client.get(
        f"/api/v1/datasets/{dataset.id}/databricks/status",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["databricks_enabled"] == False
    assert data["sync_status"] == "not_synced"
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api
pytest tests/test_dataset_sync_status.py -v
```

Expected: FAIL (endpoint doesn't exist)

**Step 3: Add sync status endpoint**

Modify: `apps/api/app/api/v1/datasets.py`

Add new endpoint after existing dataset endpoints:

```python
@router.get("/{dataset_id}/databricks/status")
def get_dataset_databricks_status(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Databricks sync status for a dataset

    Returns:
    - sync_status: synced|syncing|failed|pending|not_synced
    - databricks_enabled: boolean
    - bronze_table: table name if synced
    - silver_table: table name if synced
    - last_sync_at: timestamp
    - last_sync_error: error message if failed
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenant_id == current_user.tenant_id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    metadata = dataset.metadata_ or {}

    return {
        "dataset_id": str(dataset.id),
        "dataset_name": dataset.name,
        "databricks_enabled": metadata.get("databricks_enabled", False),
        "sync_status": metadata.get("sync_status", "not_synced"),
        "bronze_table": metadata.get("bronze_table"),
        "silver_table": metadata.get("silver_table"),
        "last_sync_at": metadata.get("last_sync_at"),
        "last_sync_error": metadata.get("last_sync_error"),
        "row_count_local": dataset.row_count,
        "row_count_databricks": metadata.get("row_count_databricks")
    }
```

Add import at top if not present:
```python
from app.core.config import settings
```

**Step 4: Run tests to verify they pass**

```bash
cd apps/api
pytest tests/test_dataset_sync_status.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/api/v1/datasets.py apps/api/tests/test_dataset_sync_status.py
git commit -m "feat: add dataset Databricks sync status endpoint"
```

---

## Task 9: Integration Test - End-to-End Sync

**Files:**
- Create: `apps/api/tests/integration/test_databricks_sync_e2e.py`

**Step 1: Write end-to-end integration test**

Create: `apps/api/tests/integration/test_databricks_sync_e2e.py`

```python
"""
End-to-end integration test for Databricks dataset sync

Prerequisites:
- MCP server running and accessible
- Databricks workspace configured in MCP server
- Temporal server running
- Databricks worker running

This test can be skipped if MCP_ENABLED=false
"""

import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

# Skip if Databricks not enabled
pytestmark = pytest.mark.skipif(
    not settings.MCP_ENABLED or not settings.DATABRICKS_AUTO_SYNC,
    reason="Databricks integration not enabled"
)

@pytest.fixture
def auth_headers():
    """Get auth headers for test user"""
    # Login
    response = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "password"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_dataset_upload_syncs_to_databricks(auth_headers):
    """
    Full E2E test: Upload dataset → Verify Databricks sync

    Flow:
    1. Upload dataset via /datasets/ingest
    2. Verify local dataset created
    3. Wait for Temporal workflow to complete
    4. Check sync status endpoint
    5. Verify Bronze and Silver tables created
    """
    # Step 1: Upload dataset
    response = client.post(
        "/api/v1/datasets/ingest",
        headers=auth_headers,
        json={
            "name": "E2E Test Dataset",
            "description": "Integration test for Databricks sync",
            "records": [
                {"order_id": "1", "amount": 100.50, "date": "2025-01-15"},
                {"order_id": "2", "amount": 250.00, "date": "2025-01-16"},
                {"order_id": "3", "amount": 175.75, "date": "2025-01-17"}
            ]
        }
    )

    assert response.status_code in [200, 201]
    dataset_id = response.json()["id"]

    # Step 2: Verify local dataset created
    get_response = client.get(
        f"/api/v1/datasets/{dataset_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 200
    dataset = get_response.json()
    assert dataset["row_count"] == 3

    # Step 3: Check initial sync status (should be pending or syncing)
    status_response = client.get(
        f"/api/v1/datasets/{dataset_id}/databricks/status",
        headers=auth_headers
    )
    assert status_response.status_code == 200
    initial_status = status_response.json()
    assert initial_status["databricks_enabled"] == True
    assert initial_status["sync_status"] in ["pending", "syncing"]

    # Step 4: Wait for workflow to complete (max 60 seconds)
    max_wait = 60
    waited = 0
    synced = False

    while waited < max_wait:
        time.sleep(5)
        waited += 5

        status_response = client.get(
            f"/api/v1/datasets/{dataset_id}/databricks/status",
            headers=auth_headers
        )
        status_data = status_response.json()

        if status_data["sync_status"] == "synced":
            synced = True
            break
        elif status_data["sync_status"] == "failed":
            pytest.fail(f"Sync failed: {status_data.get('last_sync_error')}")

    # Step 5: Verify sync completed successfully
    assert synced, f"Sync did not complete within {max_wait} seconds"

    final_status = status_response.json()
    assert final_status["bronze_table"] is not None
    assert final_status["silver_table"] is not None
    assert "catalog" in final_status["bronze_table"]
    assert "bronze" in final_status["bronze_table"]
    assert "silver" in final_status["silver_table"]

    print(f"✓ Dataset synced successfully!")
    print(f"  Bronze: {final_status['bronze_table']}")
    print(f"  Silver: {final_status['silver_table']}")
```

**Step 2: Run test (will fail if MCP/Databricks not set up)**

```bash
cd apps/api
pytest tests/integration/test_databricks_sync_e2e.py -v -s
```

Expected:
- If MCP_ENABLED=false: SKIPPED
- If MCP running: PASS or FAIL with details about MCP/Databricks issue

**Step 3: Debug and fix any integration issues**

Check:
- Is MCP server running? `curl http://localhost:8085/health`
- Is Temporal worker running? `docker-compose logs databricks-worker`
- Check workflow in Temporal UI: `http://localhost:8233`

**Step 4: Commit**

```bash
git add apps/api/tests/integration/test_databricks_sync_e2e.py
git commit -m "test: add E2E integration test for Databricks dataset sync"
```

---

## Task 10: Documentation and Deployment

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Create: `DATABRICKS_SYNC_README.md`

**Step 1: Create feature documentation**

Create: `DATABRICKS_SYNC_README.md`

```markdown
# Databricks Dataset Sync

Automatic synchronization of datasets to Databricks Unity Catalog.

## How It Works

1. **Upload Dataset** → ServiceTsunami ingests to local Parquet (instant)
2. **Trigger Workflow** → Temporal workflow starts in background (async)
3. **Sync to Bronze** → MCP server creates external table pointing to parquet
4. **Transform to Silver** → MCP server creates managed table with type inference
5. **Update Status** → Dataset metadata updated with table names

## Configuration

**Required Environment Variables:**

```bash
# MCP Server
MCP_SERVER_URL=http://localhost:8085
MCP_API_KEY=your-shared-secret-key

# Databricks Sync
DATABRICKS_SYNC_ENABLED=true
DATABRICKS_AUTO_SYNC=true
DATABRICKS_RETRY_ATTEMPTS=3
DATABRICKS_RETRY_INTERVAL=300

# Temporal
TEMPORAL_ADDRESS=temporal:7233
```

## Usage

### Automatic Sync (Default)

Datasets automatically sync to Databricks on upload:

```bash
POST /api/v1/datasets/ingest
{
  "name": "Revenue Q1",
  "records": [...]
}

# Response includes dataset with metadata:
{
  "id": "uuid",
  "metadata": {
    "databricks_enabled": true,
    "sync_status": "pending"
  }
}
```

### Check Sync Status

```bash
GET /api/v1/datasets/{id}/databricks/status

Response:
{
  "sync_status": "synced",
  "bronze_table": "catalog_tenant_123.bronze.revenue_q1",
  "silver_table": "catalog_tenant_123.silver.revenue_q1_clean",
  "last_sync_at": "2025-11-06T14:00:00Z"
}
```

### Query Options

- **Local DuckDB**: Fast, always available, limited to single dataset
- **Databricks**: Slower first query, supports joins, ML, full SQL warehouse features

## Monitoring

### Temporal UI

View workflow status at `http://localhost:8233`:
- See running/completed syncs
- View retry attempts
- Check error details

### API Logs

```bash
docker-compose logs api | grep "Databricks sync"
docker-compose logs databricks-worker
```

## Troubleshooting

**Dataset stuck in "pending" status:**
- Check Temporal worker running: `docker-compose ps databricks-worker`
- Check MCP server accessible: `curl http://localhost:8085/health`
- View workflow in Temporal UI

**Sync fails repeatedly:**
- Check MCP server logs for Databricks auth errors
- Verify Databricks credentials in MCP server .env
- Check network connectivity between containers

**File not found error from MCP:**
- Verify internal endpoint accessible: `GET /internal/storage/datasets/{file}`
- Check MCP_API_KEY matches between ServiceTsunami and MCP server
```

**Step 2: Update CLAUDE.md**

Modify: `CLAUDE.md`

Add to "Additional Documentation" section:

```markdown
- `DATABRICKS_SYNC_README.md`: Automatic dataset sync to Databricks Unity Catalog
```

Add to "Architecture" section after Temporal workflows:

```markdown
**Databricks Integration**: Datasets automatically sync to Databricks Unity Catalog via MCP server:
- Bronze layer: External table pointing to parquet file
- Silver layer: Managed table with type inference and cleaning
- Temporal workflows handle async sync with retry logic
- Status tracking in dataset metadata
- See `DATABRICKS_SYNC_README.md` for details
```

**Step 3: Update README.md**

Modify: `README.md`

Update roadmap to mark Databricks integration as implemented:

```markdown
## Roadmap

### ✅ Completed
- Databricks Unity Catalog integration (Bronze + Silver layers)
- Automatic dataset synchronization via MCP server
- Temporal workflow orchestration

### 🚧 In Progress
- Query federation (cross-system queries)
- Agent creation wizards

### 📋 Planned
- OAuth/SAML SSO providers (e.g., Okta, Azure AD)
- Evaluation dashboards and LangGraph visual editor
- OpenTelemetry + Grafana observability
```

**Step 4: Commit documentation**

```bash
git add CLAUDE.md README.md DATABRICKS_SYNC_README.md
git commit -m "docs: add Databricks dataset sync documentation"
```

---

## Verification Checklist

After implementing all tasks, verify:

- [ ] Configuration settings load correctly
- [ ] Internal file endpoint serves parquet files securely
- [ ] MCP client methods call correct endpoints
- [ ] Temporal workflow and activities are defined
- [ ] Dataset upload triggers workflow when enabled
- [ ] UI shows sync status badges
- [ ] Temporal worker processes workflows
- [ ] Sync status endpoint returns correct data
- [ ] Integration test passes (if MCP/Databricks available)
- [ ] Documentation is complete

**Run full test suite:**
```bash
cd apps/api
pytest -v
```

**Run E2E test suite:**
```bash
BASE_URL=http://localhost:8001 ./scripts/e2e_test_production.sh
```

---

## Deployment Notes

**Production Deployment:**

1. Update `apps/api/.env` on production server with Databricks settings
2. Ensure MCP server is running and accessible
3. Deploy using `./deploy.sh` (will rebuild with new code)
4. Verify Temporal worker started: `docker-compose ps databricks-worker`
5. Test with sample dataset upload
6. Monitor in Temporal UI at `http://production-ip:8233`

**Docker Compose Update:**

The `databricks-worker` service must be added to production `docker-compose.yml`:

```yaml
databricks-worker:
  build:
    context: ./apps/api
    dockerfile: Dockerfile
  command: python -m app.workers.databricks_worker
  env_file:
    - ./apps/api/.env
  depends_on:
    - db
    - temporal
  restart: unless-stopped
```

---

## Success Criteria

1. ✅ Dataset upload completes in <2 seconds (local storage)
2. ✅ Databricks sync completes in <60 seconds for small datasets
3. ✅ Failed syncs retry automatically (3 attempts)
4. ✅ UI shows sync status in real-time
5. ✅ Both Bronze and Silver tables created correctly
6. ✅ All tests pass (unit + integration)
7. ✅ Zero data loss (local always works, Databricks is additive)

---

**Implementation Plan Complete!**

This plan provides step-by-step instructions for implementing automatic Databricks dataset sync. Each task follows TDD principles with clear test-first development, minimal implementation, and frequent commits.
