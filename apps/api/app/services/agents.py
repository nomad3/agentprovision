from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate


async def list_agents(session: AsyncSession, tenant_id: UUID) -> Sequence[Agent]:
    result = await session.execute(
        select(Agent).where(Agent.tenant_id == tenant_id).order_by(Agent.created_at.desc())
    )
    return result.scalars().all()


async def create_agent(session: AsyncSession, tenant_id: UUID, payload: AgentCreate) -> Agent:
    agent = Agent(
        tenant_id=tenant_id,
        name=payload.name,
        owner=payload.owner,
        environment=payload.environment,
        description=payload.description,
        status=payload.status,
        config=payload.config,
        cost_per_hour=payload.cost_per_hour,
    )
    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


async def update_agent(session: AsyncSession, tenant_id: UUID, agent_id: UUID, payload: AgentUpdate) -> Agent:
    agent = await session.get(Agent, agent_id)
    if not agent or agent.tenant_id != tenant_id:
        raise ValueError("Agent not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)

    await session.commit()
    await session.refresh(agent)
    return agent
