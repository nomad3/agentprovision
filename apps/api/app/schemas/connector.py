from pydantic import BaseModel
import uuid

class ConnectorBase(BaseModel):
    name: str
    description: str | None = None
    config: dict
    type: str
    n8n_workflow_id: str | None = None
    schema: dict | None = None # Add schema field

class ConnectorCreate(ConnectorBase):
    pass

class ConnectorUpdate(ConnectorBase):
    pass

class Connector(ConnectorBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
