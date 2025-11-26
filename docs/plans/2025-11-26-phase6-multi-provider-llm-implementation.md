# Phase 6: Multi-Provider LLM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add support for 5 LLM providers (OpenAI, Anthropic, DeepSeek, Google, Mistral) with unified OpenAI-compatible interface and BYOK key management.

**Architecture:** LLMProviderFactory creates OpenAI clients with different base_url per provider. AnthropicAdapter wraps native SDK. Unified LLMService replaces legacy_service.py and integrates with existing LLMRouter.

**Tech Stack:** Python 3.11, FastAPI, OpenAI SDK, Anthropic SDK, SQLAlchemy, React, Bootstrap 5

---

## Part A: Backend Provider Infrastructure

### Task 1: Add provider_api_keys to LLMConfig Model

**Files:**
- Modify: `apps/api/app/models/llm_config.py:33`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Create `apps/api/tests/test_multi_provider.py`:

```python
"""Tests for multi-provider LLM integration."""
import pytest
from app.models.llm_config import LLMConfig


def test_llm_config_has_provider_api_keys():
    """LLMConfig should have provider_api_keys JSON field."""
    config = LLMConfig(
        name="test",
        provider_api_keys={"openai": "sk-test", "deepseek": "sk-deep"}
    )
    assert config.provider_api_keys["openai"] == "sk-test"
    assert config.provider_api_keys["deepseek"] == "sk-deep"
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_llm_config_has_provider_api_keys -v`
Expected: FAIL with TypeError (no provider_api_keys attribute)

**Step 3: Add provider_api_keys field to LLMConfig**

In `apps/api/app/models/llm_config.py`, add after line 33 (routing_rules):

```python
    # Provider API Keys (BYOK)
    provider_api_keys = Column(JSON, nullable=True)  # {"openai": "sk-...", "deepseek": "sk-..."}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_llm_config_has_provider_api_keys -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/models/llm_config.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): add provider_api_keys to LLMConfig for BYOK"
```

---

### Task 2: Create LLMProviderFactory

**Files:**
- Create: `apps/api/app/services/llm/provider_factory.py`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_multi_provider.py`:

```python
from unittest.mock import patch, MagicMock


def test_provider_factory_returns_openai_client_for_openai():
    """Factory should return OpenAI client for openai provider."""
    from app.services.llm.provider_factory import LLMProviderFactory

    factory = LLMProviderFactory()
    with patch('app.services.llm.provider_factory.OpenAI') as mock_openai:
        mock_openai.return_value = MagicMock()
        client = factory.get_client("openai", "sk-test-key")
        mock_openai.assert_called_once_with(
            api_key="sk-test-key",
            base_url="https://api.openai.com/v1"
        )


def test_provider_factory_returns_openai_client_for_deepseek():
    """Factory should return OpenAI client with DeepSeek base_url."""
    from app.services.llm.provider_factory import LLMProviderFactory

    factory = LLMProviderFactory()
    with patch('app.services.llm.provider_factory.OpenAI') as mock_openai:
        mock_openai.return_value = MagicMock()
        client = factory.get_client("deepseek", "sk-deep-key")
        mock_openai.assert_called_once_with(
            api_key="sk-deep-key",
            base_url="https://api.deepseek.com/v1"
        )


def test_provider_factory_returns_anthropic_adapter():
    """Factory should return AnthropicAdapter for anthropic provider."""
    from app.services.llm.provider_factory import LLMProviderFactory

    factory = LLMProviderFactory()
    with patch('app.services.llm.provider_factory.AnthropicAdapter') as mock_adapter:
        mock_adapter.return_value = MagicMock()
        client = factory.get_client("anthropic", "sk-ant-key")
        mock_adapter.assert_called_once_with("sk-ant-key")
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_provider_factory_returns_openai_client_for_openai -v`
Expected: FAIL with ModuleNotFoundError

**Step 3: Create provider_factory.py**

Create `apps/api/app/services/llm/provider_factory.py`:

```python
"""LLM Provider Factory for multi-provider support."""
from openai import OpenAI


class AnthropicAdapter:
    """Placeholder - will be implemented in Task 3."""
    def __init__(self, api_key: str):
        self.api_key = api_key


