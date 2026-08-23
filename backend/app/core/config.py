from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "classy-arabic"
    VERSION: str = "0.1.0"

    # Database Settings
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432

    # AI Tier Settings
    NILECHAT_BASE_URL: str
    NILECHAT_API_KEY: str
    NILECHAT_MODEL: str

    OPENROUTER_BASE_URL: str
    OPENROUTER_API_KEY: str
    OPENROUTER_PROVIDERS: list[str] = ["DeepSeek", "Fireworks", "Together"]
    DEEPSEEK_MODEL: str

    # Embeddings route through OpenRouter too (OPENROUTER_BASE_URL/OPENROUTER_API_KEY
    # above) rather than a separately self-hosted TEI endpoint.
    EMBEDDING_MODEL: str

    CLASSIFICATION_CONFIDENCE_THRESHOLD: float = 0.7
    NILECHAT_CONTEXT_TOKEN_BUDGET: int = 2048
    CONTEXT_HISTORY_TURNS: int = 10
    NILECHAT_TEMPERATURE: float = 0.1
    DEEPSEEK_TEMPERATURE: float = 0.1
    AI_REQUEST_TIMEOUT_SECONDS: float = 30.0
    AI_MAX_RETRIES: int = 2
    SQL_ECHO: bool = False
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @property
    def sqlalchemy_database_uri(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
