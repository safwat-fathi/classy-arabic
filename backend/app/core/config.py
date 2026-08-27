from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TijaratkBot"
    VERSION: str = "0.1.0"

    # Database Settings
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432

    # AI Tier Settings
    OPENROUTER_BASE_URL: str
    OPENROUTER_API_KEY: str
    OPENROUTER_PROVIDERS: list[str] = ["DeepSeek", "Fireworks", "Together"]
    DEEPSEEK_MODEL: str

    # Embeddings route (e.g. to a local Ollama or TEI server)
    EMBEDDING_BASE_URL: str
    EMBEDDING_API_KEY: str
    EMBEDDING_MODEL: str

    CLASSIFICATION_CONFIDENCE_THRESHOLD: float = 0.7
    CONTEXT_HISTORY_TURNS: int = 10
    DEEPSEEK_TEMPERATURE: float = 0.1
    AI_MAX_OUTPUT_TOKENS: int = 1024
    AI_REQUEST_TIMEOUT_SECONDS: float = 30.0
    AI_MAX_RETRIES: int = 2
    SQL_ECHO: bool = False
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Channel/Webhook Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_VERIFY_TOKEN: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WEBHOOK_URL: str = ""

    @property
    def sqlalchemy_database_uri(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
