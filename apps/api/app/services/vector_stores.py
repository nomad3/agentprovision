from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.vector_store import VectorStore
from app.schemas.vector_store import VectorStoreCreate, VectorStoreBase

def get_vector_store(db: Session, vector_store_id: uuid.UUID) -> VectorStore | None:
    return db.query(VectorStore).filter(VectorStore.id == vector_store_id).first()

def get_vector_stores_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[VectorStore]:
    return db.query(VectorStore).filter(VectorStore.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_vector_store(db: Session, *, item_in: VectorStoreCreate, tenant_id: uuid.UUID) -> VectorStore:
    db_item = VectorStore(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_vector_store(db: Session, *, db_obj: VectorStore, obj_in: VectorStoreBase) -> VectorStore:
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

def delete_vector_store(db: Session, *, vector_store_id: uuid.UUID) -> VectorStore | None:
    vector_store = db.query(VectorStore).filter(VectorStore.id == vector_store_id).first()
    if vector_store:
        db.delete(vector_store)
        db.commit()
    return vector_store
