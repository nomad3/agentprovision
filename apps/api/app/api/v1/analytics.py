from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.services.analytics import build_summary
from app.services.agents import list_agents
from app.services.deployments import list_deployments

router = APIRouter()


@router.get("/summary")
async def get_summary(
    *,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    agents = await list_agents(session, current_user.tenant_id)
    deployments = await list_deployments(session, current_user.tenant_id)
    return build_summary(agents, deployments)
