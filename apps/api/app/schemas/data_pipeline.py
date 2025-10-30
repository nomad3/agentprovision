from pydantic import BaseModel
import uuid

class DataPipelineBase(BaseModel):
    name: str
    config: dict

class DataPipelineCreate(DataPipelineBase):
    pass

class DataPipeline(DataPipelineBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        from_attributes = True
