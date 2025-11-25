from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.models.agent_task import AgentTask
from app.models.agent import Agent
from app.schemas.agent_task import AgentTaskCreate, AgentTaskUpdate


def create_task(db: Session, task_in: AgentTaskCreate, tenant_id: uuid.UUID) -> AgentTask:
    """Create a new task."""
    # Verify agent belongs to tenant
    agent = db.query(Agent).filter(
        Agent.id == task_in.assigned_agent_id,
        Agent.tenant_id == tenant_id
    ).first()
    if not agent:
        raise ValueError("Agent not found or doesn't belong to tenant")

    task = AgentTask(
        group_id=task_in.group_id,
        assigned_agent_id=task_in.assigned_agent_id,
        parent_task_id=task_in.parent_task_id,
        human_requested=True,
        status="queued",
        priority=task_in.priority or "normal",
        task_type=task_in.task_type,
        objective=task_in.objective,
        context=task_in.context,
        requires_approval=task_in.requires_approval or False
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, task_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[AgentTask]:
    """Get task by ID."""
    return db.query(AgentTask).join(Agent).filter(
        AgentTask.id == task_id,
        Agent.tenant_id == tenant_id
    ).first()


def get_tasks(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100, status: str = None) -> List[AgentTask]:
    """List tasks for tenant."""
    query = db.query(AgentTask).join(Agent).filter(Agent.tenant_id == tenant_id)
    if status:
        query = query.filter(AgentTask.status == status)
    return query.order_by(AgentTask.created_at.desc()).offset(skip).limit(limit).all()


def update_task(db: Session, task_id: uuid.UUID, tenant_id: uuid.UUID, task_in: AgentTaskUpdate) -> Optional[AgentTask]:
    """Update a task."""
    task = get_task(db, task_id, tenant_id)
    if not task:
        return None

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    # Auto-set timestamps
    if task_in.status == "executing" and not task.started_at:
        task.started_at = datetime.utcnow()
    if task_in.status in ("completed", "failed"):
        task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task
