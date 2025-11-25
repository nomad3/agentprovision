# Phase 3: Multi-LLM Router Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-LLM support with 50+ models across 20+ providers, smart routing, BYOK, and cost tracking.

**Architecture:** Create LLMProvider/LLMModel/LLMConfig models. Build LLMRouter service with provider adapters. Add cost tracking and budget controls.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, Pydantic, pytest, httpx

**Reference:** See `docs/plans/2025-11-25-enterprise-ai-platform-design.md` for full design details.

---

## Task 1: Create LLMProvider Model

**Files:**
- Create: `apps/api/app/models/llm_provider.py`
- Create: `apps/api/app/schemas/llm_provider.py`
- Modify: `apps/api/app/db/init_db.py`
- Test: `apps/api/tests/test_multi_llm.py`

**Step 1: Write the failing test**

Create file `apps/api/tests/test_multi_llm.py`:

```python
"""Tests for Phase 3: Multi-LLM System."""
import pytest
import os

os.environ["TESTING"] = "True"

def test_llm_provider_model():
    """Test LLMProvider model has required fields."""
    from app.models.llm_provider import LLMProvider

    assert hasattr(LLMProvider, 'id')
    assert hasattr(LLMProvider, 'name')
    assert hasattr(LLMProvider, 'display_name')
    assert hasattr(LLMProvider, 'base_url')
    assert hasattr(LLMProvider, 'auth_type')
    assert hasattr(LLMProvider, 'supported_features')
    assert hasattr(LLMProvider, 'is_active')
```

**Step 2: Run test**

```bash
cd apps/api && pytest tests/test_multi_llm.py::test_llm_provider_model -v
```

**Step 3: Create LLMProvider model**

```python
import uuid
from sqlalchemy import Column, String, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class LLMProvider(Base):
    """LLM provider configuration."""
    __tablename__ = "llm_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)  # anthropic, openai, deepseek
    display_name = Column(String, nullable=False)
    base_url = Column(String, nullable=False)
    auth_type = Column(String, default="api_key")  # api_key, oauth, custom
    supported_features = Column(JSON, nullable=True)  # streaming, function_calling, vision
    is_active = Column(Boolean, default=True)
```

**Step 4: Create schema**

```python
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

class LLMProvider(LLMProviderBase):
    id: uuid.UUID
    class Config:
        from_attributes = True
```

**Step 5: Update init_db.py**

```python
from app.models.llm_provider import LLMProvider  # noqa: F401
```

**Step 6: Run tests and commit**

```bash
cd apps/api && pytest tests/test_multi_llm.py -v
git add . && git commit -m "feat(llm): add LLMProvider model"
```

---

## Task 2: Create LLMModel Model

**Step 1: Add test**

```python
def test_llm_model_model():
    """Test LLMModel has required fields."""
    from app.models.llm_model import LLMModel

    assert hasattr(LLMModel, 'id')
    assert hasattr(LLMModel, 'provider_id')
    assert hasattr(LLMModel, 'model_id')
    assert hasattr(LLMModel, 'context_window')
    assert hasattr(LLMModel, 'input_cost_per_1k')
    assert hasattr(LLMModel, 'output_cost_per_1k')
    assert hasattr(LLMModel, 'speed_tier')
    assert hasattr(LLMModel, 'quality_tier')
```

**Step 2: Create model**

```python
import uuid
from decimal import Decimal
from sqlalchemy import Column, String, ForeignKey, JSON, Integer, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class LLMModel(Base):
    """LLM model configuration."""
    __tablename__ = "llm_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("llm_providers.id"), nullable=False)
    model_id = Column(String, nullable=False)  # claude-sonnet-4-5
    display_name = Column(String, nullable=False)
    context_window = Column(Integer, nullable=False)
    max_output_tokens = Column(Integer, nullable=True)
    input_cost_per_1k = Column(Numeric(10, 6), nullable=False)
    output_cost_per_1k = Column(Numeric(10, 6), nullable=False)
    capabilities = Column(JSON, nullable=True)
    speed_tier = Column(String, default="standard")  # fast, standard, slow
    quality_tier = Column(String, default="good")  # best, good, basic
    size_category = Column(String, default="medium")  # tiny, small, medium, large, xl
    is_active = Column(Boolean, default=True)

    provider = relationship("LLMProvider")
```

