import pytest
from unittest.mock import patch, AsyncMock, MagicMock, Mock
from app.core.config import settings
import uuid


def test_dataset_upload_triggers_workflow():
    """Test dataset upload triggers Databricks sync workflow"""
    # Mock database session
    mock_db = Mock()
    mock_db.add = Mock()
    mock_db.commit = Mock()
    mock_db.refresh = Mock()

    tenant_id = uuid.uuid4()

    # Mock the _persist_dataframe function to avoid file I/O
    with patch('app.services.datasets._persist_dataframe') as mock_persist:
        # Create a mock dataset with proper structure
        mock_dataset = Mock()
        mock_dataset.id = uuid.uuid4()
        mock_dataset.name = "Test Dataset"
        mock_dataset.tenant_id = tenant_id
        mock_dataset.metadata_ = {}

        mock_persist.return_value = mock_dataset

        # Mock asyncio.create_task - this is what actually triggers the workflow
        with patch('app.services.datasets.asyncio.create_task') as mock_create_task:
            # Import the function we're testing
            from app.services import datasets as dataset_service

            # Upload dataset
            records = [{"id": 1, "value": 100}]
            dataset = dataset_service.ingest_records(
                db=mock_db,
                tenant_id=tenant_id,
                records=records,
                name="Test Dataset",
                description="Test",
                source_type="upload"
            )

            # Verify workflow was triggered if auto-sync enabled
            if settings.DATABRICKS_AUTO_SYNC and settings.MCP_ENABLED:
                # Verify create_task was called (async workflow start)
                mock_create_task.assert_called_once()

                # Verify dataset marked as pending
                assert dataset.metadata_["databricks_enabled"] == True
                assert dataset.metadata_["sync_status"] == "pending"
                assert dataset.metadata_["last_sync_attempt"] is None
            else:
                # If auto-sync disabled, workflow should not be triggered
                mock_create_task.assert_not_called()


def test_dataset_upload_graceful_degradation():
    """Test dataset upload succeeds even if workflow start fails"""
    # Mock database session
    mock_db = Mock()
    mock_db.add = Mock()
    mock_db.commit = Mock()
    mock_db.refresh = Mock()

    tenant_id = uuid.uuid4()

    # Mock the _persist_dataframe function to avoid file I/O
    with patch('app.services.datasets._persist_dataframe') as mock_persist:
        # Create a mock dataset with proper structure
        mock_dataset = Mock()
        mock_dataset.id = uuid.uuid4()
        mock_dataset.name = "Test Dataset Graceful"
        mock_dataset.tenant_id = tenant_id
        mock_dataset.metadata_ = {}

        mock_persist.return_value = mock_dataset

        # Mock asyncio.create_task to raise an exception
        with patch('app.services.datasets.asyncio.create_task') as mock_create_task:
            mock_create_task.side_effect = Exception("Temporal connection error")

            # Import the function we're testing
            from app.services import datasets as dataset_service

            # Upload dataset should still succeed
            records = [{"id": 1, "value": 200}]
            dataset = dataset_service.ingest_records(
                db=mock_db,
                tenant_id=tenant_id,
                records=records,
                name="Test Dataset Graceful",
                description="Test graceful degradation",
                source_type="upload"
            )

            # Verify dataset was created successfully
            assert dataset.id is not None
            assert dataset.name == "Test Dataset Graceful"

            # Verify failure was recorded in metadata (if auto-sync enabled)
            if settings.DATABRICKS_AUTO_SYNC and settings.MCP_ENABLED:
                assert dataset.metadata_ is not None
                assert dataset.metadata_.get("sync_status") == "failed"
                assert "Temporal connection error" in dataset.metadata_.get("last_sync_error", "")


def test_dataset_upload_without_auto_sync():
    """Test dataset upload when auto-sync is disabled"""
    # Mock database session
    mock_db = Mock()
    mock_db.add = Mock()
    mock_db.commit = Mock()
    mock_db.refresh = Mock()

    tenant_id = uuid.uuid4()

    # Temporarily disable auto-sync
    original_auto_sync = settings.DATABRICKS_AUTO_SYNC
    settings.DATABRICKS_AUTO_SYNC = False

    try:
        # Mock the _persist_dataframe function to avoid file I/O
        with patch('app.services.datasets._persist_dataframe') as mock_persist:
            # Create a mock dataset with proper structure
            mock_dataset = Mock()
            mock_dataset.id = uuid.uuid4()
            mock_dataset.name = "Test Dataset No Sync"
            mock_dataset.tenant_id = tenant_id
            mock_dataset.metadata_ = {}

            mock_persist.return_value = mock_dataset

            with patch('app.services.datasets.asyncio.create_task') as mock_create_task:
                # Import the function we're testing
                from app.services import datasets as dataset_service

                # Upload dataset
                records = [{"id": 1, "value": 300}]
                dataset = dataset_service.ingest_records(
                    db=mock_db,
                    tenant_id=tenant_id,
                    records=records,
                    name="Test Dataset No Sync",
                    description="Test without auto-sync",
                    source_type="upload"
                )

                # Verify workflow was NOT triggered
                mock_create_task.assert_not_called()

                # Verify dataset has no Databricks metadata
                if dataset.metadata_:
                    assert dataset.metadata_.get("databricks_enabled") != True

    finally:
        # Restore original setting
        settings.DATABRICKS_AUTO_SYNC = original_auto_sync
