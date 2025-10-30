from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/agentprovision"
    DATA_STORAGE_PATH: str = "/app/storage"
    TEMPORAL_ADDRESS: str | None = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"

    DEFAULT_WORKFLOW_TIMEOUT_SECONDS: int = 600

    # MCP Server Configuration
    MCP_SERVER_URL: str = "http://localhost:8085"
    MCP_API_KEY: str = "dev_mcp_key"  # Change in production
    MCP_ENABLED: bool = True  # Feature flag for MCP/Databricks integration

    # LLM Configuration
    ANTHROPIC_API_KEY: str | None = None
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    LLM_MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.7

    class Config:
        env_file = ".env"

settings = Settings()
