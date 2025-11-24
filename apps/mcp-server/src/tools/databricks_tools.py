"""
Databricks MCP Tools

Tools for querying and transforming data in Databricks Unity Catalog.
"""
from typing import Dict, Any, List, Optional

from src.clients.databricks_client import DatabricksClient

databricks = DatabricksClient()


async def query_sql(sql: str, tenant_id: str) -> Dict[str, Any]:
    """
    Execute SQL query against Databricks.

    Query is automatically scoped to tenant's catalog for security.

    Args:
        sql: SQL query to execute
        tenant_id: Tenant identifier (for catalog scoping)

    Returns:
        rows, columns, row_count
    """
    result = await databricks.execute_query(sql, tenant_id)
    return result


async def list_tables(tenant_id: str, layer: str = "bronze") -> Dict[str, Any]:
    """
    List tables in tenant's Databricks catalog.

    Args:
        tenant_id: Tenant identifier
        layer: "bronze", "silver", or "gold"

    Returns:
        catalog, layer, tables, count
    """
    result = await databricks.list_tables(tenant_id, layer)
    return result


async def describe_table(table_name: str, tenant_id: str) -> Dict[str, Any]:
    """
    Get detailed schema and statistics for a table.

    Args:
        table_name: Table name (can be schema.table or just table)
        tenant_id: Tenant identifier

    Returns:
        table, columns, row_count
    """
    result = await databricks.describe_table(table_name, tenant_id)
    return result


async def transform_to_silver(
    bronze_table: str,
    tenant_id: str,
    transformations: Optional[List[Dict]] = None
) -> Dict[str, Any]:
    """
    Transform Bronze table to Silver (cleaned, typed).

    Default transformations:
    - Remove duplicate rows
    - Handle null values

    Args:
        bronze_table: Source Bronze table name
        tenant_id: Tenant identifier
        transformations: Optional custom transformations

    Returns:
        bronze_table, silver_table, row_count, status
    """
    result = await databricks.transform_to_silver(bronze_table, tenant_id, transformations)
    return result
