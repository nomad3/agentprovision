import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class AgentRelationship(Base):
    """Defines relationships between agents within a group."""
    __tablename__ = "agent_relationships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("agent_groups.id"), nullable=False)
    from_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    to_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)

    # Relationship configuration
    relationship_type = Column(String, nullable=False)  # "supervises", "delegates_to", "collaborates_with", "reports_to", "consults"
    trust_level = Column(Float, default=0.5)  # 0-1, affects autonomy
    communication_style = Column(String, default="async")  # "sync", "async", "broadcast"
    handoff_rules = Column(JSON, nullable=True)  # When/how to pass work

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("AgentGroup")
    from_agent = relationship("Agent", foreign_keys=[from_agent_id])
    to_agent = relationship("Agent", foreign_keys=[to_agent_id])
