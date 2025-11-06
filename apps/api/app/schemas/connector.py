from pydantic import BaseModel, Field
import uuid

class ConnectorBase(BaseModel):
    name: str
    description: str | None = None
    config: dict
    type: str
    n8n_workflow_id: str | None = None
    schema_: dict | None = Field(None, alias="schema")  # Use alias to avoid shadowing BaseModel.schema

class ConnectorCreate(ConnectorBase):
    pass

class ConnectorUpdate(ConnectorBase):
    pass

class Connector(ConnectorBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        from_attributes = True
        populate_by_name = True  # Allow both schema_ and schema to be used
