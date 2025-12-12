"""
Enhanced Dataset Service with Databricks Integration

This service extends the base datasets.py with Databricks/MCP functionality.
Uses a hybrid approach: local storage + optional Databricks Delta Lake.
"""

from __future__ import annotations

import uuid
from typing import Optional
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.dataset import Dataset
from app.services.mcp_client import get_mcp_client, MCPClientError
from app.utils.logger import get_logger
from app.services import datasets as base_datasets

logger = get_logger(__name__)


async def ingest_tabular_with_databricks(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    file: UploadFile,
    name: str,
    description: str | None = None,
) -> Dataset:
    """
    Ingest file to both local storage AND Databricks Delta Lake

    Flow:
    1. Load file with pandas (reuse base logic)
    2. Persist locally (reuse base logic)
    3. If MCP enabled: Upload to Databricks
    4. Store Databricks metadata

    Args:
        db: Database session
        tenant_id: Tenant UUID
        file: Uploaded file
        name: Dataset name
        description: Optional description

    Returns:
        Dataset with Databricks metadata if successful
    """
    # Step 1 & 2: Use existing local ingestion
    logger.info(f"Ingesting dataset '{name}' for tenant {tenant_id}")
    dataset = base_datasets.ingest_tabular(
        db,
        tenant_id=tenant_id,
        file=file,
        name=name,
        description=description
    )

    # Step 3: Upload to Databricks if enabled
    if settings.MCP_ENABLED:
        logger.info("MCP enabled, uploading dataset to Databricks")

        try:
            mcp = get_mcp_client()

            # Read the parquet file we just created
            parquet_path = Path(dataset.storage_uri)
            with open(parquet_path, 'rb') as f:
                parquet_bytes = f.read()

            # Upload to Databricks
            result = await mcp.upload_dataset_file(
                tenant_id=str(tenant_id),
                dataset_name=name.lower().replace(" ", "_"),
                file_content=parquet_bytes,
                file_format="parquet"
            )

            # Step 4: Store Databricks metadata
            dataset.metadata_ = {
                "databricks_enabled": True,
                "databricks_table": result.get("table_path"),
                "databricks_catalog": result.get("catalog_name"),
                "databricks_schema": result.get("schema_name"),
                "databricks_table_name": result.get("table_name"),
                "sync_timestamp": result.get("timestamp")
            }
            db.commit()
            db.refresh(dataset)

            logger.info(f"Dataset uploaded to Databricks: {result.get('table_path')}")

        except MCPClientError as e:
            logger.error(f"Databricks upload failed: {e}, continuing with local storage only")
            dataset.metadata_ = {
                "databricks_enabled": False,
                "databricks_error": str(e),
                "fallback_mode": "local_only"
            }
            db.commit()

        except Exception as e:
            logger.error(f"Unexpected error during Databricks upload: {e}")
            dataset.metadata_ = {
                "databricks_enabled": False,
                "databricks_error": f"Unexpected error: {str(e)}",
                "fallback_mode": "local_only"
            }
            db.commit()

    else:
        logger.info("MCP disabled, using local storage only")
        dataset.metadata_ = {
            "databricks_enabled": False,
            "reason": "MCP_ENABLED=False"
        }
        db.commit()

    return dataset


async def query_dataset_databricks(
    db: Session,
    *,
    dataset_id: uuid.UUID,
    tenant_id: uuid.UUID,
    sql: Optional[str] = None,
    limit: int = 100
) -> dict:
    """
    Query dataset using Databricks SQL warehouse

    Args:
        db: Database session
        dataset_id: Dataset UUID
        tenant_id: Tenant UUID
        sql: Optional SQL query (defaults to SELECT *)
        limit: Row limit

    Returns:
        Query results with rows and metadata
    """
    # Get dataset
    dataset = base_datasets.get_dataset(db, dataset_id=dataset_id, tenant_id=tenant_id)
    if not dataset:
        raise ValueError("Dataset not found")

    # Check if Databricks is available
    has_databricks = dataset.metadata_ and dataset.metadata_.get("databricks_enabled")

    if has_databricks and settings.MCP_ENABLED:
        logger.info("Querying dataset via Databricks")

        try:
            mcp = get_mcp_client()

            table_name = dataset.metadata_.get("databricks_table_name")
            result = await mcp.query_dataset(
                tenant_id=str(tenant_id),
                dataset_name=table_name,
                sql=sql,
                limit=limit
            )

            return {
                "source": "databricks",
                "rows": result.get("rows", []),
                "row_count": result.get("row_count", 0),
                "execution_time_ms": result.get("execution_time_ms"),
                "table_path": dataset.metadata_.get("databricks_table")
            }

        except MCPClientError as e:
            logger.warning(f"Databricks query failed: {e}, falling back to local")
            # Fall through to local query

    # Fallback: Use local parquet file
    logger.info("Querying dataset from local storage")
    summary = base_datasets.run_summary_query(dataset)

    return {
        "source": "local",
        "rows": dataset.sample_rows[:limit] if dataset.sample_rows else [],
        "row_count": dataset.row_count,
        "summary": summary,
        "note": "Queried from local Parquet file"
    }


