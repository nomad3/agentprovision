import uuid
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base

class AgentKit(Base):
    __tablename__ = "agent_kits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    version = Column(String, nullable=True)
    config = Column(JSON)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"))
    tenant = relationship("Tenant")

    # Kit configuration
    kit_type = Column(String, default="single")  # "single", "team", "hierarchy"
    default_agents = Column(JSON, nullable=True)  # [{"name": "Analyst", "role": "analyst", ...}]
    default_hierarchy = Column(JSON, nullable=True)  # {"supervisor": "Manager", "workers": ["Analyst"]}
    industry = Column(String, nullable=True)  # "healthcare", "finance", "legal", "retail"
