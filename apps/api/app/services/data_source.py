from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.data_source import DataSource
from app.schemas.data_source import DataSourceCreate, DataSourceBase

def get_data_source(db: Session, data_source_id: uuid.UUID) -> DataSource | None:
    return db.query(DataSource).filter(DataSource.id == data_source_id).first()

def get_data_sources_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[DataSource]:
    return db.query(DataSource).filter(DataSource.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_data_source(db: Session, *, item_in: DataSourceCreate, tenant_id: uuid.UUID) -> DataSource:
    db_item = DataSource(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_data_source(db: Session, *, db_obj: DataSource, obj_in: DataSourceBase) -> DataSource:
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

def delete_data_source(db: Session, *, data_source_id: uuid.UUID) -> DataSource | None:
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if data_source:
        db.delete(data_source)
        db.commit()
    return data_source