class LLMProviderFactory:
    """Creates configured LLM clients for each provider."""

    PROVIDER_CONFIGS = {
        "openai": {"base_url": "https://api.openai.com/v1"},
        "deepseek": {"base_url": "https://api.deepseek.com/v1"},
        "mistral": {"base_url": "https://api.mistral.ai/v1"},
        "google": {"base_url": "https://generativelanguage.googleapis.com/v1beta/openai"},
    }

    def get_client(self, provider_name: str, api_key: str):
        """
        Get a configured LLM client for the specified provider.

        Args:
            provider_name: Name of the provider (openai, anthropic, deepseek, etc.)
            api_key: API key for the provider

        Returns:
            Configured client (OpenAI client or AnthropicAdapter)
        """
        if provider_name == "anthropic":
            return AnthropicAdapter(api_key)

        config = self.PROVIDER_CONFIGS.get(provider_name)
        if not config:
            raise ValueError(f"Unknown provider: {provider_name}")

        return OpenAI(api_key=api_key, base_url=config["base_url"])
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/api && pytest tests/test_multi_provider.py -v -k "provider_factory"`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add apps/api/app/services/llm/provider_factory.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): add LLMProviderFactory for multi-provider support"
```

---

### Task 3: Create AnthropicAdapter

**Files:**
- Modify: `apps/api/app/services/llm/provider_factory.py`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_multi_provider.py`:

```python
def test_anthropic_adapter_converts_messages():
    """AnthropicAdapter should convert OpenAI format to Anthropic format."""
    from app.services.llm.provider_factory import AnthropicAdapter

    with patch('app.services.llm.provider_factory.anthropic') as mock_anthropic:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.content = [MagicMock(type="text", text="Hello!")]
        mock_response.usage = MagicMock(input_tokens=10, output_tokens=5)
        mock_response.stop_reason = "end_turn"
        mock_client.messages.create.return_value = mock_response
        mock_anthropic.Anthropic.return_value = mock_client

        adapter = AnthropicAdapter("sk-ant-key")
        response = adapter.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "You are helpful."},
                {"role": "user", "content": "Hi"}
            ],
            max_tokens=100
        )

        # Verify Anthropic was called with converted format
        mock_client.messages.create.assert_called_once()
        call_kwargs = mock_client.messages.create.call_args[1]
        assert call_kwargs["system"] == "You are helpful."
        assert call_kwargs["messages"] == [{"role": "user", "content": "Hi"}]

        # Verify response is OpenAI-compatible
        assert response.choices[0].message.content == "Hello!"
        assert response.usage.prompt_tokens == 10
        assert response.usage.completion_tokens == 5
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_anthropic_adapter_converts_messages -v`
Expected: FAIL with AttributeError (adapter has no chat attribute)

**Step 3: Implement full AnthropicAdapter**

Replace the AnthropicAdapter class in `apps/api/app/services/llm/provider_factory.py`:

```python
"""LLM Provider Factory for multi-provider support."""
from dataclasses import dataclass
from typing import List, Optional
import anthropic
from openai import OpenAI


@dataclass
class OpenAIMessage:
    role: str
    content: str


@dataclass
class OpenAIChoice:
    index: int
    message: OpenAIMessage
    finish_reason: str


@dataclass
class OpenAIUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


@dataclass
class OpenAIResponse:
    id: str
    choices: List[OpenAIChoice]
    usage: OpenAIUsage
    model: str


