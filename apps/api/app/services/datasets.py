from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import List

import pandas as pd
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetPreview

STORAGE_ROOT = Path(settings.DATA_STORAGE_PATH)


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
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Failed to parse uploaded file. Ensure it is a valid Excel or CSV document.") from exc
    finally:
        file.file.seek(0)

    if df.empty:
        raise ValueError("Uploaded file contains no rows.")

    return df


def ingest_tabular(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    file: UploadFile,
    name: str,
    description: str | None = None,
) -> Dataset:
    df = _load_dataframe(file)

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
        source_type="excel_upload",
        file_name=file.filename,
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
