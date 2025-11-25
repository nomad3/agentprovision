from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.agent_group import AgentGroup, AgentGroupCreate, AgentGroupUpdate
from app.services import agent_groups as service

router = APIRouter()


@router.post("", response_model=AgentGroup, status_code=201)
def create_agent_group(
    group_in: AgentGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new agent group."""
    return service.create_agent_group(db, group_in, current_user.tenant_id)


@router.get("", response_model=List[AgentGroup])
def list_agent_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all agent groups."""
    return service.get_agent_groups(db, current_user.tenant_id, skip, limit)


@router.get("/{group_id}", response_model=AgentGroup)
def get_agent_group(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get agent group by ID."""
    group = service.get_agent_group(db, group_id, current_user.tenant_id)
    if not group:
        raise HTTPException(status_code=404, detail="Agent group not found")
    return group


@router.put("/{group_id}", response_model=AgentGroup)
def update_agent_group(
    group_id: uuid.UUID,
    group_in: AgentGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an agent group."""
    group = service.update_agent_group(db, group_id, current_user.tenant_id, group_in)
    if not group:
        raise HTTPException(status_code=404, detail="Agent group not found")
    return group


@router.delete("/{group_id}", status_code=204)
def delete_agent_group(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an agent group."""
    if not service.delete_agent_group(db, group_id, current_user.tenant_id):
        raise HTTPException(status_code=404, detail="Agent group not found")
