from pydantic import BaseModel
import uuid

class IntegrationBase(BaseModel):
    name: str
    config: dict
    connector_id: uuid.UUID

class IntegrationCreate(IntegrationBase):
    pass

class IntegrationUpdate(IntegrationBase):
    pass

class Integration(IntegrationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
