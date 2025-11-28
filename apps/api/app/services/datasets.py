from __future__ import annotations

import os
import uuid
import asyncio
from pathlib import Path
from typing import List, Sequence, Dict, Any

import pandas as pd
import duckdb
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetPreview
from app.utils.logger import get_logger

logger = get_logger(__name__)

STORAGE_ROOT = Path(settings.DATA_STORAGE_PATH)


def _trigger_databricks_sync(db: Session, dataset: Dataset, tenant_id: uuid.UUID) -> None:
    """
    Trigger Databricks sync workflow for a dataset.

    This is a non-blocking operation that starts an async workflow.
    If workflow start fails, the dataset upload still succeeds but the error is logged.

    Args:
        db: Database session
        dataset: Dataset to sync
        tenant_id: Tenant UUID for isolation
    """
    if not settings.DATABRICKS_AUTO_SYNC or not settings.MCP_ENABLED:
        return

    logger.info(f"Triggering Databricks sync for dataset {dataset.id}")

    # Initialize metadata
    if not dataset.metadata_:
        dataset.metadata_ = {}

    dataset.metadata_.update({
        "databricks_enabled": True,
        "sync_status": "pending",
        "last_sync_attempt": None
    })
    db.commit()

    # Start Temporal workflow (async, non-blocking)
    try:
        from app.services import workflows
        from app.workflows.dataset_sync import DatasetSyncWorkflow

        # Start workflow asynchronously
        asyncio.create_task(
            workflows.start_workflow(
                workflow_type='DatasetSyncWorkflow',
                workflow_id=f"dataset-sync-{dataset.id}",
                task_queue="agentprovision-databricks",
                tenant_id=tenant_id,
                arguments=[str(dataset.id), str(tenant_id)]
            )
        )

        logger.info(f"Databricks sync workflow started for dataset {dataset.id}")

    except Exception as e:
        # Don't fail dataset upload if workflow start fails
        logger.error(f"Failed to start Databricks sync workflow: {e}")
        dataset.metadata_["sync_status"] = "failed"
        dataset.metadata_["last_sync_error"] = str(e)
        db.commit()


def _ensure_storage_root() -> Path:
    STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
    return STORAGE_ROOT


def _tenant_storage_path(tenant_id: uuid.UUID) -> Path:
    root = _ensure_storage_root()
    tenant_path = root / str(tenant_id)
    tenant_path.mkdir(parents=True, exist_ok=True)
    return tenant_path


def _load_dataframe(file: UploadFile) -> pd.DataFrame:
    suffix = (Path(file.filename).suffix or "").lower() if file.filename else ""
    content_type = (file.content_type or "").lower()

    try:
        if (
            suffix in {".csv"}
            or content_type in {"text/csv", "application/csv", "text/plain"}
        ):
            # Try reading normally first
            try:
                df = pd.read_csv(file.file)
                # Check if it looks like a NetSuite export (few columns, metadata in first rows)
                if len(df.columns) < 2 and len(df) > 0:
                    raise ValueError("Potential metadata header detected")
            except Exception:
                # Reset and try to find the header
                file.file.seek(0)
                # Read first 20 lines to find the header
                content = file.file.read(4096).decode('utf-8', errors='ignore')
                file.file.seek(0)

                lines = content.split('\n')
                skip_rows = 0
                max_cols = 0

                # Simple heuristic: find the row with the most commas
                for i, line in enumerate(lines[:20]):
                    cols = line.count(',')
                    if cols > max_cols:
                        max_cols = cols
                        skip_rows = i

                if max_cols > 1:
                    df = pd.read_csv(file.file, skiprows=skip_rows)
                else:
                    # Fallback to default
                    file.file.seek(0)
                    df = pd.read_csv(file.file, on_bad_lines='skip')

        else:
            df = pd.read_excel(file.file)
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Failed to parse uploaded file. Ensure it is a valid Excel or CSV document.") from exc
    finally:
        file.file.seek(0)

    if df.empty:
        raise ValueError("Uploaded file contains no rows.")

    return df


