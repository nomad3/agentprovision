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
    1. Download parquet from AgentProvision
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
    dataset = None  # Initialize to prevent NameError in except block
    try:
        # Get dataset from database with tenant isolation
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.tenant_id == tenant_id
        ).first()
        if not dataset:
            raise ValueError(f"Dataset {dataset_id} not found for tenant {tenant_id}")

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

    Raises:
        MCPClientError: If MCP server call fails
    """
    activity.logger.info(f"Transforming Bronze to Silver: {bronze_table}")

    try:
        mcp = get_mcp_client()
        result = await mcp.transform_to_silver(
            bronze_table=bronze_table,
            tenant_id=tenant_id
        )

        activity.logger.info(f"Silver table created: {result['silver_table']}")

        return result
    except MCPClientError as e:
        activity.logger.error(f"Failed to transform to Silver: {e}")
        raise
    except Exception as e:
        activity.logger.error(f"Unexpected error in transform_to_silver: {e}")
        raise


@activity.defn
async def update_dataset_metadata(
    dataset_id: str,
    tenant_id: str,
    bronze_result: Dict[str, Any],
    silver_result: Dict[str, Any]
) -> None:
    """
    Update dataset metadata with Databricks table information

    Args:
        dataset_id: UUID of dataset
        tenant_id: UUID of tenant
        bronze_result: Result from sync_to_bronze activity
        silver_result: Result from transform_to_silver activity
    """
    activity.logger.info(f"Updating metadata for dataset {dataset_id}")

    db = SessionLocal()
    dataset = None  # Initialize to prevent NameError in except block
    try:
        # Get dataset from database with tenant isolation
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.tenant_id == tenant_id
        ).first()
        if not dataset:
            raise ValueError(f"Dataset {dataset_id} not found for tenant {tenant_id}")

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

    except Exception as e:
        # Rollback on error
        db.rollback()
        activity.logger.error(f"Failed to update dataset metadata: {e}")

        # Try to mark as failed
        if dataset:
            try:
                dataset.metadata_["sync_status"] = "failed"
                dataset.metadata_["last_sync_error"] = str(e)
                db.commit()
            except Exception as commit_error:
                activity.logger.error(f"Failed to update error status: {commit_error}")
        raise
    finally:
        db.close()
