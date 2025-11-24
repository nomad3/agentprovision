"""Tests for Databricks client"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.clients.databricks_client import DatabricksClient


@pytest.mark.asyncio
async def test_databricks_client_executes_query():
    """Test executing SQL query"""
    client = DatabricksClient()

    mock_cursor = MagicMock()
    # fetchall returns tuples, not dicts
    mock_cursor.fetchall.return_value = [(1, "test")]
    mock_cursor.description = [("id",), ("name",)]

    with patch.object(client, '_get_connection') as mock_conn:
        mock_conn.return_value.cursor.return_value.__enter__ = MagicMock(return_value=mock_cursor)
        mock_conn.return_value.cursor.return_value.__exit__ = MagicMock(return_value=False)

        result = await client.execute_query("SELECT * FROM test", "tenant_123")

        assert result["rows"] == [{"id": 1, "name": "test"}]
        assert result["columns"] == ["id", "name"]


@pytest.mark.asyncio
async def test_databricks_client_lists_tables():
    """Test listing tables in catalog"""
    client = DatabricksClient()

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"tableName": "customers", "tableType": "MANAGED"},
        {"tableName": "orders", "tableType": "EXTERNAL"}
    ]

    with patch.object(client, '_get_connection') as mock_conn:
        mock_conn.return_value.cursor.return_value.__enter__ = MagicMock(return_value=mock_cursor)
        mock_conn.return_value.cursor.return_value.__exit__ = MagicMock(return_value=False)

        result = await client.list_tables("tenant_123", "bronze")

        assert len(result["tables"]) == 2
        assert result["tables"][0]["name"] == "customers"
