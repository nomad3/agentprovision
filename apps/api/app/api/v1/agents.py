from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.schemas import AgentCreate, AgentRead, AgentUpdate
from app.services.agents import create_agent, list_agents, update_agent

router = APIRouter()


@router.get("", response_model=list[AgentRead])
async def get_agents(
    *,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AgentRead]:
    agents = await list_agents(session, current_user.tenant_id)
    return [AgentRead.model_validate(agent) for agent in agents]


@router.post("", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
async def post_agent(
    payload: AgentCreate,
    *,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AgentRead:
    agent = await create_agent(session, current_user.tenant_id, payload)
    return AgentRead.model_validate(agent)


@router.put("/{agent_id}", response_model=AgentRead)
async def put_agent(
    agent_id: UUID,
    payload: AgentUpdate,
    *,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AgentRead:
    try:
        agent = await update_agent(session, current_user.tenant_id, agent_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return AgentRead.model_validate(agent)
