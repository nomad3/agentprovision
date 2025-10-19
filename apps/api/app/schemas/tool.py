from pydantic import BaseModel
import uuid

class ToolBase(BaseModel):
    name: str
    description: str | None = None
    config: dict

class ToolCreate(ToolBase):
    pass

class ToolUpdate(ToolBase):
    pass

class Tool(ToolBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
