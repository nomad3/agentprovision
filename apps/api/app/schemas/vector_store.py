from pydantic import BaseModel
import uuid

class VectorStoreBase(BaseModel):
    name: str
    description: str | None = None
    config: dict

class VectorStoreCreate(VectorStoreBase):
    pass

class VectorStoreUpdate(VectorStoreBase):
    pass

class VectorStore(VectorStoreBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
