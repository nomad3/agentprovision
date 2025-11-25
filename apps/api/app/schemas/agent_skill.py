from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
import uuid


class AgentSkillBase(BaseModel):
    skill_name: str
    proficiency: Optional[float] = 0.5
    learned_from: Optional[str] = None
    examples: Optional[List[Any]] = None


class AgentSkillCreate(AgentSkillBase):
    agent_id: uuid.UUID


class AgentSkillUpdate(BaseModel):
    proficiency: Optional[float] = None
    examples: Optional[List[Any]] = None


class AgentSkill(AgentSkillBase):
    id: uuid.UUID
    agent_id: uuid.UUID
    times_used: int
    success_rate: float
    created_at: datetime
    last_used_at: Optional[datetime]

    class Config:
        from_attributes = True