def _persist_dataframe(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    df: pd.DataFrame,
    name: str,
    description: str | None,
    source_type: str,
    file_name: str | None = None,
) -> Dataset:
    dataset_id = uuid.uuid4()
    tenant_path = _tenant_storage_path(tenant_id)
    parquet_path = tenant_path / f"{dataset_id}.parquet"

    df.to_parquet(parquet_path, index=False)

    schema = [
        {"name": column, "dtype": str(dtype)}
        for column, dtype in df.dtypes.items()
    ]

    sample_rows = df.head(10).to_dict(orient="records")

    dataset = Dataset(
        id=dataset_id,
        name=name,
        description=description,
        source_type=source_type,
        file_name=file_name,
        storage_uri=str(parquet_path),
        schema=schema,
        row_count=len(df.index),
        sample_rows=sample_rows,
        tenant_id=tenant_id,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


def ingest_tabular(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    file: UploadFile,
    name: str,
    description: str | None = None,
) -> Dataset:
    df = _load_dataframe(file)
    dataset = _persist_dataframe(
        db,
        tenant_id=tenant_id,
        df=df,
        name=name,
        description=description,
        source_type="excel_upload",
        file_name=file.filename,
    )

    # Trigger Databricks sync workflow if enabled
    _trigger_databricks_sync(db, dataset, tenant_id)

    return dataset


def ingest_records(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    records: Sequence[dict],
    name: str,
    description: str | None = None,
    source_type: str = "data_agent",
) -> Dataset:
    if not records:
        raise ValueError("No records provided for ingestion.")

    df = pd.DataFrame(records)
    if df.empty:
        raise ValueError("Generated ingestion dataframe is empty.")

    dataset = _persist_dataframe(
        db,
        tenant_id=tenant_id,
        df=df,
        name=name,
        description=description,
        source_type=source_type,
        file_name=None,
    )

    # Trigger Databricks sync workflow if enabled
    _trigger_databricks_sync(db, dataset, tenant_id)

    return dataset


def list_datasets(db: Session, *, tenant_id: uuid.UUID) -> List[Dataset]:
    return db.query(Dataset).filter(Dataset.tenant_id == tenant_id).order_by(Dataset.created_at.desc()).all()


def get_dataset(db: Session, *, dataset_id: uuid.UUID, tenant_id: uuid.UUID) -> Dataset | None:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if dataset and str(dataset.tenant_id) == str(tenant_id):
        return dataset
    return None


def dataset_preview(dataset: Dataset) -> DatasetPreview:
    sample_rows = dataset.sample_rows or []
    return DatasetPreview(
        id=dataset.id,
        name=dataset.name,
        row_count=dataset.row_count,
        sample_rows=sample_rows,
    )


def run_summary_query(dataset: Dataset) -> dict:
    if dataset.storage_uri and os.path.exists(dataset.storage_uri):
        df = pd.read_parquet(dataset.storage_uri)
    elif dataset.sample_rows:
        df = pd.DataFrame(dataset.sample_rows)
    else:
        raise FileNotFoundError("Dataset storage not found")

    numeric_df = df.select_dtypes(include=["number"])
    summary = numeric_df.describe().transpose() if not numeric_df.empty else pd.DataFrame()

    numeric_columns = []
    for column, stats in summary.iterrows():
        numeric_columns.append(
            {
                "column": column,
                "avg": stats.get("mean"),
                "min": stats.get("min"),
                "max": stats.get("max"),
            }
        )

    return {"numeric_columns": numeric_columns}


def execute_query(dataset: Dataset, sql: str, limit: int = 100) -> Dict[str, Any]:
    """
    Execute a SQL query on a dataset using DuckDB.

    Args:
        dataset: The dataset to query
        sql: SQL query string (table name should be 'dataset')
        limit: Maximum number of rows to return (default: 100, max: 1000)

    Returns:
        Dictionary containing:
        - columns: List of column names
        - rows: List of row dictionaries
        - row_count: Number of rows returned
        - query: The executed query

    Raises:
        FileNotFoundError: If dataset storage not found
        ValueError: If query is invalid or unsafe
    """
    if not dataset.storage_uri or not os.path.exists(dataset.storage_uri):
        raise FileNotFoundError("Dataset storage not found")

    # Validate and sanitize limit
    limit = min(max(1, limit), 1000)

    # Basic SQL injection prevention
    sql_lower = sql.lower().strip()

    # Block dangerous keywords
    dangerous_keywords = [
        'drop', 'delete', 'insert', 'update', 'alter',
        'create', 'truncate', 'grant', 'revoke'
    ]

    for keyword in dangerous_keywords:
        if keyword in sql_lower:
            raise ValueError(f"Query contains forbidden keyword: {keyword}")

    try:
        # Create DuckDB connection
        conn = duckdb.connect(':memory:')

        # Register the parquet file as a table named 'dataset'
        conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_parquet('{dataset.storage_uri}')")

        # Add LIMIT clause if not present
        if 'limit' not in sql_lower:
            sql = f"{sql.rstrip(';')} LIMIT {limit}"

        # Execute the query
        result = conn.execute(sql).fetchdf()

        # Convert to dictionary format
        columns = result.columns.tolist()
        rows = result.to_dict(orient='records')

        conn.close()

        return {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "query": sql,
        }

    except Exception as exc:
        raise ValueError(f"Query execution failed: {str(exc)}") from exc


def get_schema_info(dataset: Dataset) -> Dict[str, Any]:
    """
    Get detailed schema information about a dataset.

    Returns:
        Dictionary with schema details including column names, types, and sample values
    """
    if not dataset.storage_uri or not os.path.exists(dataset.storage_uri):
        raise FileNotFoundError("Dataset storage not found")

    try:
        conn = duckdb.connect(':memory:')
        conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_parquet('{dataset.storage_uri}')")

        # Get column names and types
        schema_result = conn.execute("DESCRIBE dataset").fetchdf()

        # Get sample distinct values for each column (useful for understanding data)
        sample_values = {}
        for col in schema_result['column_name']:
            try:
                values = conn.execute(
                    f"SELECT DISTINCT {col} FROM dataset LIMIT 5"
                ).fetchdf()[col].tolist()
                sample_values[col] = values
            except:
                sample_values[col] = []

        conn.close()

        return {
            "columns": schema_result.to_dict(orient='records'),
            "sample_values": sample_values,
            "row_count": dataset.row_count,
        }

    except Exception as exc:
        raise ValueError(f"Failed to get schema info: {str(exc)}") from exc
