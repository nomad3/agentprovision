from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.deployment import Deployment
from app.schemas.deployment import DeploymentCreate, DeploymentBase

def get_deployment(db: Session, deployment_id: uuid.UUID) -> Deployment | None:
    return db.query(Deployment).filter(Deployment.id == deployment_id).first()

def get_deployments_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Deployment]:
    return db.query(Deployment).filter(Deployment.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_deployment(db: Session, *, item_in: DeploymentCreate, tenant_id: uuid.UUID) -> Deployment:
    db_item = Deployment(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_deployment(db: Session, *, db_obj: Deployment, obj_in: DeploymentBase) -> Deployment:
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

def delete_deployment(db: Session, *, deployment_id: uuid.UUID) -> Deployment | None:
    deployment = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if deployment:
        db.delete(deployment)
        db.commit()
    return deployment
