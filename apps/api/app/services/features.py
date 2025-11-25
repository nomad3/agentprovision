"""Feature flags service for tenant feature management."""
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.models.tenant_features import TenantFeatures
from app.schemas.tenant_features import TenantFeaturesCreate, TenantFeaturesUpdate


def get_features(db: Session, tenant_id: uuid.UUID) -> Optional[TenantFeatures]:
    """Get tenant features by tenant_id."""
    return db.query(TenantFeatures).filter(
        TenantFeatures.tenant_id == tenant_id
    ).first()


def create_features(
    db: Session,
    tenant_id: uuid.UUID,
    features_in: TenantFeaturesCreate
) -> TenantFeatures:
    """Create tenant features."""
    features = TenantFeatures(
        tenant_id=tenant_id,
        **features_in.model_dump(exclude_unset=True)
    )
    db.add(features)
    db.commit()
    db.refresh(features)
    return features


def update_features(
    db: Session,
    tenant_id: uuid.UUID,
    features_in: TenantFeaturesUpdate
) -> Optional[TenantFeatures]:
    """Update tenant features."""
    features = get_features(db, tenant_id)
    if not features:
        return None

    update_data = features_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(features, field, value)

    db.add(features)
    db.commit()
    db.refresh(features)
    return features


def get_or_create_features(
    db: Session,
    tenant_id: uuid.UUID
) -> TenantFeatures:
    """Get existing features or create with defaults."""
    features = get_features(db, tenant_id)
    if not features:
        features = create_features(db, tenant_id, TenantFeaturesCreate())
    return features


def is_feature_enabled(
    db: Session,
    tenant_id: uuid.UUID,
    feature_name: str
) -> bool:
    """Check if a specific feature is enabled for tenant."""
    features = get_or_create_features(db, tenant_id)
    return getattr(features, feature_name, False)


def check_limit(
    db: Session,
    tenant_id: uuid.UUID,
    limit_name: str,
    current_usage: int
) -> bool:
    """Check if current usage is within limits."""
    features = get_or_create_features(db, tenant_id)
    limit_value = getattr(features, limit_name, None)
    if limit_value is None:
        return True
    return current_usage < limit_value
