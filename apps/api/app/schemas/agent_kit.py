from pydantic import BaseModel
import uuid

class AgentKitBase(BaseModel):
    name: str
    description: str | None = None
    version: str | None = None
    config: dict

class AgentKitCreate(AgentKitBase):
    pass

class AgentKitUpdate(AgentKitBase):
    pass

class AgentKit(AgentKitBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
