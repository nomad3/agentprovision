from pydantic import BaseModel
import uuid

class NotebookBase(BaseModel):
    name: str
    content: dict

class NotebookCreate(NotebookBase):
    pass

class Notebook(NotebookBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
