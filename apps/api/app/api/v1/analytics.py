from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.schemas import AnalyticsSummary, PublicMetrics
from app.services.analytics import build_summary, get_public_metrics

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    *,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnalyticsSummary:
    return await build_summary(session, current_user.tenant_id)


@router.get("/public/metrics", response_model=PublicMetrics)
async def get_public_metrics_endpoint(
    session: AsyncSession = Depends(get_session),
) -> PublicMetrics:
    from app.core.config import settings  # local import to avoid circular dependency in startup

    return await get_public_metrics(session, settings.integration_catalog)
