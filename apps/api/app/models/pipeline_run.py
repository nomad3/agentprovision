import uuid
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("data_pipelines.id"))
    workflow_id = Column(String)  # Temporal workflow ID
    status = Column(String)  # pending, running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
    output = Column(JSON, nullable=True)

    pipeline = relationship("DataPipeline")