class AnthropicAdapter:
    """Adapts Anthropic SDK to OpenAI-like interface."""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.chat = self._Chat(self.client)

    class _Chat:
        def __init__(self, client):
            self.completions = self._Completions(client)

        class _Completions:
            def __init__(self, client):
                self.client = client

            def create(
                self,
                model: str,
                messages: List[dict],
                max_tokens: int = 4096,
                temperature: float = 0.7,
                **kwargs
            ) -> OpenAIResponse:
                """Convert OpenAI format to Anthropic and back."""
                # Extract system message
                system = None
                anthropic_messages = []

                for msg in messages:
                    if msg["role"] == "system":
                        system = msg["content"]
                    else:
                        anthropic_messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })

                # Call Anthropic
                response = self.client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system,
                    messages=anthropic_messages,
                )

                # Extract text from response
                text = ""
                for block in response.content:
                    if block.type == "text":
                        text += block.text

                # Convert to OpenAI format
                return OpenAIResponse(
                    id=f"chatcmpl-{response.id}" if hasattr(response, 'id') else "chatcmpl-anthropic",
                    model=model,
                    choices=[
                        OpenAIChoice(
                            index=0,
                            message=OpenAIMessage(role="assistant", content=text),
                            finish_reason="stop" if response.stop_reason == "end_turn" else response.stop_reason
                        )
                    ],
                    usage=OpenAIUsage(
                        prompt_tokens=response.usage.input_tokens,
                        completion_tokens=response.usage.output_tokens,
                        total_tokens=response.usage.input_tokens + response.usage.output_tokens
                    )
                )


class LLMProviderFactory:
    """Creates configured LLM clients for each provider."""

    PROVIDER_CONFIGS = {
        "openai": {"base_url": "https://api.openai.com/v1"},
        "deepseek": {"base_url": "https://api.deepseek.com/v1"},
        "mistral": {"base_url": "https://api.mistral.ai/v1"},
        "google": {"base_url": "https://generativelanguage.googleapis.com/v1beta/openai"},
    }

    def get_client(self, provider_name: str, api_key: str):
        """
        Get a configured LLM client for the specified provider.

        Args:
            provider_name: Name of the provider (openai, anthropic, deepseek, etc.)
            api_key: API key for the provider

        Returns:
            Configured client (OpenAI client or AnthropicAdapter)
        """
        if provider_name == "anthropic":
            return AnthropicAdapter(api_key)

        config = self.PROVIDER_CONFIGS.get(provider_name)
        if not config:
            raise ValueError(f"Unknown provider: {provider_name}")

        return OpenAI(api_key=api_key, base_url=config["base_url"])
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_anthropic_adapter_converts_messages -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/services/llm/provider_factory.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): implement AnthropicAdapter with OpenAI-compatible interface"
```

---

### Task 4: Create Unified LLMService

**Files:**
- Create: `apps/api/app/services/llm/service.py`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_multi_provider.py`:

```python
from unittest.mock import patch, MagicMock
import uuid


def test_llm_service_uses_router_to_select_model():
    """LLMService should use router to select model and factory to create client."""
    from app.services.llm.service import LLMService

    mock_db = MagicMock()
    tenant_id = uuid.uuid4()

    with patch('app.services.llm.service.LLMRouter') as mock_router_class, \
         patch('app.services.llm.service.LLMProviderFactory') as mock_factory_class:

        # Setup mocks
        mock_router = MagicMock()
        mock_model = MagicMock()
        mock_model.model_id = "gpt-4o"
        mock_model.provider.name = "openai"
        mock_model.id = uuid.uuid4()
        mock_router.select_model.return_value = mock_model

        mock_config = MagicMock()
        mock_config.provider_api_keys = {"openai": "sk-test"}
        mock_router.get_tenant_config.return_value = mock_config

        mock_router_class.return_value = mock_router

        mock_factory = MagicMock()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        mock_client.chat.completions.create.return_value = mock_response
        mock_factory.get_client.return_value = mock_client
        mock_factory_class.return_value = mock_factory

        # Create service and call
        service = LLMService(mock_db, tenant_id)
        response = service.generate_response(
            messages=[{"role": "user", "content": "Hello"}],
            task_type="general"
        )

        # Verify router was used
        mock_router.select_model.assert_called_once_with(tenant_id, "general")
        mock_factory.get_client.assert_called_once_with("openai", "sk-test")
        mock_client.chat.completions.create.assert_called_once()
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_llm_service_uses_router_to_select_model -v`
Expected: FAIL with ModuleNotFoundError

**Step 3: Create service.py**

Create `apps/api/app/services/llm/service.py`:

