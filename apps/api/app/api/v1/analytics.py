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
