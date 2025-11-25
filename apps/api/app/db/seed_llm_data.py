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
        },
        {
            "name": "google",
            "display_name": "Google Gemini",
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "auth_type": "api_key",
            "supported_features": {"streaming": True, "function_calling": True, "vision": True}
        },
        {
            "name": "mistral",
            "display_name": "Mistral AI",
            "base_url": "https://api.mistral.ai/v1",
            "auth_type": "api_key",
            "supported_features": {"streaming": True, "function_calling": True}
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
    deepseek = db.query(LLMProvider).filter(LLMProvider.name == "deepseek").first()
    google = db.query(LLMProvider).filter(LLMProvider.name == "google").first()
    mistral = db.query(LLMProvider).filter(LLMProvider.name == "mistral").first()

    models = []

    # Anthropic Models
    if anthropic:
        models.extend([
            {
                "provider_id": anthropic.id,
                "model_id": "claude-3-5-sonnet-20240620",
                "display_name": "Claude 3.5 Sonnet",
                "context_window": 200000,
                "input_cost_per_1k": 0.003,
                "output_cost_per_1k": 0.015,
                "speed_tier": "standard",
                "quality_tier": "best",
                "capabilities": {"vision": True, "coding": True}
            },
            {
                "provider_id": anthropic.id,
                "model_id": "claude-3-opus-20240229",
                "display_name": "Claude 3 Opus",
                "context_window": 200000,
                "input_cost_per_1k": 0.015,
                "output_cost_per_1k": 0.075,
                "speed_tier": "slow",
                "quality_tier": "best",
                "capabilities": {"vision": True, "reasoning": True}
            },
            {
                "provider_id": anthropic.id,
                "model_id": "claude-3-haiku-20240307",
                "display_name": "Claude 3 Haiku",
                "context_window": 200000,
                "input_cost_per_1k": 0.00025,
                "output_cost_per_1k": 0.00125,
                "speed_tier": "fast",
                "quality_tier": "good",
                "capabilities": {"vision": True}
            }
        ])

    # OpenAI Models
    if openai:
        models.extend([
            {
                "provider_id": openai.id,
                "model_id": "gpt-4o",
                "display_name": "GPT-4o",
                "context_window": 128000,
                "input_cost_per_1k": 0.0025,
                "output_cost_per_1k": 0.01,
                "speed_tier": "fast",
                "quality_tier": "best",
                "capabilities": {"vision": True, "coding": True}
            },
            {
                "provider_id": openai.id,
                "model_id": "gpt-4o-mini",
                "display_name": "GPT-4o Mini",
                "context_window": 128000,
                "input_cost_per_1k": 0.00015,
                "output_cost_per_1k": 0.0006,
                "speed_tier": "fast",
                "quality_tier": "good",
                "capabilities": {"vision": True}
            }
        ])

    # DeepSeek Models
    if deepseek:
        models.extend([
            {
                "provider_id": deepseek.id,
                "model_id": "deepseek-coder",
                "display_name": "DeepSeek Coder V2",
                "context_window": 128000,
                "input_cost_per_1k": 0.00014,
                "output_cost_per_1k": 0.00028,
                "speed_tier": "standard",
                "quality_tier": "good",
                "capabilities": {"coding": True}
            },
            {
                "provider_id": deepseek.id,
                "model_id": "deepseek-chat",
                "display_name": "DeepSeek V2.5",
                "context_window": 128000,
                "input_cost_per_1k": 0.00014,
                "output_cost_per_1k": 0.00028,
                "speed_tier": "standard",
                "quality_tier": "good",
                "capabilities": {"reasoning": True}
            }
        ])

    for m in models:
        existing = db.query(LLMModel).filter(LLMModel.model_id == m["model_id"]).first()
        if not existing:
            model = LLMModel(**m)
            db.add(model)

    db.commit()
