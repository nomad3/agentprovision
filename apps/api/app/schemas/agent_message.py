from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class AgentMessageBase(BaseModel):
    message_type: str  # request, response, handoff, escalation, update, question, approval_request
    content: Dict[str, Any]
    reasoning: Optional[str] = None
    requires_response: Optional[bool] = False
    response_deadline: Optional[datetime] = None


class AgentMessageCreate(AgentMessageBase):
    from_agent_id: uuid.UUID
    to_agent_id: Optional[uuid.UUID] = None  # Null = broadcast
    group_id: Optional[uuid.UUID] = None
    task_id: Optional[uuid.UUID] = None


class AgentMessage(AgentMessageBase):
    id: uuid.UUID
    group_id: Optional[uuid.UUID]
    task_id: Optional[uuid.UUID]
    from_agent_id: uuid.UUID
    to_agent_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True
