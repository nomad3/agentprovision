import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class AgentSkill(Base):
    """Learnable skill/capability for an agent."""
    __tablename__ = "agent_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)

    # Skill definition
    skill_name = Column(String, nullable=False)  # "sql_query", "summarization", "negotiation"
    proficiency = Column(Float, default=0.5)  # 0-1, improves with use

    # Usage metrics
    times_used = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)

    # Learning source
    learned_from = Column(String, nullable=True)  # "training", "observation", "practice", "feedback"
    examples = Column(JSON, nullable=True)  # Good examples for few-shot learning

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    # Relationships
    agent = relationship("Agent", back_populates="skills")
