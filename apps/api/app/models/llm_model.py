"""LLMModel model for individual LLM model configuration"""
import uuid
from sqlalchemy import Column, String, ForeignKey, JSON, Integer, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class LLMModel(Base):
    """LLM model configuration with pricing and capabilities."""
    __tablename__ = "llm_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("llm_providers.id"), nullable=False)

    # Model identification
    model_id = Column(String, nullable=False, index=True)  # claude-sonnet-4-5, gpt-4o
    display_name = Column(String, nullable=False)

    # Capabilities
    context_window = Column(Integer, nullable=False)
    max_output_tokens = Column(Integer, nullable=True)
    capabilities = Column(JSON, nullable=True)  # vision, function_calling, etc.

    # Pricing (per 1K tokens)
    input_cost_per_1k = Column(Numeric(10, 6), nullable=False)
    output_cost_per_1k = Column(Numeric(10, 6), nullable=False)

    # Classification
    speed_tier = Column(String, default="standard")  # fast, standard, slow
    quality_tier = Column(String, default="good")  # best, good, basic
    size_category = Column(String, default="medium")  # tiny, small, medium, large, xl
    edge_optimized = Column(Boolean, default=False)

    # Status
    is_active = Column(Boolean, default=True)

    # Relationships
    provider = relationship("LLMProvider")

    def __repr__(self):
        return f"<LLMModel {self.model_id}>"