**Step 3: Create schema and commit**

```python
class LLMModelBase(BaseModel):
    model_id: str
    display_name: str
    context_window: int
    input_cost_per_1k: float
    output_cost_per_1k: float
    speed_tier: Optional[str] = "standard"
    quality_tier: Optional[str] = "good"

class LLMModelCreate(LLMModelBase):
    provider_id: uuid.UUID

class LLMModel(LLMModelBase):
    id: uuid.UUID
    provider_id: uuid.UUID
    class Config:
        from_attributes = True
```

```bash
git add . && git commit -m "feat(llm): add LLMModel with pricing and capabilities"
```

---

## Task 3: Create LLMConfig Model

**Model:**

```python
class LLMConfig(Base):
    """Tenant LLM configuration."""
    __tablename__ = "llm_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    is_tenant_default = Column(Boolean, default=False)
    primary_model_id = Column(UUID(as_uuid=True), ForeignKey("llm_models.id"), nullable=False)
    fallback_model_id = Column(UUID(as_uuid=True), ForeignKey("llm_models.id"), nullable=True)
    api_key_encrypted = Column(String, nullable=True)  # BYOK
    use_platform_key = Column(Boolean, default=True)
    temperature = Column(Numeric(3, 2), default=0.7)
    max_tokens = Column(Integer, default=4096)
    routing_rules = Column(JSON, nullable=True)
    budget_limit_daily = Column(Numeric(10, 2), nullable=True)
    budget_limit_monthly = Column(Numeric(10, 2), nullable=True)

    tenant = relationship("Tenant")
    primary_model = relationship("LLMModel", foreign_keys=[primary_model_id])
    fallback_model = relationship("LLMModel", foreign_keys=[fallback_model_id])
```

---

## Task 4: Create LLMRouter Service

**File:** `apps/api/app/services/llm/router.py`

```python
"""LLM Router for smart model selection."""
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.models.llm_config import LLMConfig
from app.models.llm_model import LLMModel

class LLMRouter:
    """Routes requests to optimal LLM based on task requirements."""

    def __init__(self, db: Session):
        self.db = db

    def select_model(
        self,
        tenant_id: uuid.UUID,
        task_type: str = None,
        priority: str = "balanced",  # cost, speed, quality, balanced
        config_id: uuid.UUID = None
    ) -> LLMModel:
        """Select best model for task."""
        # Get tenant config
        if config_id:
            config = self.db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
        else:
            config = self.db.query(LLMConfig).filter(
                LLMConfig.tenant_id == tenant_id,
                LLMConfig.is_tenant_default == True
            ).first()

        if not config:
            raise ValueError("No LLM config found")

        # Apply routing rules
        if config.routing_rules and task_type:
            rule = config.routing_rules.get(task_type)
            if rule:
                return self.db.query(LLMModel).filter(
                    LLMModel.id == rule["model_id"]
                ).first()

        # Default to primary model
        return config.primary_model

    def estimate_cost(self, model: LLMModel, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for token usage."""
        input_cost = (input_tokens / 1000) * float(model.input_cost_per_1k)
        output_cost = (output_tokens / 1000) * float(model.output_cost_per_1k)
        return input_cost + output_cost
```

---

## Task 5: Seed Initial Providers and Models

**File:** `apps/api/app/db/seed_llm_data.py`

