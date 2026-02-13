from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.tenant_instance import TenantInstance
from app.schemas.tenant_instance import TenantInstanceCreate, TenantInstanceUpdate


def get_instance(db: Session, instance_id: uuid.UUID) -> TenantInstance | None:
    return db.query(TenantInstance).filter(TenantInstance.id == instance_id).first()


def get_instances_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[TenantInstance]:
    return db.query(TenantInstance).filter(TenantInstance.tenant_id == tenant_id).offset(skip).limit(limit).all()


def create_tenant_instance(db: Session, *, item_in: TenantInstanceCreate, tenant_id: uuid.UUID) -> TenantInstance:
    db_item = TenantInstance(
        **item_in.dict(),
        tenant_id=tenant_id,
        status="provisioning",
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_instance(db: Session, *, db_obj: TenantInstance, obj_in: TenantInstanceUpdate) -> TenantInstance:
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


def update_instance_status(db: Session, *, db_obj: TenantInstance, status: str, error: str | None = None) -> TenantInstance:
    """Update instance status and optionally set error message."""
    db_obj.status = status
    db_obj.error = error
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_instance(db: Session, *, instance_id: uuid.UUID) -> TenantInstance | None:
    instance = db.query(TenantInstance).filter(TenantInstance.id == instance_id).first()
    if instance:
        db.delete(instance)
        db.commit()
    return instance
