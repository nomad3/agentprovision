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