```python
"""Unified LLM Service for multi-provider support."""
from typing import List, Dict, Any, Optional
import uuid

from sqlalchemy.orm import Session

from app.services.llm.router import LLMRouter
from app.services.llm.provider_factory import LLMProviderFactory


class LLMService:
    """Unified service for LLM interactions across multiple providers."""

    def __init__(self, db: Session, tenant_id: uuid.UUID):
        self.db = db
        self.tenant_id = tenant_id
        self.router = LLMRouter(db)
        self.factory = LLMProviderFactory()

    def generate_response(
        self,
        messages: List[Dict[str, str]],
        task_type: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        **kwargs
    ) -> Any:
        """
        Generate a response using the optimal model for the task.

        Args:
            messages: List of messages in OpenAI format
            task_type: Type of task for routing (coding, creative, analysis, etc.)
            max_tokens: Maximum tokens in response
            temperature: Response creativity

        Returns:
            OpenAI-compatible response object
        """
        # 1. Router selects optimal model
        model = self.router.select_model(self.tenant_id, task_type)

        # 2. Get tenant's API key for this provider
        config = self.router.get_tenant_config(self.tenant_id)
        api_key = self._get_api_key(config, model.provider.name)

        if not api_key:
            raise ValueError(f"No API key configured for provider: {model.provider.name}")

        # 3. Factory creates provider client
        client = self.factory.get_client(model.provider.name, api_key)

        # 4. Make request
        response = client.chat.completions.create(
            model=model.model_id,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs
        )

        # 5. Track usage
        cost = self.router.estimate_cost(
            model,
            response.usage.prompt_tokens,
            response.usage.completion_tokens
        )
        self.router.track_usage(
            tenant_id=self.tenant_id,
            model_id=model.id,
            tokens_input=response.usage.prompt_tokens,
            tokens_output=response.usage.completion_tokens,
            cost=cost
        )

        return response

    def _get_api_key(self, config, provider_name: str) -> Optional[str]:
        """Get API key for provider from config."""
        if config and config.provider_api_keys:
            return config.provider_api_keys.get(provider_name)
        return None
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_llm_service_uses_router_to_select_model -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/services/llm/service.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): add unified LLMService with router and factory integration"
```

---

### Task 5: Seed Providers and Models in init_db

**Files:**
- Modify: `apps/api/app/db/init_db.py`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_multi_provider.py`:

```python
def test_providers_seeded_in_db(db_session):
    """Database should have 5 providers seeded."""
    from app.models.llm_provider import LLMProvider

    providers = db_session.query(LLMProvider).all()
    provider_names = [p.name for p in providers]

    assert "openai" in provider_names
    assert "anthropic" in provider_names
    assert "deepseek" in provider_names
    assert "google" in provider_names
    assert "mistral" in provider_names


def test_models_seeded_in_db(db_session):
    """Database should have models for each provider."""
    from app.models.llm_model import LLMModel

    models = db_session.query(LLMModel).all()
    model_ids = [m.model_id for m in models]

    assert "gpt-4o" in model_ids
    assert "claude-sonnet-4-20250514" in model_ids
    assert "deepseek-chat" in model_ids
    assert "gemini-1.5-pro" in model_ids
    assert "mistral-large-latest" in model_ids
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_providers_seeded_in_db -v`
Expected: FAIL (providers not found)

**Step 3: Add provider and model seeding to init_db.py**

Add to `apps/api/app/db/init_db.py` after existing seed functions:

```python
def seed_llm_providers(db: Session) -> None:
    """Seed LLM providers."""
    from app.models.llm_provider import LLMProvider

    providers = [
        {
            "name": "openai",
            "display_name": "OpenAI",
            "api_base_url": "https://api.openai.com/v1",
            "is_openai_compatible": True,
            "is_active": True,
        },
        {
            "name": "anthropic",
            "display_name": "Anthropic",
            "api_base_url": "https://api.anthropic.com/v1",
            "is_openai_compatible": False,
            "is_active": True,
        },
        {
            "name": "deepseek",
            "display_name": "DeepSeek",
            "api_base_url": "https://api.deepseek.com/v1",
            "is_openai_compatible": True,
            "is_active": True,
        },
        {
            "name": "google",
            "display_name": "Google AI",
            "api_base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
            "is_openai_compatible": True,
            "is_active": True,
        },
        {
            "name": "mistral",
            "display_name": "Mistral AI",
            "api_base_url": "https://api.mistral.ai/v1",
            "is_openai_compatible": True,
            "is_active": True,
        },
    ]

    for provider_data in providers:
        existing = db.query(LLMProvider).filter(LLMProvider.name == provider_data["name"]).first()
        if not existing:
            db.add(LLMProvider(**provider_data))

    db.commit()


