from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.integration import Integration
from app.schemas.integration import IntegrationCreate, IntegrationBase

def get_integration(db: Session, integration_id: uuid.UUID) -> Integration | None:
    return db.query(Integration).filter(Integration.id == integration_id).first()

def get_integrations_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Integration]:
    return db.query(Integration).filter(Integration.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_integration(db: Session, *, item_in: IntegrationCreate, tenant_id: uuid.UUID) -> Integration:
    db_item = Integration(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_integration(db: Session, *, db_obj: Integration, obj_in: IntegrationBase) -> Integration:
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

def delete_integration(db: Session, *, integration_id: uuid.UUID) -> Integration | None:
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if integration:
        db.delete(integration)
        db.commit()
    return integration
