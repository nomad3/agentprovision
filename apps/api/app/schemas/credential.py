from pydantic import BaseModel
import uuid

class CredentialBase(BaseModel):
    name: str

class CredentialCreate(CredentialBase):
    credentials: dict

class CredentialUpdate(CredentialBase):
    credentials: dict | None = None

class Credential(CredentialBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