def seed_llm_models(db: Session) -> None:
    """Seed LLM models for each provider."""
    from app.models.llm_provider import LLMProvider
    from app.models.llm_model import LLMModel
    from decimal import Decimal

    models = [
        # OpenAI
        {"provider": "openai", "model_id": "gpt-4o", "display_name": "GPT-4o", "input_cost": "2.50", "output_cost": "10.00", "context_window": 128000},
        {"provider": "openai", "model_id": "gpt-4o-mini", "display_name": "GPT-4o Mini", "input_cost": "0.15", "output_cost": "0.60", "context_window": 128000},
        # Anthropic
        {"provider": "anthropic", "model_id": "claude-sonnet-4-20250514", "display_name": "Claude Sonnet 4", "input_cost": "3.00", "output_cost": "15.00", "context_window": 200000},
        {"provider": "anthropic", "model_id": "claude-3-5-haiku-20241022", "display_name": "Claude 3.5 Haiku", "input_cost": "0.80", "output_cost": "4.00", "context_window": 200000},
        # DeepSeek
        {"provider": "deepseek", "model_id": "deepseek-chat", "display_name": "DeepSeek Chat", "input_cost": "0.14", "output_cost": "0.28", "context_window": 64000},
        {"provider": "deepseek", "model_id": "deepseek-coder", "display_name": "DeepSeek Coder", "input_cost": "0.14", "output_cost": "0.28", "context_window": 64000},
        # Google
        {"provider": "google", "model_id": "gemini-1.5-pro", "display_name": "Gemini 1.5 Pro", "input_cost": "1.25", "output_cost": "5.00", "context_window": 1000000},
        {"provider": "google", "model_id": "gemini-1.5-flash", "display_name": "Gemini 1.5 Flash", "input_cost": "0.075", "output_cost": "0.30", "context_window": 1000000},
        # Mistral
        {"provider": "mistral", "model_id": "mistral-large-latest", "display_name": "Mistral Large", "input_cost": "2.00", "output_cost": "6.00", "context_window": 128000},
        {"provider": "mistral", "model_id": "codestral-latest", "display_name": "Codestral", "input_cost": "0.30", "output_cost": "0.90", "context_window": 32000},
    ]

    for model_data in models:
        provider = db.query(LLMProvider).filter(LLMProvider.name == model_data["provider"]).first()
        if provider:
            existing = db.query(LLMModel).filter(LLMModel.model_id == model_data["model_id"]).first()
            if not existing:
                db.add(LLMModel(
                    provider_id=provider.id,
                    model_id=model_data["model_id"],
                    display_name=model_data["display_name"],
                    input_cost_per_1k=Decimal(model_data["input_cost"]),
                    output_cost_per_1k=Decimal(model_data["output_cost"]),
                    context_window=model_data["context_window"],
                    is_active=True,
                ))

    db.commit()
```

And call these in `init_db()`:

```python
def init_db(db: Session) -> None:
    # ... existing code ...
    seed_llm_providers(db)
    seed_llm_models(db)
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_multi_provider.py -v -k "seeded"`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add apps/api/app/db/init_db.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): seed 5 providers and 10 models in init_db"
```

---

### Task 6: Update LLMConfig Schema for Provider Keys

**Files:**
- Modify: `apps/api/app/schemas/llm.py`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_multi_provider.py`:

```python
def test_llm_config_schema_accepts_provider_keys():
    """LLMConfigCreate schema should accept provider_api_keys."""
    from app.schemas.llm import LLMConfigCreate

    config = LLMConfigCreate(
        name="test",
        primary_model_id="00000000-0000-0000-0000-000000000001",
        provider_api_keys={"openai": "sk-test", "deepseek": "sk-deep"}
    )
    assert config.provider_api_keys["openai"] == "sk-test"
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_llm_config_schema_accepts_provider_keys -v`
Expected: FAIL (no provider_api_keys field in schema)

**Step 3: Add provider_api_keys to schema**

In `apps/api/app/schemas/llm.py`, add to LLMConfigCreate and LLMConfigUpdate:

```python
from typing import Optional, Dict

