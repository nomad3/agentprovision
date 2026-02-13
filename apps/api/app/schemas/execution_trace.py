from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
import uuid

StepType = Literal[
    "dispatched", "memory_recall", "executing", "skill_call",
    "delegated", "approval_requested", "approval_granted",
    "completed", "failed"
]


class ExecutionTraceCreate(BaseModel):
    task_id: uuid.UUID
    step_type: StepType
    step_order: int
    agent_id: Optional[uuid.UUID] = None
    details: Optional[dict] = None
    duration_ms: Optional[int] = None


class ExecutionTrace(ExecutionTraceCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
