from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class AgentTaskBase(BaseModel):
    objective: str
    task_type: Optional[str] = None
    priority: Optional[str] = "normal"
    context: Optional[Dict[str, Any]] = None
    requires_approval: Optional[bool] = False


class AgentTaskCreate(AgentTaskBase):
    assigned_agent_id: uuid.UUID
    group_id: Optional[uuid.UUID] = None
    parent_task_id: Optional[uuid.UUID] = None


class AgentTaskUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    reasoning: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    error: Optional[str] = None


class AgentTask(AgentTaskBase):
    id: uuid.UUID
    group_id: Optional[uuid.UUID]
    assigned_agent_id: uuid.UUID
    created_by_agent_id: Optional[uuid.UUID]
    human_requested: bool
    status: str
    reasoning: Optional[Dict[str, Any]]
    output: Optional[Dict[str, Any]]
    confidence: Optional[float]
    error: Optional[str]
    parent_task_id: Optional[uuid.UUID]
    tokens_used: int
    cost: float
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class AgentTaskWithSubtasks(AgentTask):
    """Task with subtasks included."""
    subtasks: List["AgentTask"] = []
