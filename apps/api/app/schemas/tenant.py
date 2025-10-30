from pydantic import BaseModel
import uuid

class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: uuid.UUID

    class Config:
        from_attributes = True