```python
"""Seed LLM providers and models."""
from sqlalchemy.orm import Session
from app.models.llm_provider import LLMProvider
from app.models.llm_model import LLMModel

def seed_llm_providers(db: Session):
    """Seed initial LLM providers."""
    providers = [
        {
            "name": "anthropic",
            "display_name": "Anthropic",
            "base_url": "https://api.anthropic.com/v1",
            "auth_type": "api_key",
            "supported_features": {"streaming": True, "function_calling": True, "vision": True}
        },
        {
            "name": "openai",
            "display_name": "OpenAI",
            "base_url": "https://api.openai.com/v1",
            "auth_type": "api_key",
            "supported_features": {"streaming": True, "function_calling": True, "vision": True}
        },
        {
            "name": "deepseek",
            "display_name": "DeepSeek",
            "base_url": "https://api.deepseek.com/v1",
            "auth_type": "api_key",
            "supported_features": {"streaming": True, "function_calling": False}
        }
    ]

    for p in providers:
        existing = db.query(LLMProvider).filter(LLMProvider.name == p["name"]).first()
        if not existing:
            provider = LLMProvider(**p)
            db.add(provider)

    db.commit()

def seed_llm_models(db: Session):
    """Seed initial LLM models."""
    anthropic = db.query(LLMProvider).filter(LLMProvider.name == "anthropic").first()
    openai = db.query(LLMProvider).filter(LLMProvider.name == "openai").first()

    models = [
        {
            "provider_id": anthropic.id,
            "model_id": "claude-sonnet-4-20250514",
            "display_name": "Claude Sonnet 4",
            "context_window": 200000,
            "input_cost_per_1k": 0.003,
            "output_cost_per_1k": 0.015,
            "speed_tier": "standard",
            "quality_tier": "best"
        },
        {
            "provider_id": openai.id,
            "model_id": "gpt-4o",
            "display_name": "GPT-4o",
            "context_window": 128000,
            "input_cost_per_1k": 0.0025,
            "output_cost_per_1k": 0.01,
            "speed_tier": "fast",
            "quality_tier": "best"
        }
    ]

    for m in models:
        existing = db.query(LLMModel).filter(LLMModel.model_id == m["model_id"]).first()
        if not existing:
            model = LLMModel(**m)
            db.add(model)

    db.commit()
```

---

## Task 6: Create LLM API Routes

**File:** `apps/api/app/api/v1/llm.py`

```python
"""LLM configuration API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.llm_provider import LLMProvider
from app.schemas.llm_model import LLMModel
from app.models import llm_provider, llm_model

router = APIRouter()

@router.get("/providers", response_model=List[LLMProvider])
def list_providers(db: Session = Depends(get_db)):
    """List all LLM providers."""
    return db.query(llm_provider.LLMProvider).filter(
        llm_provider.LLMProvider.is_active == True
    ).all()

@router.get("/models", response_model=List[LLMModel])
def list_models(
    provider_name: str = None,
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
```

**Update routes.py:**

```python
from app.api.v1 import llm

router.include_router(llm.router, prefix="/llm", tags=["llm"])
```

---

## Task 7: Final Testing and Commit

```bash
cd apps/api && pytest tests/test_multi_llm.py -v
git add -A
git commit -m "feat(llm): complete Phase 3 - Multi-LLM Router

- Added LLMProvider model for provider configuration
- Added LLMModel model with 50+ models support
- Added LLMConfig for tenant-specific settings
- Added LLMRouter service for smart model selection
- Added cost estimation and budget tracking
- Seeded initial providers (Anthropic, OpenAI, DeepSeek)
- Added LLM API routes for configuration

Part of Enterprise AI Platform"
```

---

## Verification Checklist

- [ ] LLMProvider model created
- [ ] LLMModel model created
- [ ] LLMConfig model created
- [ ] LLMRouter service implemented
- [ ] Provider seed data added
- [ ] API routes registered
- [ ] All tests passing
- [ ] Code committed

## New API Endpoints

```
GET  /api/v1/llm/providers     - List providers
GET  /api/v1/llm/models        - List models
GET  /api/v1/llm/configs       - List tenant configs
POST /api/v1/llm/configs       - Create config
```

**Plan complete.** Ready for implementation!
