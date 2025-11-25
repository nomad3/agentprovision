"""Pydantic schemas for LLMConfig"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from decimal import Decimal
import uuid


class LLMConfigBase(BaseModel):
    name: str
    is_tenant_default: Optional[bool] = False
    use_platform_key: Optional[bool] = True
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096
    routing_rules: Optional[Dict[str, Any]] = None
    budget_limit_daily: Optional[float] = None
    budget_limit_monthly: Optional[float] = None


class LLMConfigCreate(LLMConfigBase):
    primary_model_id: uuid.UUID
    fallback_model_id: Optional[uuid.UUID] = None
    api_key: Optional[str] = None  # Will be encrypted


class LLMConfigUpdate(BaseModel):
    name: Optional[str] = None
    is_tenant_default: Optional[bool] = None
    primary_model_id: Optional[uuid.UUID] = None
    fallback_model_id: Optional[uuid.UUID] = None
    api_key: Optional[str] = None
    use_platform_key: Optional[bool] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    routing_rules: Optional[Dict[str, Any]] = None
    budget_limit_daily: Optional[float] = None
    budget_limit_monthly: Optional[float] = None


class LLMConfig(LLMConfigBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    primary_model_id: uuid.UUID
    fallback_model_id: Optional[uuid.UUID]

    class Config:
        from_attributes = True
