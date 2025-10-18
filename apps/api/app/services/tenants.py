from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate

def create_tenant(db: Session, *, tenant_in: TenantCreate) -> Tenant:
    db_tenant = Tenant(name=tenant_in.name)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant
