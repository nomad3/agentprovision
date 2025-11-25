import uuid
from sqlalchemy import Column, String, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    config = Column(JSON)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"))
    tenant = relationship("Tenant")

    # Orchestration fields
    role = Column(String, nullable=True)  # "analyst", "manager", "specialist"
    capabilities = Column(JSON, nullable=True)  # list of capability strings
    personality = Column(JSON, nullable=True)  # dict with tone, verbosity settings
    autonomy_level = Column(String, default="supervised")  # "full", "supervised", "approval_required"
    max_delegation_depth = Column(Integer, default=2)

    # Add relationship to skills
    skills = relationship("AgentSkill", back_populates="agent")
