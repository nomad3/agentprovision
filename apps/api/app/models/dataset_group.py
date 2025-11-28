import uuid
from sqlalchemy import Column, String, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime

from app.db.base import Base

# Association table for Many-to-Many relationship between DatasetGroup and Dataset
dataset_group_association = Table(
    "dataset_group_items",
    Base.metadata,
    Column("dataset_group_id", UUID(as_uuid=True), ForeignKey("dataset_groups.id"), primary_key=True),
    Column("dataset_id", UUID(as_uuid=True), ForeignKey("datasets.id"), primary_key=True),
)

class DatasetGroup(Base):
    __tablename__ = "dataset_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant")
    datasets = relationship("Dataset", secondary=dataset_group_association, backref="groups")
