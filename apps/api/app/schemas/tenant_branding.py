"""Pydantic schemas for TenantBranding."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class TenantBrandingBase(BaseModel):
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    logo_dark_url: Optional[str] = None
    favicon_url: Optional[str] = None
    support_email: Optional[str] = None
    primary_color: Optional[str] = "#6366f1"
    secondary_color: Optional[str] = "#8b5cf6"
    accent_color: Optional[str] = "#06b6d4"
    background_color: Optional[str] = "#0f172a"
    sidebar_bg: Optional[str] = "#1e293b"
    ai_assistant_name: Optional[str] = "AI Assistant"
    ai_assistant_persona: Optional[Dict[str, Any]] = None
    custom_domain: Optional[str] = None
    industry: Optional[str] = None
    compliance_mode: Optional[List[str]] = None


class TenantBrandingCreate(TenantBrandingBase):
    pass


class TenantBrandingUpdate(BaseModel):
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    logo_dark_url: Optional[str] = None
    favicon_url: Optional[str] = None
    support_email: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    sidebar_bg: Optional[str] = None
    ai_assistant_name: Optional[str] = None
    ai_assistant_persona: Optional[Dict[str, Any]] = None
    custom_domain: Optional[str] = None
    industry: Optional[str] = None
    compliance_mode: Optional[List[str]] = None


class TenantBranding(TenantBrandingBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    domain_verified: bool = False
    ssl_certificate_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
