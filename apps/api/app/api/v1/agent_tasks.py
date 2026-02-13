from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.agent_task import AgentTask, AgentTaskCreate, AgentTaskUpdate
from app.schemas.execution_trace import ExecutionTrace as ExecutionTraceSchema
from app.services import agent_tasks as service
from app.services import execution_traces as trace_service

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


@router.get("/{task_id}/trace", response_model=List[ExecutionTraceSchema])
def get_task_trace(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get execution trace for a task."""
    task = service.get_task(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return trace_service.get_traces_by_task(db, task_id, current_user.tenant_id)


@router.post("/{task_id}/approve", response_model=AgentTask)
def approve_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a task waiting for approval, setting status to executing."""
    task = service.get_task(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "waiting_for_approval":
        raise HTTPException(status_code=400, detail="Task is not waiting for approval")
    task.status = "executing"
    task.started_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/reject", response_model=AgentTask)
def reject_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a task waiting for approval, setting status to failed."""
    task = service.get_task(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "waiting_for_approval":
        raise HTTPException(status_code=400, detail="Task is not waiting for approval")
    task.status = "failed"
    task.error = "Rejected by user"
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task
