from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/agentprovision"
    DATA_STORAGE_PATH: str = "/app/storage"

    class Config:
        env_file = ".env"

settings = Settings()
