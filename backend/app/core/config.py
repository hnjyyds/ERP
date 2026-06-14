from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Yuanjing Trade Management API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./.data/yuanjing.db"
    seed_demo_data: bool = True
    demo_user_id: str = "u-001"
    auth_secret_key: str = "dev-only-change-me"


@lru_cache
def get_settings() -> Settings:
    return Settings()
