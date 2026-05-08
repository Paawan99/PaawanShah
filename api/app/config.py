from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Stardust Astrology API"
    environment: str = "development"

    ephe_path: str = "./ephe"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_chat_model: str = "gpt-4o-mini"

    cors_origins: str = "http://localhost:3000,https://paawanshah.vercel.app"

    rate_limit_per_minute: int = 30
    interpretation_cache_ttl_seconds: int = 60 * 60 * 24

    geocode_user_agent: str = "stardust-astrology-saas/0.1 (contact: paawan99@github)"


@lru_cache
def get_settings() -> Settings:
    return Settings()
