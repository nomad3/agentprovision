import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import timedelta

# Test the workflow definition exists and is properly configured
def test_workflow_definition_exists():
    """Test that DatasetSyncWorkflow is defined and configured"""
    from app.workflows.dataset_sync import DatasetSyncWorkflow
    from temporalio import workflow

    # Verify it's a workflow
    assert hasattr(DatasetSyncWorkflow, '__temporal_workflow_definition')

    # Verify it has a run method
    assert hasattr(DatasetSyncWorkflow, 'run')

    # Verify it's marked as unsandboxed (required for DB access)
    defn = DatasetSyncWorkflow.__temporal_workflow_definition
    assert defn.sandboxed == False


def test_workflow_structure():
    """Test workflow has correct structure and configuration"""
    from app.workflows.dataset_sync import DatasetSyncWorkflow
    import inspect

    # Get the run method signature
    sig = inspect.signature(DatasetSyncWorkflow.run)
    params = list(sig.parameters.keys())

    # Should have self, dataset_id, tenant_id
    assert 'self' in params
    assert 'dataset_id' in params
    assert 'tenant_id' in params


# Test activities exist and are properly decorated
def test_activities_exist():
    """Test that all required activities are defined"""
    from app.workflows.activities.databricks_sync import (
        sync_to_bronze,
        transform_to_silver,
        update_dataset_metadata
    )
    from temporalio import activity

    # Verify activities are decorated
    assert hasattr(sync_to_bronze, '__temporal_activity_definition')
    assert hasattr(transform_to_silver, '__temporal_activity_definition')
    assert hasattr(update_dataset_metadata, '__temporal_activity_definition')


@pytest.mark.asyncio
async def test_sync_to_bronze_activity():
    """Test sync_to_bronze activity with mocked dependencies"""
    from app.workflows.activities.databricks_sync import sync_to_bronze

    # Mock the database and MCP client
    with patch('app.workflows.activities.databricks_sync.SessionLocal') as mock_session_local, \
         patch('app.workflows.activities.databricks_sync.get_mcp_client') as mock_get_mcp:

        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_dataset = MagicMock()
        mock_dataset.id = "dataset-123"
        mock_dataset.name = "Test Dataset"
        mock_dataset.file_name = "test.parquet"
        mock_dataset.schema_ = [{"name": "col1", "type": "string"}]
        mock_dataset.metadata_ = {}

        mock_db.query.return_value.filter.return_value.first.return_value = mock_dataset

        mock_mcp = MagicMock()
        mock_mcp.create_dataset_in_databricks = AsyncMock(return_value={
            "bronze_table": "catalog.bronze.test_dataset",
            "row_count": 100
        })
        mock_get_mcp.return_value = mock_mcp

        # Execute activity
        result = await sync_to_bronze("dataset-123", "tenant-456")

        # Verify result
        assert result["bronze_table"] == "catalog.bronze.test_dataset"
        assert result["row_count"] == 100

        # Verify MCP client was called
        mock_mcp.create_dataset_in_databricks.assert_called_once()


@pytest.mark.asyncio
async def test_transform_to_silver_activity():
    """Test transform_to_silver activity with mocked MCP client"""
    from app.workflows.activities.databricks_sync import transform_to_silver

    with patch('app.workflows.activities.databricks_sync.get_mcp_client') as mock_get_mcp:
        mock_mcp = MagicMock()
        mock_mcp.transform_to_silver = AsyncMock(return_value={
            "silver_table": "catalog.silver.test_dataset_clean",
            "row_count": 100
        })
        mock_get_mcp.return_value = mock_mcp

        # Execute activity
        result = await transform_to_silver("catalog.bronze.test_dataset", "tenant-456")

        # Verify result
        assert result["silver_table"] == "catalog.silver.test_dataset_clean"
        assert result["row_count"] == 100

        # Verify MCP client was called with correct args
        mock_mcp.transform_to_silver.assert_called_once_with(
            bronze_table="catalog.bronze.test_dataset",
            tenant_id="tenant-456"
        )


@pytest.mark.asyncio
async def test_update_dataset_metadata_activity():
    """Test update_dataset_metadata activity with mocked database"""
    from app.workflows.activities.databricks_sync import update_dataset_metadata

    with patch('app.workflows.activities.databricks_sync.SessionLocal') as mock_session_local:
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_dataset = MagicMock()
        mock_dataset.id = "dataset-123"
        mock_dataset.metadata_ = {}

        mock_db.query.return_value.filter.return_value.first.return_value = mock_dataset

        bronze_result = {"bronze_table": "catalog.bronze.test", "row_count": 100}
        silver_result = {"silver_table": "catalog.silver.test_clean", "row_count": 100}

        # Execute activity
        await update_dataset_metadata("dataset-123", bronze_result, silver_result)

        # Verify metadata was updated
        assert mock_dataset.metadata_["databricks_enabled"] == True
        assert mock_dataset.metadata_["sync_status"] == "synced"
        assert mock_dataset.metadata_["bronze_table"] == "catalog.bronze.test"
        assert mock_dataset.metadata_["silver_table"] == "catalog.silver.test_clean"
        assert "last_sync_at" in mock_dataset.metadata_

        # Verify commit was called
        mock_db.commit.assert_called()
