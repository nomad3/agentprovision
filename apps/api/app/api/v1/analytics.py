from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.schemas.analytics import AnalyticsSummary
from app.services import analytics as analytics_service
from app.models.user import User

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummary)
def get_summary(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve analytics summary for the current tenant.
    """
    return analytics_service.get_analytics_summary(db, tenant_id=current_user.tenant_id)


@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """
    Retrieve comprehensive dashboard statistics for the current tenant.

    Returns:
    - Platform overview metrics (agents, deployments, datasets, etc.)
    - Activity metrics (messages, sessions, data volume)
    - Agent deployment details
    - Recent datasets
    - Recent chat sessions
    """
    return analytics_service.get_dashboard_stats(db, tenant_id=current_user.tenant_id)
