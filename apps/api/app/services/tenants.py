from typing import List

from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantBase
import uuid

def get_tenant(db: Session, tenant_id: uuid.UUID) -> Tenant | None:
    return db.query(Tenant).filter(Tenant.id == tenant_id).first()

def get_tenant_by_name(db: Session, *, name: str) -> Tenant | None:
    return db.query(Tenant).filter(Tenant.name == name).first()

def get_tenants(db: Session, skip: int = 0, limit: int = 100) -> List[Tenant]:
    return db.query(Tenant).offset(skip).limit(limit).all()

def create_tenant(db: Session, *, tenant_in: TenantCreate) -> Tenant:
    db_tenant = Tenant(name=tenant_in.name)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_tenant(db: Session, *, db_tenant: Tenant, tenant_in: TenantBase) -> Tenant:
    if tenant_in.name is not None:
        db_tenant.name = tenant_in.name
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def delete_tenant(db: Session, *, tenant_id: uuid.UUID) -> Tenant | None:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant:
        db.delete(tenant)
        db.commit()
    return tenant