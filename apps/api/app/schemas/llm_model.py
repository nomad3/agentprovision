"""Pydantic schemas for LLMModel"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from decimal import Decimal
import uuid


class LLMModelBase(BaseModel):
    model_id: str
    display_name: str
    context_window: int
    max_output_tokens: Optional[int] = None
    input_cost_per_1k: float
    output_cost_per_1k: float
    capabilities: Optional[Dict[str, Any]] = None
    speed_tier: Optional[str] = "standard"
    quality_tier: Optional[str] = "good"
    size_category: Optional[str] = "medium"
    edge_optimized: Optional[bool] = False
    is_active: Optional[bool] = True


class LLMModelCreate(LLMModelBase):
    provider_id: uuid.UUID


class LLMModelUpdate(BaseModel):
    display_name: Optional[str] = None
    context_window: Optional[int] = None
    max_output_tokens: Optional[int] = None
    input_cost_per_1k: Optional[float] = None
    output_cost_per_1k: Optional[float] = None
    capabilities: Optional[Dict[str, Any]] = None
    speed_tier: Optional[str] = None
    quality_tier: Optional[str] = None
    size_category: Optional[str] = None
    edge_optimized: Optional[bool] = None
    is_active: Optional[bool] = None


class LLMModel(LLMModelBase):
    id: uuid.UUID
    provider_id: uuid.UUID

    class Config:
        from_attributes = True
