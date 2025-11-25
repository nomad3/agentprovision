"""API routes for tenant analytics."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.tenant_analytics import TenantAnalytics, TenantAnalyticsSummary
from app.services import tenant_analytics as service

router = APIRouter()


@router.get("/summary", response_model=TenantAnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get analytics summary for dashboard."""
    return service.get_analytics_summary(db, current_user.tenant_id)


@router.get("/history", response_model=List[TenantAnalytics])
def get_analytics_history(
    period: str = "daily",
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get analytics history."""
    return service.get_analytics_history(
        db, current_user.tenant_id, period, limit
    )


@router.post("/calculate", response_model=TenantAnalytics)
def calculate_analytics(
    period: str = "daily",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate and store analytics for current period."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return service.calculate_period_analytics(
        db, current_user.tenant_id, period, today
    )
