"""Pydantic schemas for LLMProvider"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid


class LLMProviderBase(BaseModel):
    name: str
    display_name: str
    base_url: str
    auth_type: Optional[str] = "api_key"
    supported_features: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = True


class LLMProviderCreate(LLMProviderBase):
    pass


class LLMProviderUpdate(BaseModel):
    display_name: Optional[str] = None
    base_url: Optional[str] = None
    auth_type: Optional[str] = None
    supported_features: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class LLMProvider(LLMProviderBase):
    id: uuid.UUID

    class Config:
        from_attributes = True
