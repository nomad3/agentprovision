from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate, NotebookBase

def get_notebook(db: Session, notebook_id: uuid.UUID) -> Notebook | None:
    return db.query(Notebook).filter(Notebook.id == notebook_id).first()

def get_notebooks_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Notebook]:
    return db.query(Notebook).filter(Notebook.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_notebook(db: Session, *, item_in: NotebookCreate, tenant_id: uuid.UUID) -> Notebook:
    db_item = Notebook(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_notebook(db: Session, *, db_obj: Notebook, obj_in: NotebookBase) -> Notebook:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_notebook(db: Session, *, notebook_id: uuid.UUID) -> Notebook | None:
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if notebook:
        db.delete(notebook)
        db.commit()
    return notebook