from collections.abc import Sequence
from datetime import datetime
from typing import Iterable
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentStatus
from app.models.deployment import Deployment, DeploymentStatus
from app.models.tenant import Tenant
from app.schemas import AnalyticsSummary, HighlightTenant, PublicMetrics


async def build_summary(session: AsyncSession, tenant_id: UUID) -> AnalyticsSummary:
    agents_stmt = select(Agent).where(Agent.tenant_id == tenant_id)
    agents_result = await session.execute(agents_stmt)
    agents: Sequence[Agent] = agents_result.scalars().all()

    deployments_stmt = select(Deployment).where(Deployment.tenant_id == tenant_id)
    deployments_result = await session.execute(deployments_stmt)
    deployments: Sequence[Deployment] = deployments_result.scalars().all()

    spend = float(sum(agent.cost_per_hour or 0 for agent in agents))

    return AnalyticsSummary(
        active_agents=sum(1 for agent in agents if agent.status == AgentStatus.ACTIVE),
        paused_agents=sum(1 for agent in agents if agent.status == AgentStatus.PAUSED),
        error_agents=sum(1 for agent in agents if agent.status == AgentStatus.ERROR),
        monthly_spend=round(spend * 720, 2),
        deployment_health=sum(1 for deployment in deployments if deployment.status == DeploymentStatus.HEALTHY),
        total_deployments=len(deployments),
    )


async def _get_tenant_environments(session: AsyncSession, tenant_id: UUID) -> list[str]:
    env_stmt = select(func.distinct(Agent.environment)).where(Agent.tenant_id == tenant_id)
    result = await session.execute(env_stmt)
    return sorted(value for value, in result.all() if value)


async def get_public_metrics(session: AsyncSession, integration_catalog: Iterable[str]) -> PublicMetrics:
    tenant_count = await session.scalar(select(func.count(Tenant.id))) or 0
    agent_count = await session.scalar(select(func.count(Agent.id))) or 0
    deployment_count = await session.scalar(select(func.count(Deployment.id))) or 0
    active_agent_count = await session.scalar(
        select(func.count(Agent.id)).where(Agent.status == AgentStatus.ACTIVE)
    ) or 0
    environment_count = await session.scalar(select(func.count(func.distinct(Agent.environment)))) or 0

    top_tenants_stmt = (
        select(
            Tenant,
            func.count(func.distinct(Agent.id)).label("agent_count"),
            func.count(func.distinct(Deployment.id)).label("deployment_count"),
        )
        .outerjoin(Agent, Agent.tenant_id == Tenant.id)
        .outerjoin(Deployment, Deployment.tenant_id == Tenant.id)
        .group_by(Tenant.id)
        .order_by(func.count(Agent.id).desc())
        .limit(3)
    )

    top_tenants_result = await session.execute(top_tenants_stmt)
    highlight_tenants: list[HighlightTenant] = []
    for tenant, agent_count_value, deployment_count_value in top_tenants_result.all():
        environments = await _get_tenant_environments(session, tenant.id)
        highlight_tenants.append(
            HighlightTenant(
                id=tenant.id,
                name=tenant.name,
                agent_count=agent_count_value,
                deployment_count=deployment_count_value,
                environments=environments,
            )
        )

    return PublicMetrics(
        tenant_count=tenant_count,
        agent_count=agent_count,
        deployment_count=deployment_count,
        active_agent_count=active_agent_count,
        environment_count=environment_count,
        highlight_tenants=highlight_tenants,
        integration_catalog=sorted(set(integration_catalog)),
        generated_at=datetime.utcnow(),
    )
