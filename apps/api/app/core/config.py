from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    project_name: str = "AgentProvision API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/agentprovision"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "changeme"
    access_token_expire_minutes: int = 30
    cors_origins: List[AnyHttpUrl | str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    seed_demo_data: bool = True
    integration_catalog: List[str] = Field(
        default_factory=lambda: [
            "OpenAI",
            "Anthropic",
            "Vertex AI",
            "Azure OpenAI",
            "Snowflake",
            "Databricks",
            "Salesforce",
            "ServiceNow",
            "Workday",
        ]
    )

    model_config = SettingsConfigDict(
        env_file=(".env",),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | List[AnyHttpUrl | str]) -> List[AnyHttpUrl | str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
