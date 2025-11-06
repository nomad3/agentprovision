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

@pytest.mark.asyncio
async def test_transform_to_silver():
    """Test MCP client can transform Bronze to Silver"""
    mcp = MCPClient()

    with patch.object(mcp, '_request', new_callable=AsyncMock) as mock_request:
        mock_request.return_value = {
            "silver_table": "catalog.silver.test_dataset_clean",
            "row_count": 100
        }

        result = await mcp.transform_to_silver(
            bronze_table="catalog.bronze.test_dataset",
            tenant_id="tenant-123"
        )

        assert result["silver_table"] == "catalog.silver.test_dataset_clean"
        assert result["row_count"] == 100

        # Verify correct endpoint called
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[0][0] == "POST"  # method
        assert "/databricks/transformations/silver" in call_args[0][1]  # endpoint

@pytest.mark.asyncio
async def test_delete_dataset_from_databricks():
    """Test MCP client can delete dataset from Databricks"""
    mcp = MCPClient()

    with patch.object(mcp, '_request', new_callable=AsyncMock) as mock_request:
        mock_request.return_value = {
            "status": "deleted",
            "bronze_table_dropped": True,
            "silver_table_dropped": True
        }

        result = await mcp.delete_dataset_from_databricks(
            dataset_id="dataset-456",
            tenant_id="tenant-123"
        )

        assert result["status"] == "deleted"

        # Verify correct endpoint called
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[0][0] == "DELETE"  # method
        assert "/databricks/datasets/dataset-456" in call_args[0][1]  # endpoint
