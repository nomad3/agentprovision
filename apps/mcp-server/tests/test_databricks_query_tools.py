"""Tests for Databricks MCP tools"""
import pytest
from unittest.mock import AsyncMock, patch

from src.tools.databricks_tools import query_sql, list_tables, describe_table, transform_to_silver


@pytest.mark.asyncio
async def test_query_sql():
    """Test executing SQL query"""
    with patch('src.tools.databricks_tools.databricks') as mock_db:
        mock_db.execute_query = AsyncMock(return_value={
            "rows": [{"count": 42}],
            "columns": ["count"],
            "row_count": 1
        })

        result = await query_sql("SELECT COUNT(*) as count FROM customers", "tenant-123")

        assert result["rows"][0]["count"] == 42
        mock_db.execute_query.assert_called_once()


@pytest.mark.asyncio
async def test_list_tables():
    """Test listing tables"""
    with patch('src.tools.databricks_tools.databricks') as mock_db:
        mock_db.list_tables = AsyncMock(return_value={
            "tables": [{"name": "customers"}, {"name": "orders"}],
            "count": 2
        })

        result = await list_tables("tenant-123", "bronze")

        assert result["count"] == 2
        assert result["tables"][0]["name"] == "customers"


@pytest.mark.asyncio
async def test_describe_table():
    """Test describing table schema"""
    with patch('src.tools.databricks_tools.databricks') as mock_db:
        mock_db.describe_table = AsyncMock(return_value={
            "table": "tenant_123.bronze.customers",
            "columns": [{"name": "id", "type": "INT"}],
            "row_count": 100
        })

        result = await describe_table("customers", "tenant-123")

        assert result["row_count"] == 100
        assert result["columns"][0]["name"] == "id"


@pytest.mark.asyncio
async def test_transform_to_silver():
    """Test Bronze to Silver transformation"""
    with patch('src.tools.databricks_tools.databricks') as mock_db:
        mock_db.transform_to_silver = AsyncMock(return_value={
            "bronze_table": "tenant_123.bronze.customers",
            "silver_table": "tenant_123.silver.customers",
            "row_count": 95,
            "status": "transformed"
        })

        result = await transform_to_silver("tenant_123.bronze.customers", "tenant-123")

        assert result["silver_table"] == "tenant_123.silver.customers"
        assert result["row_count"] == 95
