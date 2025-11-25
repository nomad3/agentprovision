"""API routes for tenant branding."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.tenant_branding import TenantBranding, TenantBrandingUpdate
from app.services import branding as service

router = APIRouter()


@router.get("", response_model=TenantBranding)
def get_branding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current tenant's branding configuration."""
    branding = service.get_or_create_branding(db, current_user.tenant_id)
    return branding


@router.put("", response_model=TenantBranding)
def update_branding(
    branding_in: TenantBrandingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current tenant's branding configuration."""
    # Ensure branding exists
    service.get_or_create_branding(db, current_user.tenant_id)
    branding = service.update_branding(db, current_user.tenant_id, branding_in)
    return branding


@router.post("/verify-domain", response_model=dict)
def verify_domain(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify custom domain ownership."""
    branding = service.get_branding(db, current_user.tenant_id)
    if not branding or not branding.custom_domain:
        raise HTTPException(status_code=400, detail="No custom domain configured")

    # In production, this would check DNS records
    success = service.verify_custom_domain(
        db, current_user.tenant_id, branding.custom_domain
    )
    return {"verified": success, "domain": branding.custom_domain}
