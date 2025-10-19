from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.data_pipeline import DataPipeline
from app.schemas.data_pipeline import DataPipelineCreate, DataPipelineBase

def get_data_pipeline(db: Session, data_pipeline_id: uuid.UUID) -> DataPipeline | None:
    return db.query(DataPipeline).filter(DataPipeline.id == data_pipeline_id).first()

def get_data_pipelines_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[DataPipeline]:
    return db.query(DataPipeline).filter(DataPipeline.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_data_pipeline(db: Session, *, item_in: DataPipelineCreate, tenant_id: uuid.UUID) -> DataPipeline:
    db_item = DataPipeline(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_data_pipeline(db: Session, *, db_obj: DataPipeline, obj_in: DataPipelineBase) -> DataPipeline:
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

def delete_data_pipeline(db: Session, *, data_pipeline_id: uuid.UUID) -> DataPipeline | None:
    data_pipeline = db.query(DataPipeline).filter(DataPipeline.id == data_pipeline_id).first()
    if data_pipeline:
        db.delete(data_pipeline)
        db.commit()
    return data_pipeline