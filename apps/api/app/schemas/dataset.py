from typing import List, Dict, Any
from datetime import datetime
import uuid

from pydantic import BaseModel


class DatasetBase(BaseModel):
    name: str
    description: str | None = None


class Dataset(DatasetBase):
    id: uuid.UUID
    source_type: str
    file_name: str | None = None
    row_count: int
    schema: List[Dict[str, Any]] | None = None
    sample_rows: List[Dict[str, Any]] | None = None
    connector_id: uuid.UUID | None = None
    created_at: datetime | None = None

    class Config:
        orm_mode = True


class DatasetPreview(BaseModel):
    id: uuid.UUID
    name: str
    row_count: int
    sample_rows: List[Dict[str, Any]]

    class Config:
        orm_mode = True
