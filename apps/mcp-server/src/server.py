"""
AgentProvision MCP Server

MCP-compliant server following Anthropic's Model Context Protocol.
Provides tools for data source connections, Databricks operations,
and AI-assisted analysis.

Usage:
    python -m src.server
"""
from mcp.server.fastmcp import FastMCP

from src.config import settings

# Initialize MCP Server
mcp = FastMCP(
    name="AgentProvision",
    instructions="Data lakehouse integration server - connect sources, sync to Databricks, query with AI"
)


# ==================== PostgreSQL Connection Tools ====================

@mcp.tool()
async def connect_postgres(
    name: str,
    host: str,
    port: int,
    database: str,
    user: str,
    password: str,
    tenant_id: str
) -> dict:
    """
    Register a PostgreSQL database connection.

    Credentials are encrypted and stored securely.
    Returns connection_id for use in other tools.

    Args:
        name: Display name for this connection
        host: Database host address
        port: Database port (usually 5432)
        database: Database name
        user: Username
        password: Password
        tenant_id: Your tenant identifier
    """
    from src.tools.postgres import connect_postgres as _connect
    return await _connect(name, host, port, database, user, password, tenant_id)


@mcp.tool()
async def verify_connection(connection_id: str) -> dict:
    """
    Test if a data source connection is working.

    Returns success status and any error details.

    Args:
        connection_id: The connection ID from connect_postgres
    """
    from src.tools.postgres import verify_connection as _verify
    return await _verify(connection_id)


@mcp.tool()
async def list_source_tables(connection_id: str) -> dict:
    """
    List all tables available in the connected source database.

    Returns table names, row counts, and column info.

    Args:
        connection_id: The connection ID to query
    """
    from src.tools.postgres import list_source_tables as _list
    return await _list(connection_id)


# ==================== Ingestion Tools ====================

@mcp.tool()
async def sync_table_to_bronze(
    connection_id: str,
    table_name: str,
    sync_mode: str = "full"
) -> dict:
    """
    Sync a table from source database to Databricks Bronze layer.

    Extracts data from the source and loads it into Databricks
    as a raw Bronze table.

    Args:
        connection_id: The data source connection to use
        table_name: Table to sync (e.g., "public.customers")
        sync_mode: "full" (replace all) or "incremental" (append new)
    """
    from src.tools.ingestion import sync_table_to_bronze as _sync
    return await _sync(connection_id, table_name, sync_mode)


@mcp.tool()
async def upload_file(
    file_content: str,
    file_name: str,
    dataset_name: str,
    tenant_id: str
) -> dict:
    """
    Upload a CSV/Excel file to Databricks Bronze layer.

    Args:
        file_content: Base64 encoded file content
        file_name: Original file name (for format detection)
        dataset_name: Name for the dataset in Databricks
        tenant_id: Your tenant identifier
    """
    from src.tools.ingestion import upload_file as _upload
    return await _upload(file_content, file_name, dataset_name, tenant_id)


# ==================== Databricks Query Tools ====================

@mcp.tool()
async def query_sql(sql: str, tenant_id: str) -> dict:
    """
    Execute SQL query against Databricks.

    Query is automatically scoped to your tenant's catalog.

    Args:
        sql: SQL query to execute
        tenant_id: Your tenant identifier
    """
    from src.tools.databricks_tools import query_sql as _query
    return await _query(sql, tenant_id)


@mcp.tool()
async def list_tables(tenant_id: str, layer: str = "bronze") -> dict:
    """
    List tables in your Databricks catalog.

    Args:
        tenant_id: Your tenant identifier
        layer: "bronze", "silver", or "gold"
    """
    from src.tools.databricks_tools import list_tables as _list
    return await _list(tenant_id, layer)


@mcp.tool()
async def describe_table(table_name: str, tenant_id: str) -> dict:
    """
    Get detailed schema and statistics for a table.

    Args:
        table_name: Table name (can include schema, e.g., "bronze.customers")
        tenant_id: Your tenant identifier
    """
    from src.tools.databricks_tools import describe_table as _describe
    return await _describe(table_name, tenant_id)


@mcp.tool()
async def transform_to_silver(
    bronze_table: str,
    tenant_id: str,
    transformations: list = None
) -> dict:
    """
    Transform Bronze table to Silver (cleaned, typed).

    Applies data cleaning: removes duplicates, handles nulls,
    infers proper data types.

    Args:
        bronze_table: Source Bronze table name
        tenant_id: Your tenant identifier
        transformations: Optional list of custom transformations
    """
    from src.tools.databricks_tools import transform_to_silver as _transform
    return await _transform(bronze_table, tenant_id, transformations)


# ==================== Entry Point ====================

def main():
    """Run MCP server"""
    mcp.run(transport=settings.MCP_TRANSPORT, port=settings.MCP_PORT)


if __name__ == "__main__":
    main()
