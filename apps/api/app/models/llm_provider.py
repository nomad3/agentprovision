"""LLMProvider model for LLM provider configuration"""
import uuid
from sqlalchemy import Column, String, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class LLMProvider(Base):
    """LLM provider configuration."""
    __tablename__ = "llm_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False, index=True)  # anthropic, openai, deepseek
    display_name = Column(String, nullable=False)
    base_url = Column(String, nullable=False)
    auth_type = Column(String, default="api_key")  # api_key, oauth, custom
    supported_features = Column(JSON, nullable=True)  # streaming, function_calling, vision
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<LLMProvider {self.name}>"
