from pydantic import BaseModel
import uuid

class DeploymentBase(BaseModel):
    name: str
    description: str | None = None
    config: dict
    agent_id: uuid.UUID

class DeploymentCreate(DeploymentBase):
    pass

class DeploymentUpdate(DeploymentBase):
    pass

class Deployment(DeploymentBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
