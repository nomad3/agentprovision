"""Databricks client that communicates with MCP server.

All data operations route through the MCP server to Databricks Unity Catalog.
"""
import httpx
from typing import Any, Optional

from config.settings import settings


class DatabricksClient:
    """HTTP client for MCP server (Databricks operations)."""

    def __init__(self):
        self.base_url = settings.mcp_server_url
        self.api_key = settings.mcp_api_key
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"X-API-Key": self.api_key},
            timeout=60.0,
        )

    async def query_sql(
        self,
        sql: str,
        catalog: Optional[str] = None,
        limit: int = 1000,
    ) -> dict[str, Any]:
        """Execute SQL query on Databricks."""
        response = await self.client.post(
            "/tools/query_sql",
            json={
                "sql": sql,
                "catalog": catalog,
                "limit": limit,
            },
        )
        response.raise_for_status()
        return response.json()

    async def list_tables(
        self,
        catalog: str,
        schema: str = "silver",
    ) -> list[dict[str, Any]]:
        """List tables in Databricks catalog."""
        response = await self.client.post(
            "/tools/list_tables",
            json={
                "catalog": catalog,
                "schema": schema,
            },
        )
        response.raise_for_status()
        return response.json()

    async def describe_table(
        self,
        catalog: str,
        schema: str,
        table: str,
    ) -> dict[str, Any]:
        """Get table schema and statistics."""
        response = await self.client.post(
            "/tools/describe_table",
            json={
                "catalog": catalog,
                "schema": schema,
                "table": table,
            },
        )
        response.raise_for_status()
        return response.json()

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
_client: Optional[DatabricksClient] = None


def get_databricks_client() -> DatabricksClient:
    """Get or create Databricks client singleton."""
    global _client
    if _client is None:
        _client = DatabricksClient()
    return _client
