"""LLM configuration API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.llm_provider import LLMProvider
from app.schemas.llm_model import LLMModel
from app.schemas.llm_config import LLMConfig, LLMConfigCreate, LLMConfigUpdate
from app.models import llm_provider, llm_model, llm_config

router = APIRouter()


@router.get("/providers", response_model=List[LLMProvider])
def list_providers(db: Session = Depends(get_db)):
    """List all LLM providers."""
    return db.query(llm_provider.LLMProvider).filter(
        llm_provider.LLMProvider.is_active == True
    ).all()


@router.get("/models", response_model=List[LLMModel])
def list_models(
    provider_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List available LLM models."""
    query = db.query(llm_model.LLMModel).filter(llm_model.LLMModel.is_active == True)

    if provider_name:
        provider = db.query(llm_provider.LLMProvider).filter(
            llm_provider.LLMProvider.name == provider_name
        ).first()
        if provider:
            query = query.filter(llm_model.LLMModel.provider_id == provider.id)

    return query.all()


@router.get("/configs", response_model=List[LLMConfig])
def list_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List tenant LLM configurations."""
    return db.query(llm_config.LLMConfig).filter(
        llm_config.LLMConfig.tenant_id == current_user.tenant_id
    ).all()


@router.post("/configs", response_model=LLMConfig, status_code=201)
def create_config(
    config_in: LLMConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new LLM configuration."""
    # Check if tenant already has a default config
    if config_in.is_tenant_default:
        existing_default = db.query(llm_config.LLMConfig).filter(
            llm_config.LLMConfig.tenant_id == current_user.tenant_id,
            llm_config.LLMConfig.is_tenant_default == True
        ).first()
        if existing_default:
            existing_default.is_tenant_default = False
            db.add(existing_default)

    config = llm_config.LLMConfig(
        tenant_id=current_user.tenant_id,
        name=config_in.name,
        is_tenant_default=config_in.is_tenant_default,
        primary_model_id=config_in.primary_model_id,
        fallback_model_id=config_in.fallback_model_id,
        api_key_encrypted=config_in.api_key,  # In real app, encrypt this!
        use_platform_key=config_in.use_platform_key,
        temperature=config_in.temperature,
        max_tokens=config_in.max_tokens,
        routing_rules=config_in.routing_rules,
        budget_limit_daily=config_in.budget_limit_daily,
        budget_limit_monthly=config_in.budget_limit_monthly
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config
