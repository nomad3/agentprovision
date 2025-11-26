# Phase 6: Multi-Provider LLM Integration Design

**Date:** 2025-11-26
**Status:** Approved
**Author:** Design Session with Claude

## Overview

Add support for 5 major LLM providers using OpenAI-compatible interface with BYOK (Bring Your Own Key) model for tenant API key management.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Providers | OpenAI, Anthropic, DeepSeek, Google, Mistral | Full coverage of major providers |
| Interface | OpenAI-compatible | Simpler, most providers support it |
| Key Management | BYOK | Tenants manage their own provider relationships |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LLMRouter (existing)                                        │
│  - select_model() returns LLMModel with provider info        │
│  - estimate_cost() calculates based on model pricing         │
│  - track_usage() records to TenantAnalytics                  │
├─────────────────────────────────────────────────────────────┤
│  LLMProviderFactory (NEW)                                    │
│  - get_client(provider_name, api_key) → OpenAI-client        │
│  - Configures base_url per provider                          │
├─────────────────────────────────────────────────────────────┤
│  Provider Endpoints (OpenAI-compatible)                      │
│  ├── OpenAI:     api.openai.com                              │
│  ├── Anthropic:  api.anthropic.com (via adapter)             │
│  ├── DeepSeek:   api.deepseek.com                            │
│  ├── Google:     generativelanguage.googleapis.com           │
│  └── Mistral:    api.mistral.ai                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Provider Configuration (Seed Data)

```python
PROVIDERS = [
    {"name": "openai", "api_base_url": "https://api.openai.com/v1", "is_openai_compatible": True},
    {"name": "anthropic", "api_base_url": "https://api.anthropic.com/v1", "is_openai_compatible": False},
    {"name": "deepseek", "api_base_url": "https://api.deepseek.com/v1", "is_openai_compatible": True},
    {"name": "google", "api_base_url": "https://generativelanguage.googleapis.com/v1beta/openai", "is_openai_compatible": True},
    {"name": "mistral", "api_base_url": "https://api.mistral.ai/v1", "is_openai_compatible": True},
]
```

### LLMConfig Extension

```python
# Add to existing LLMConfig model
provider_api_keys = Column(JSON, nullable=True)  # {"openai": "sk-...", "deepseek": "sk-..."}
```

### Seed Models

```python
MODELS = [
    # OpenAI
    {"provider": "openai", "model_id": "gpt-4o", "input_cost": 2.50, "output_cost": 10.00},
    {"provider": "openai", "model_id": "gpt-4o-mini", "input_cost": 0.15, "output_cost": 0.60},
    # DeepSeek
    {"provider": "deepseek", "model_id": "deepseek-chat", "input_cost": 0.14, "output_cost": 0.28},
    {"provider": "deepseek", "model_id": "deepseek-coder", "input_cost": 0.14, "output_cost": 0.28},
    # Anthropic
    {"provider": "anthropic", "model_id": "claude-sonnet-4-20250514", "input_cost": 3.00, "output_cost": 15.00},
    # Google
    {"provider": "google", "model_id": "gemini-1.5-pro", "input_cost": 1.25, "output_cost": 5.00},
    # Mistral
    {"provider": "mistral", "model_id": "mistral-large-latest", "input_cost": 2.00, "output_cost": 6.00},
]
```

## Implementation

### LLMProviderFactory

```python
# apps/api/app/services/llm/provider_factory.py
from openai import OpenAI
import anthropic

class LLMProviderFactory:
    """Creates configured LLM clients for each provider."""

    PROVIDER_CONFIGS = {
        "openai": {"base_url": "https://api.openai.com/v1"},
        "deepseek": {"base_url": "https://api.deepseek.com/v1"},
        "mistral": {"base_url": "https://api.mistral.ai/v1"},
        "google": {"base_url": "https://generativelanguage.googleapis.com/v1beta/openai"},
    }

    def get_client(self, provider_name: str, api_key: str):
        if provider_name == "anthropic":
            return AnthropicAdapter(api_key)

        config = self.PROVIDER_CONFIGS.get(provider_name)
        return OpenAI(api_key=api_key, base_url=config["base_url"])
```

### AnthropicAdapter

```python
# apps/api/app/services/llm/anthropic_adapter.py
class AnthropicAdapter:
    """Adapts Anthropic SDK to OpenAI-like interface."""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.chat = self.Chat(self.client)

    class Chat:
        def __init__(self, client):
            self.client = client
            self.completions = self.Completions(client)

        class Completions:
            def __init__(self, client):
                self.client = client

            def create(self, messages, model, max_tokens=4096, **kwargs):
                # Convert OpenAI format → Anthropic format
                system = None
                anthropic_messages = []

                for msg in messages:
                    if msg["role"] == "system":
                        system = msg["content"]
                    else:
                        anthropic_messages.append(msg)

                response = self.client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    system=system,
                    messages=anthropic_messages,
                )

                # Return OpenAI-compatible response
                return OpenAICompatibleResponse(response)
```

### Updated LLMService

```python
# apps/api/app/services/llm/service.py
class LLMService:
    def __init__(self, db: Session, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
        self.router = LLMRouter(db)
        self.factory = LLMProviderFactory()

    def generate_response(self, messages, task_type=None, **kwargs):
        # 1. Router selects optimal model
        model = self.router.select_model(self.tenant_id, task_type)

        # 2. Get tenant's API key for this provider
        config = self.router.get_tenant_config(self.tenant_id)
        api_key = self._get_api_key(config, model.provider.name)

        # 3. Factory creates provider client
        client = self.factory.get_client(model.provider.name, api_key)

        # 4. Make request
        response = client.chat.completions.create(
            model=model.model_id,
            messages=messages,
            **kwargs
        )

        # 5. Track usage
        self.router.track_usage(
            tenant_id=self.tenant_id,
            model_id=model.id,
            tokens_input=response.usage.prompt_tokens,
            tokens_output=response.usage.completion_tokens,
            cost=self.router.estimate_cost(model, response.usage.prompt_tokens, response.usage.completion_tokens)
        )

        return response

    def _get_api_key(self, config, provider_name):
        if config.provider_api_keys:
            return config.provider_api_keys.get(provider_name)
        return None
```

## Frontend Updates

### LLMSettingsPage Enhancement

- Provider cards with connection status
- Per-provider API key input fields (masked, encrypted)
- Model selection per provider with pricing
- Usage stats per provider

## Testing

- Unit tests for AnthropicAdapter message conversion
- Integration tests for each provider (mocked)
- E2E test verifying provider switching

## File Structure

```
apps/api/app/services/llm/
├── __init__.py
├── router.py           # Existing
├── legacy_service.py   # Deprecated, to be replaced
├── service.py          # NEW: Unified LLM service
├── provider_factory.py # NEW: Creates provider clients
└── anthropic_adapter.py # NEW: Anthropic → OpenAI adapter
```

## Success Metrics

- 30% cost reduction via smart routing to cheaper providers
- <500ms latency for provider selection
- 99.9% availability with automatic fallback
