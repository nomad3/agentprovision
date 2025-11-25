"""Branding service for tenant whitelabel management."""
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.models.tenant_branding import TenantBranding
from app.schemas.tenant_branding import TenantBrandingCreate, TenantBrandingUpdate


def get_branding(db: Session, tenant_id: uuid.UUID) -> Optional[TenantBranding]:
    """Get tenant branding by tenant_id."""
    return db.query(TenantBranding).filter(
        TenantBranding.tenant_id == tenant_id
    ).first()


def create_branding(
    db: Session,
    tenant_id: uuid.UUID,
    branding_in: TenantBrandingCreate
) -> TenantBranding:
    """Create tenant branding."""
    branding = TenantBranding(
        tenant_id=tenant_id,
        **branding_in.model_dump(exclude_unset=True)
    )
    db.add(branding)
    db.commit()
    db.refresh(branding)
    return branding


def update_branding(
    db: Session,
    tenant_id: uuid.UUID,
    branding_in: TenantBrandingUpdate
) -> Optional[TenantBranding]:
    """Update tenant branding."""
    branding = get_branding(db, tenant_id)
    if not branding:
        return None

    update_data = branding_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(branding, field, value)

    db.add(branding)
    db.commit()
    db.refresh(branding)
    return branding


def get_or_create_branding(
    db: Session,
    tenant_id: uuid.UUID
) -> TenantBranding:
    """Get existing branding or create with defaults."""
    branding = get_branding(db, tenant_id)
    if not branding:
        branding = create_branding(db, tenant_id, TenantBrandingCreate())
    return branding


def verify_custom_domain(
    db: Session,
    tenant_id: uuid.UUID,
    domain: str
) -> bool:
    """Verify custom domain ownership (placeholder for DNS verification)."""
    branding = get_branding(db, tenant_id)
    if branding and branding.custom_domain == domain:
        branding.domain_verified = True
        db.commit()
        return True
    return False
