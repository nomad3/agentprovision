from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.agent_task import AgentTask, AgentTaskCreate, AgentTaskUpdate
from app.services import agent_tasks as service

router = APIRouter()


@router.post("", response_model=AgentTask, status_code=201)
def create_task(
    task_in: AgentTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task for an agent."""
    try:
        return service.create_task(db, task_in, current_user.tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[AgentTask])
def list_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all tasks."""
    return service.get_tasks(db, current_user.tenant_id, skip, limit, status)


@router.get("/{task_id}", response_model=AgentTask)
def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get task by ID."""
    task = service.get_task(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=AgentTask)
def update_task(
    task_id: uuid.UUID,
    task_in: AgentTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task."""
    task = service.update_task(db, task_id, current_user.tenant_id, task_in)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
