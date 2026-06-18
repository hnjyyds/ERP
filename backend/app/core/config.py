from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Yuanjing Trade Management API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./.data/yuanjing.db"
    seed_demo_data: bool = False
    demo_user_id: str = "u-001"
    auth_secret_key: str = "dev-only-change-me"
    # 上传文件落地目录与对外访问前缀（本地对象存储；生产可挂载到对象存储卷）。
    upload_dir: str = "./.data/uploads"
    upload_url_prefix: str = "/uploads"
    upload_max_bytes: int = 5 * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
