from typing import List, Dict, Any
from datetime import datetime
import uuid

from pydantic import BaseModel, Field


class DatasetBase(BaseModel):
    name: str
    description: str | None = None


class Dataset(DatasetBase):
    id: uuid.UUID
    source_type: str
    file_name: str | None = None
    row_count: int
    schema_: List[Dict[str, Any]] | None = Field(None, alias="schema")  # Use alias to avoid shadowing BaseModel.schema
    sample_rows: List[Dict[str, Any]] | None = None
    connector_id: uuid.UUID | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
        populate_by_name = True  # Allow both schema_ and schema to be used


class DatasetPreview(BaseModel):
    id: uuid.UUID
    name: str
    row_count: int
    sample_rows: List[Dict[str, Any]]

    class Config:
        from_attributes = True
