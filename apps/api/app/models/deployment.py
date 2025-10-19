import uuid
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    config = Column(JSON)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"))
    agent = relationship("Agent")
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"))
    tenant = relationship("Tenant")
