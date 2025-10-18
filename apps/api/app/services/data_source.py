from sqlalchemy.orm import Session
import uuid

from app.models.data_source import DataSource
from app.schemas.data_source import DataSourceCreate

def get_data_source(db: Session, data_source_id: uuid.UUID):
    return db.query(DataSource).filter(DataSource.id == data_source_id).first()

def get_data_sources_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(DataSource).filter(DataSource.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_data_source(db: Session, item: DataSourceCreate, tenant_id: uuid.UUID):
    db_item = DataSource(**item.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
