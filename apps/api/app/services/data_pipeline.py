from sqlalchemy.orm import Session
import uuid

from app.models.data_pipeline import DataPipeline
from app.schemas.data_pipeline import DataPipelineCreate

def get_data_pipeline(db: Session, data_pipeline_id: uuid.UUID):
    return db.query(DataPipeline).filter(DataPipeline.id == data_pipeline_id).first()

def get_data_pipelines_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(DataPipeline).filter(DataPipeline.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_data_pipeline(db: Session, item: DataPipelineCreate, tenant_id: uuid.UUID):
    db_item = DataPipeline(**item.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