async def get_dataset_metadata_databricks(
    db: Session,
    *,
    dataset_id: uuid.UUID,
    tenant_id: uuid.UUID
) -> dict:
    """
    Get dataset metadata including Databricks information

    Returns:
        Combined metadata from PostgreSQL and Databricks
    """
    dataset = base_datasets.get_dataset(db, dataset_id=dataset_id, tenant_id=tenant_id)
    if not dataset:
        raise ValueError("Dataset not found")

    metadata = {
        "id": str(dataset.id),
        "name": dataset.name,
        "description": dataset.description,
        "source_type": dataset.source_type,
        "row_count": dataset.row_count,
        "schema": dataset.schema,
        "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
        "local_storage": {
            "uri": dataset.storage_uri,
            "file_name": dataset.file_name
        }
    }

    # Add Databricks info if available
    if dataset.metadata_ and dataset.metadata_.get("databricks_enabled"):
        mcp = get_mcp_client()

        try:
            table_name = dataset.metadata_.get("databricks_table_name")
            db_metadata = await mcp.get_dataset_metadata(
                tenant_id=str(tenant_id),
                dataset_name=table_name
            )

            metadata["databricks"] = {
                "enabled": True,
                "table_path": dataset.metadata_.get("databricks_table"),
                "catalog": dataset.metadata_.get("databricks_catalog"),
                "schema": dataset.metadata_.get("databricks_schema"),
                "table_name": table_name,
                "size_bytes": db_metadata.get("size_bytes"),
                "last_modified": db_metadata.get("last_modified"),
                "version": db_metadata.get("version")
            }

        except MCPClientError as e:
            logger.error(f"Failed to fetch Databricks metadata: {e}")
            metadata["databricks"] = {
                "enabled": False,
                "error": str(e)
            }

    else:
        metadata["databricks"] = {
            "enabled": False,
            "reason": dataset.metadata_.get("reason", "Not synced") if dataset.metadata_ else "No metadata"
        }

    return metadata


async def delete_dataset_databricks(
    db: Session,
    *,
    dataset_id: uuid.UUID,
    tenant_id: uuid.UUID
) -> None:
    """
    Delete dataset from both local storage and Databricks

    Args:
        db: Database session
        dataset_id: Dataset UUID
        tenant_id: Tenant UUID
    """
    dataset = base_datasets.get_dataset(db, dataset_id=dataset_id, tenant_id=tenant_id)
    if not dataset:
        raise ValueError("Dataset not found")

    # Delete from Databricks if it exists there
    if dataset.metadata_ and dataset.metadata_.get("databricks_enabled") and settings.MCP_ENABLED:
        logger.info("Deleting dataset from Databricks")

        try:
            mcp = get_mcp_client()
            table_name = dataset.metadata_.get("databricks_table_name")

            await mcp.delete_dataset(
                tenant_id=str(tenant_id),
                dataset_name=table_name
            )

            logger.info(f"Dataset deleted from Databricks: {table_name}")

        except MCPClientError as e:
            logger.error(f"Failed to delete from Databricks: {e}")
            # Continue with local deletion anyway

    # Delete local file if it exists
    if dataset.storage_uri:
        storage_path = Path(dataset.storage_uri)
        if storage_path.exists():
            storage_path.unlink()
            logger.info(f"Deleted local file: {dataset.storage_uri}")

    # Delete from database
    db.delete(dataset)
    db.commit()

    logger.info(f"Dataset {dataset_id} deleted successfully")
