import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class AgentMessage(Base):
    """Inter-agent communication message."""
    __tablename__ = "agent_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("agent_groups.id"), nullable=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id"), nullable=True)
    from_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    to_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)  # Null = broadcast

    # Message content
    message_type = Column(String, nullable=False)  # request, response, handoff, escalation, update, question, approval_request
    content = Column(JSON, nullable=False)  # The actual message
    reasoning = Column(String, nullable=True)  # Why sending this message

    # Response handling
    requires_response = Column(Boolean, default=False)
    response_deadline = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("AgentGroup")
    task = relationship("AgentTask")
    from_agent = relationship("Agent", foreign_keys=[from_agent_id])
    to_agent = relationship("Agent", foreign_keys=[to_agent_id])
