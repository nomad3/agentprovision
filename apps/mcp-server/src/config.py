"""
MCP Server Configuration
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """MCP Server settings loaded from environment"""

    # ServiceTsunami API
    API_BASE_URL: str = "http://localhost:8001"
    API_INTERNAL_KEY: str = "internal-service-key"

    # Databricks
    DATABRICKS_HOST: str = ""
    DATABRICKS_TOKEN: str = ""
    DATABRICKS_WAREHOUSE_ID: str = ""
    DATABRICKS_CATALOG_PREFIX: str = "tenant_"

    # MCP Server (port 8086 to avoid conflict with dental-erp MCP on 8085)
    MCP_PORT: int = 8086
    MCP_TRANSPORT: str = "streamable-http"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow FASTMCP_* and other extra env vars


settings = Settings()
