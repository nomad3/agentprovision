from typing import List, Optional
import uuid
from pydantic import BaseModel
from datetime import datetime
from .dataset import Dataset

class DatasetGroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetGroupCreate(DatasetGroupBase):
    dataset_ids: List[uuid.UUID]

class DatasetGroupUpdate(DatasetGroupBase):
    dataset_ids: Optional[List[uuid.UUID]] = None

class DatasetGroup(DatasetGroupBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    datasets: List[Dataset]

    class Config:
        from_attributes = True
