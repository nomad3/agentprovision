from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.schemas import DeploymentCreate, DeploymentRead
from app.services.deployments import create_deployment, list_deployments

router = APIRouter()


@router.get("", response_model=list[DeploymentRead])
async def get_deployments(
    *,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[DeploymentRead]:
    deployments = await list_deployments(session, current_user.tenant_id)
    return [DeploymentRead.model_validate(deployment) for deployment in deployments]


@router.post("", response_model=DeploymentRead, status_code=status.HTTP_201_CREATED)
async def post_deployment(
    payload: DeploymentCreate,
    *,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeploymentRead:
    deployment = await create_deployment(session, current_user.tenant_id, payload)
    return DeploymentRead.model_validate(deployment)