class LLMConfigCreate(BaseModel):
    name: str
    primary_model_id: uuid.UUID
    fallback_model_id: Optional[uuid.UUID] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096
    routing_rules: Optional[Dict] = None
    budget_limit_daily: Optional[float] = None
    budget_limit_monthly: Optional[float] = None
    provider_api_keys: Optional[Dict[str, str]] = None  # NEW


class LLMConfigUpdate(BaseModel):
    name: Optional[str] = None
    primary_model_id: Optional[uuid.UUID] = None
    fallback_model_id: Optional[uuid.UUID] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    routing_rules: Optional[Dict] = None
    budget_limit_daily: Optional[float] = None
    budget_limit_monthly: Optional[float] = None
    provider_api_keys: Optional[Dict[str, str]] = None  # NEW


class LLMConfig(BaseModel):
    # ... existing fields ...
    provider_api_keys: Optional[Dict[str, str]] = None  # NEW
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_llm_config_schema_accepts_provider_keys -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/schemas/llm.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): add provider_api_keys to LLM config schemas"
```

---

## Part B: API Integration

### Task 7: Create Provider Status Endpoint

**Files:**
- Modify: `apps/api/app/api/v1/llm.py`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_multi_provider.py`:

```python
def test_get_provider_status_returns_all_providers(client, auth_headers):
    """GET /llm/providers/status should return status of all providers."""
    response = client.get("/api/v1/llm/providers/status", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5

    provider_names = [p["name"] for p in data]
    assert "openai" in provider_names
    assert "anthropic" in provider_names

    # Each should have configured status
    for provider in data:
        assert "configured" in provider
        assert isinstance(provider["configured"], bool)
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_get_provider_status_returns_all_providers -v`
Expected: FAIL (404 endpoint not found)

**Step 3: Add endpoint to llm.py**

Add to `apps/api/app/api/v1/llm.py`:

```python
@router.get("/providers/status")
def get_provider_status(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get status of all LLM providers for current tenant."""
    from app.models.llm_provider import LLMProvider
    from app.models.llm_config import LLMConfig

    # Get all providers
    providers = db.query(LLMProvider).filter(LLMProvider.is_active == True).all()

    # Get tenant's LLM config to check which have keys configured
    config = db.query(LLMConfig).filter(
        LLMConfig.tenant_id == current_user.tenant_id,
        LLMConfig.is_tenant_default == True
    ).first()

    configured_keys = config.provider_api_keys if config and config.provider_api_keys else {}

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "display_name": p.display_name,
            "configured": p.name in configured_keys,
            "is_openai_compatible": p.is_openai_compatible,
        }
        for p in providers
    ]
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_get_provider_status_returns_all_providers -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/api/v1/llm.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): add GET /providers/status endpoint"
```

---

### Task 8: Add Set Provider Key Endpoint

**Files:**
- Modify: `apps/api/app/api/v1/llm.py`
- Test: `apps/api/tests/test_multi_provider.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_multi_provider.py`:

```python
def test_set_provider_key(client, auth_headers):
    """POST /llm/providers/{name}/key should set API key for provider."""
    response = client.post(
        "/api/v1/llm/providers/openai/key",
        headers=auth_headers,
        json={"api_key": "sk-test-key-12345"}
    )

    assert response.status_code == 200
    assert response.json()["success"] == True

    # Verify it's stored (via status endpoint)
    status = client.get("/api/v1/llm/providers/status", headers=auth_headers)
    openai_status = next(p for p in status.json() if p["name"] == "openai")
    assert openai_status["configured"] == True
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_set_provider_key -v`
Expected: FAIL (404 endpoint not found)

**Step 3: Add endpoint to llm.py**

Add to `apps/api/app/api/v1/llm.py`:

