from pydantic import BaseModel
import uuid

class AgentBase(BaseModel):
    name: str
    description: str | None = None
    config: dict

class AgentCreate(AgentBase):
    pass

class AgentUpdate(AgentBase):
    pass

class Agent(AgentBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
