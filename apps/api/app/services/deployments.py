from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deployment import Deployment
from app.schemas.deployment import DeploymentCreate


async def list_deployments(session: AsyncSession, tenant_id: UUID) -> Sequence[Deployment]:
    result = await session.execute(select(Deployment).where(Deployment.tenant_id == tenant_id))
    return result.scalars().all()


async def create_deployment(session: AsyncSession, tenant_id: UUID, payload: DeploymentCreate) -> Deployment:
    deployment = Deployment(
        tenant_id=tenant_id,
        name=payload.name,
        environment=payload.environment,
        provider=payload.provider,
        status=payload.status,
    )
    session.add(deployment)
    await session.commit()
    await session.refresh(deployment)
    return deployment