```python
from pydantic import BaseModel


class ProviderKeyInput(BaseModel):
    api_key: str


@router.post("/providers/{provider_name}/key")
def set_provider_key(
    provider_name: str,
    key_input: ProviderKeyInput,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Set API key for a provider."""
    from app.models.llm_config import LLMConfig

    # Get or create tenant's default config
    config = db.query(LLMConfig).filter(
        LLMConfig.tenant_id == current_user.tenant_id,
        LLMConfig.is_tenant_default == True
    ).first()

    if not config:
        # Create default config if none exists
        from app.models.llm_model import LLMModel
        default_model = db.query(LLMModel).first()
        config = LLMConfig(
            tenant_id=current_user.tenant_id,
            name="Default",
            is_tenant_default=True,
            primary_model_id=default_model.id if default_model else None,
            provider_api_keys={}
        )
        db.add(config)

    # Update provider key
    if config.provider_api_keys is None:
        config.provider_api_keys = {}

    # Create new dict to trigger SQLAlchemy change detection
    new_keys = dict(config.provider_api_keys)
    new_keys[provider_name] = key_input.api_key
    config.provider_api_keys = new_keys

    db.commit()

    return {"success": True, "provider": provider_name}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_multi_provider.py::test_set_provider_key -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/api/v1/llm.py apps/api/tests/test_multi_provider.py
git commit -m "feat(llm): add POST /providers/{name}/key endpoint for BYOK"
```

---

## Part C: Frontend Integration

### Task 9: Add Provider API Service

**Files:**
- Modify: `apps/web/src/services/llm.js`
- Test: Manual verification

**Step 1: Add provider API methods**

Update `apps/web/src/services/llm.js`:

```javascript
import api from './api';

export const llmService = {
  // ... existing methods ...

  getProviderStatus: async () => {
    const response = await api.get('/llm/providers/status');
    return response.data;
  },

  setProviderKey: async (providerName, apiKey) => {
    const response = await api.post(`/llm/providers/${providerName}/key`, {
      api_key: apiKey
    });
    return response.data;
  },

  getModels: async () => {
    const response = await api.get('/llm/models');
    return response.data;
  },
};

export default llmService;
```

**Step 2: Verify file is updated**

Run: `cat apps/web/src/services/llm.js`
Expected: Contains new methods

**Step 3: Commit**

```bash
git add apps/web/src/services/llm.js
git commit -m "feat(web): add provider status and key management to llm service"
```

---

### Task 10: Update LLMSettingsPage with Provider Cards

**Files:**
- Modify: `apps/web/src/pages/LLMSettingsPage.js`
- Test: Manual verification

**Step 1: Update LLMSettingsPage**

