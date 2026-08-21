from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "classy-arabic"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "safwat"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "classy_arabic"
    POSTGRES_PORT: int = 5432

    # AI Tier Settings
    NILECHAT_BASE_URL: str = "http://localhost:8001/v1"
    NILECHAT_API_KEY: str = "EMPTY"
    NILECHAT_MODEL: str = "MBZUAI-Paris/Nile-Chat-4B"

    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_API_KEY: str = ""
    DEEPSEEK_MODEL: str = "deepseek/deepseek-v4-flash"

    EMBEDDING_BASE_URL: str = "http://localhost:8002/v1"
    EMBEDDING_API_KEY: str = "EMPTY"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"

    CLASSIFICATION_CONFIDENCE_THRESHOLD: float = 0.7
    NILECHAT_CONTEXT_TOKEN_BUDGET: int = 2048
    CONTEXT_HISTORY_TURNS: int = 10

    @property
    def sqlalchemy_database_uri(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
