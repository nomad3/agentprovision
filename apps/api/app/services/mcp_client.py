"""
MCP Server Client for AgentProvision

This service handles communication with the MCP server,
which provides the Databricks connector and other external integrations.
"""

from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MCPClientError(Exception):
    """Base exception for MCP client errors"""
    pass


class MCPClient:
    """
    Client for communicating with the MCP Server.

    The MCP server provides:
    - Databricks connector (notebooks, datasets, jobs, model serving)
    - External integrations (ADP, NetSuite, etc.)
    - Snowflake analytics
    """

    def __init__(self):
        self.base_url = settings.MCP_SERVER_URL.rstrip('/')
        self.api_key = settings.MCP_API_KEY
        self.timeout = 30.0
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
            )
        return self._client

    async def close(self):
        """Close HTTP client"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Make HTTP request to MCP server"""
        client = await self._get_client()
        url = f"/agentprovision/v1{endpoint}"

        logger.info(f"MCP request: {method} {url}")

        try:
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"MCP error: {e.response.status_code} - {e.response.text}")
            raise MCPClientError(f"MCP server error: {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"MCP request failed: {str(e)}")
            raise MCPClientError(f"Failed to connect to MCP server: {str(e)}")

    # ==================== Databricks Catalog Operations ====================

    async def create_tenant_catalog(
        self,
        tenant_id: str,
        catalog_name: str
    ) -> Dict[str, Any]:
        """Create Unity Catalog for tenant"""
        return await self._request(
            "POST",
            "/databricks/catalogs",
            json={
                "tenant_id": tenant_id,
                "catalog_name": catalog_name,
                "comment": f"Catalog for tenant {tenant_id}"
            }
        )

    async def get_catalog_status(
        self,
        tenant_id: str
    ) -> Dict[str, Any]:
        """Get tenant catalog status"""
        return await self._request(
            "GET",
            f"/databricks/catalogs/{tenant_id}"
        )

    # ==================== Databricks Datasets (Delta Tables) ====================

    async def create_dataset(
        self,
        tenant_id: str,
        dataset_name: str,
        schema: List[Dict[str, str]],
        data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Create Delta Lake table in Databricks

        Args:
            tenant_id: Tenant UUID
            dataset_name: Name of the dataset/table
            schema: List of column definitions [{"name": "col1", "type": "string"}, ...]
            data: Optional initial data to load

        Returns:
            Dataset metadata including table path
        """
        return await self._request(
            "POST",
            "/databricks/datasets",
            json={
                "tenant_id": tenant_id,
                "name": dataset_name,
                "schema": schema,
                "data": data or []
            }
        )

    async def upload_dataset_file(
        self,
        tenant_id: str,
        dataset_name: str,
        file_content: bytes,
        file_format: str = "parquet"
    ) -> Dict[str, Any]:
        """
        Upload file to Databricks and create Delta table

        Args:
            tenant_id: Tenant UUID
            dataset_name: Name for the dataset
            file_content: File bytes
            file_format: Format (csv, parquet, json)
        """
        files = {"file": ("upload." + file_format, file_content)}

        return await self._request(
            "POST",
            "/databricks/datasets/upload",
            params={
                "tenant_id": tenant_id,
                "dataset_name": dataset_name,
                "format": file_format
            },
            files=files
        )

    async def query_dataset(
        self,
        tenant_id: str,
        dataset_name: str,
        sql: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Query dataset using SQL

        Args:
            tenant_id: Tenant UUID
            dataset_name: Dataset/table name
            sql: Optional SQL query (defaults to SELECT *)
            limit: Row limit
        """
        return await self._request(
            "POST",
            "/databricks/datasets/query",
            json={
                "tenant_id": tenant_id,
                "dataset_name": dataset_name,
                "sql": sql or f"SELECT * FROM {dataset_name} LIMIT {limit}"
            }
        )

    async def get_dataset_metadata(
        self,
        tenant_id: str,
        dataset_name: str
    ) -> Dict[str, Any]:
        """Get dataset metadata (schema, row count, etc.)"""
        return await self._request(
            "GET",
            f"/databricks/datasets/{tenant_id}/{dataset_name}"
        )

    async def delete_dataset(
        self,
        tenant_id: str,
        dataset_name: str
    ) -> Dict[str, Any]:
        """Delete Delta table"""
        return await self._request(
            "DELETE",
            f"/databricks/datasets/{tenant_id}/{dataset_name}"
        )

    # ==================== Databricks Notebooks ====================

    async def create_notebook(
        self,
        tenant_id: str,
        notebook_name: str,
        language: str = "python",
        content: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create Databricks notebook

        Args:
            tenant_id: Tenant UUID
            notebook_name: Name for the notebook
            language: python, sql, scala, or r
            content: Initial notebook content (code cells)
        """
        return await self._request(
            "POST",
            "/databricks/notebooks",
            json={
                "tenant_id": tenant_id,
                "name": notebook_name,
                "language": language,
                "content": content or "# New notebook\n"
            }
        )

    async def get_notebook(
        self,
        tenant_id: str,
        notebook_path: str
    ) -> Dict[str, Any]:
        """Get notebook content and metadata"""
        return await self._request(
            "GET",
            f"/databricks/notebooks/{tenant_id}",
            params={"path": notebook_path}
        )

    async def update_notebook(
        self,
        tenant_id: str,
        notebook_path: str,
        content: str
    ) -> Dict[str, Any]:
        """Update notebook content"""
        return await self._request(
            "PUT",
            f"/databricks/notebooks/{tenant_id}",
            json={
                "path": notebook_path,
                "content": content
            }
        )

    async def execute_notebook(
        self,
        tenant_id: str,
        notebook_path: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute notebook and return run ID

        Args:
            tenant_id: Tenant UUID
            notebook_path: Path to notebook in workspace
            parameters: Notebook parameters
        """
        return await self._request(
            "POST",
            "/databricks/notebooks/execute",
            json={
                "tenant_id": tenant_id,
                "notebook_path": notebook_path,
                "parameters": parameters or {}
            }
        )

    async def get_notebook_run_status(
        self,
        run_id: str
    ) -> Dict[str, Any]:
        """Get notebook execution status"""
        return await self._request(
            "GET",
            f"/databricks/notebooks/runs/{run_id}"
        )

    async def delete_notebook(
        self,
        tenant_id: str,
        notebook_path: str
    ) -> Dict[str, Any]:
        """Delete notebook"""
        return await self._request(
            "DELETE",
            f"/databricks/notebooks/{tenant_id}",
            params={"path": notebook_path}
        )

    # ==================== Databricks Jobs (Data Pipelines) ====================

    async def create_job(
        self,
        tenant_id: str,
        job_name: str,
        tasks: List[Dict[str, Any]],
        schedule: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create Databricks job (multi-task workflow)

        Args:
            tenant_id: Tenant UUID
            job_name: Name for the job
            tasks: List of task definitions
            schedule: Optional cron schedule
        """
        return await self._request(
            "POST",
            "/databricks/jobs",
            json={
                "tenant_id": tenant_id,
                "name": job_name,
                "tasks": tasks,
                "schedule": schedule
            }
        )

    async def run_job(
        self,
        tenant_id: str,
        job_id: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Trigger job execution"""
        return await self._request(
            "POST",
            f"/databricks/jobs/{job_id}/run",
            json={
                "tenant_id": tenant_id,
                "job_parameters": parameters or {}
            }
        )

    async def get_job_status(
        self,
        job_id: str
    ) -> Dict[str, Any]:
        """Get job configuration and status"""
        return await self._request(
            "GET",
            f"/databricks/jobs/{job_id}"
        )

    async def get_job_run_status(
        self,
        run_id: str
    ) -> Dict[str, Any]:
        """Get job run status"""
        return await self._request(
            "GET",
            f"/databricks/runs/{run_id}"
        )

    async def list_job_runs(
        self,
        job_id: str,
        limit: int = 25
    ) -> Dict[str, Any]:
        """List recent job runs"""
        return await self._request(
            "GET",
            f"/databricks/jobs/{job_id}/runs",
            params={"limit": limit}
        )

    async def cancel_job_run(
        self,
        run_id: str
    ) -> Dict[str, Any]:
        """Cancel running job"""
        return await self._request(
            "POST",
            f"/databricks/runs/{run_id}/cancel"
        )

    async def delete_job(
        self,
        job_id: str
    ) -> Dict[str, Any]:
        """Delete job"""
        return await self._request(
            "DELETE",
            f"/databricks/jobs/{job_id}"
        )

    # ==================== Databricks Model Serving (AI Agents) ====================

    async def deploy_model(
        self,
        tenant_id: str,
        model_name: str,
        model_version: str,
        endpoint_name: str,
        workload_size: str = "Small"
    ) -> Dict[str, Any]:
        """
        Deploy model to serving endpoint

        Args:
            tenant_id: Tenant UUID
            model_name: Registered model name
            model_version: Model version to deploy
            endpoint_name: Name for the endpoint
            workload_size: Small, Medium, or Large
        """
        return await self._request(
            "POST",
            "/databricks/serving-endpoints",
            json={
                "tenant_id": tenant_id,
                "name": endpoint_name,
                "model_name": model_name,
                "model_version": model_version,
                "workload_size": workload_size,
                "scale_to_zero_enabled": True
            }
        )

    async def invoke_model(
        self,
        endpoint_name: str,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Invoke model serving endpoint"""
        return await self._request(
            "POST",
            f"/databricks/serving-endpoints/{endpoint_name}/invoke",
            json={"input": input_data}
        )

    async def get_endpoint_status(
        self,
        endpoint_name: str
    ) -> Dict[str, Any]:
        """Get model serving endpoint status"""
        return await self._request(
            "GET",
            f"/databricks/serving-endpoints/{endpoint_name}"
        )

    async def delete_endpoint(
        self,
        endpoint_name: str
    ) -> Dict[str, Any]:
        """Delete model serving endpoint"""
        return await self._request(
            "DELETE",
            f"/databricks/serving-endpoints/{endpoint_name}"
        )

    # ==================== Databricks Vector Search ====================

    async def create_vector_index(
        self,
        tenant_id: str,
        index_name: str,
        source_table: str,
        embedding_dimension: int,
        embedding_column: str = "embedding"
    ) -> Dict[str, Any]:
        """
        Create vector search index

        Args:
            tenant_id: Tenant UUID
            index_name: Name for the index
            source_table: Delta table with embeddings
            embedding_dimension: Dimension of embeddings
            embedding_column: Column containing embeddings
        """
        return await self._request(
            "POST",
            "/databricks/vector-indexes",
            json={
                "tenant_id": tenant_id,
                "name": index_name,
                "source_table": source_table,
                "embedding_dimension": embedding_dimension,
                "embedding_column": embedding_column
            }
        )

    async def search_vectors(
        self,
        index_name: str,
        query_vector: List[float],
        num_results: int = 10
    ) -> Dict[str, Any]:
        """Search vector index"""
        return await self._request(
            "POST",
            f"/databricks/vector-indexes/{index_name}/search",
            json={
                "query_vector": query_vector,
                "num_results": num_results
            }
        )

    async def delete_vector_index(
        self,
        index_name: str
    ) -> Dict[str, Any]:
        """Delete vector index"""
        return await self._request(
            "DELETE",
            f"/databricks/vector-indexes/{index_name}"
        )

    # ==================== Databricks Dataset Sync Operations ====================

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
        1. Download parquet file from AgentProvision
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
        # MCP server will call: GET http://agentprovision-api:8001/internal/storage/datasets/{file_name}
        parquet_url = f"http://agentprovision-api:8001/internal/storage/datasets/{parquet_file_name}"

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

    async def transform_to_silver(
        self,
        bronze_table: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Transform Bronze table to Silver

        MCP server applies transformations:
        - Type inference and casting
        - Data cleaning (nulls, duplicates)
        - Column renaming (snake_case)

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

    # ==================== Health Check ====================

    async def health_check(self) -> Dict[str, Any]:
        """Check MCP server and Databricks connection health"""
        return await self._request("GET", "/health")


# Singleton instance
_mcp_client: Optional[MCPClient] = None


def get_mcp_client() -> MCPClient:
    """Get singleton MCP client instance"""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MCPClient()
    return _mcp_client