Replace content of `apps/web/src/pages/LLMSettingsPage.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { CpuFill, CheckCircleFill, XCircleFill, EyeFill, EyeSlashFill, KeyFill } from 'react-bootstrap-icons';
import llmService from '../services/llm';

const LLMSettingsPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingProvider, setSavingProvider] = useState(null);
  const [apiKeys, setApiKeys] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [saveSuccess, setSaveSuccess] = useState({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await llmService.getProviderStatus();
      setProviders(data);
    } catch (err) {
      setError('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyChange = (providerName, value) => {
    setApiKeys(prev => ({ ...prev, [providerName]: value }));
    setSaveSuccess(prev => ({ ...prev, [providerName]: false }));
  };

  const handleSaveKey = async (providerName) => {
    const key = apiKeys[providerName];
    if (!key) return;

    try {
      setSavingProvider(providerName);
      await llmService.setProviderKey(providerName, key);
      setSaveSuccess(prev => ({ ...prev, [providerName]: true }));
      setApiKeys(prev => ({ ...prev, [providerName]: '' }));
      await loadProviders();
    } catch (err) {
      setError(`Failed to save ${providerName} key`);
    } finally {
      setSavingProvider(null);
    }
  };

  const toggleShowKey = (providerName) => {
    setShowKeys(prev => ({ ...prev, [providerName]: !prev[providerName] }));
  };

  const getProviderIcon = (name) => {
    const icons = {
      openai: '🤖',
      anthropic: '🧠',
      deepseek: '🔍',
      google: '🌐',
      mistral: '💨'
    };
    return icons[name] || '🔌';
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <CpuFill size={28} className="text-primary me-3" />
        <div>
          <h2 className="mb-0">LLM Providers</h2>
          <p className="text-muted mb-0">Configure API keys for each provider</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row xs={1} md={2} lg={3} className="g-4">
        {providers.map((provider) => (
          <Col key={provider.name}>
            <Card className={`h-100 ${provider.configured ? 'border-success' : 'border-secondary'}`}>
              <Card.Header className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: '1.5rem' }}>
                    {getProviderIcon(provider.name)}
                  </span>
                  <strong>{provider.display_name}</strong>
                </div>
                {provider.configured ? (
                  <Badge bg="success" className="d-flex align-items-center">
                    <CheckCircleFill className="me-1" /> Connected
                  </Badge>
                ) : (
                  <Badge bg="secondary" className="d-flex align-items-center">
                    <XCircleFill className="me-1" /> Not configured
                  </Badge>
                )}
              </Card.Header>
              <Card.Body>
                <Form.Label className="small text-muted">
                  <KeyFill className="me-1" />
                  API Key
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showKeys[provider.name] ? 'text' : 'password'}
                    placeholder={provider.configured ? '••••••••••••' : 'Enter API key'}
                    value={apiKeys[provider.name] || ''}
                    onChange={(e) => handleKeyChange(provider.name, e.target.value)}
                    disabled={savingProvider === provider.name}
                  />
                  <InputGroup.Text
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleShowKey(provider.name)}
                  >
                    {showKeys[provider.name] ? <EyeSlashFill /> : <EyeFill />}
                  </InputGroup.Text>
                </InputGroup>

                {saveSuccess[provider.name] && (
                  <small className="text-success mt-2 d-block">
                    <CheckCircleFill className="me-1" /> Key saved successfully
                  </small>
                )}

                <div className="mt-3 d-grid">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSaveKey(provider.name)}
                    disabled={!apiKeys[provider.name] || savingProvider === provider.name}
                  >
                    {savingProvider === provider.name ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      'Save Key'
                    )}
                  </button>
                </div>
              </Card.Body>
              <Card.Footer className="text-muted small">
                {provider.is_openai_compatible ? 'OpenAI-compatible API' : 'Native API'}
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default LLMSettingsPage;
```

**Step 2: Verify file is updated**

Run: `head -50 apps/web/src/pages/LLMSettingsPage.js`
Expected: New content with provider cards

**Step 3: Commit**

```bash
git add apps/web/src/pages/LLMSettingsPage.js
git commit -m "feat(web): update LLMSettingsPage with provider cards and key management"
```

---

### Task 11: Run All Tests and Deploy

**Step 1: Run backend tests**

Run: `cd apps/api && pytest tests/test_multi_provider.py -v`
Expected: All tests PASS

**Step 2: Run frontend build**

Run: `cd apps/web && npm run build`
Expected: Build succeeds with no errors

**Step 3: Run E2E tests locally**

Run: `docker-compose up -d --build && sleep 30 && BASE_URL=http://localhost:8001 ./scripts/e2e_test_production.sh`
Expected: All tests pass

**Step 4: Commit final state**

```bash
git add -A
git commit -m "feat(llm): complete Phase 6 - Multi-Provider LLM Integration

- Add provider_api_keys to LLMConfig for BYOK support
- Create LLMProviderFactory for OpenAI-compatible clients
- Implement AnthropicAdapter with message conversion
- Add unified LLMService with router integration
- Seed 5 providers and 10 models
- Add provider status and key management API endpoints
- Update LLMSettingsPage with provider cards UI"
```

**Step 5: Deploy to production**

Run: `./scripts/deploy.sh`
Expected: Deploy succeeds, E2E tests pass

---

## Summary

| Task | Component | Description |
|------|-----------|-------------|
| 1 | Model | Add provider_api_keys to LLMConfig |
| 2 | Service | Create LLMProviderFactory |
| 3 | Service | Implement AnthropicAdapter |
| 4 | Service | Create unified LLMService |
| 5 | Database | Seed providers and models |
| 6 | Schema | Update LLM config schemas |
| 7 | API | Add provider status endpoint |
| 8 | API | Add set provider key endpoint |
| 9 | Frontend | Add provider API service |
| 10 | Frontend | Update LLMSettingsPage UI |
| 11 | Deploy | Run tests and deploy |

Total: 11 tasks
