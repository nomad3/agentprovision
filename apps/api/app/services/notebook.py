from sqlalchemy.orm import Session
import uuid

from app.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate

def get_notebook(db: Session, notebook_id: uuid.UUID):
    return db.query(Notebook).filter(Notebook.id == notebook_id).first()

def get_notebooks_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(Notebook).filter(Notebook.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_notebook(db: Session, item: NotebookCreate, tenant_id: uuid.UUID):
    db_item = Notebook(**item.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
