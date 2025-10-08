from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models.agent import AgentStatus


class AgentBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    owner: Optional[str] = None
    environment: str = Field(..., max_length=255)
    status: AgentStatus = AgentStatus.DRAFT
    config: Dict[str, Any] = Field(default_factory=dict)
    cost_per_hour: float = 0.0


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    description: Optional[str] = None
    owner: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[AgentStatus] = None
    config: Optional[Dict[str, Any]] = None
    cost_per_hour: Optional[float] = None


class AgentRead(AgentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
