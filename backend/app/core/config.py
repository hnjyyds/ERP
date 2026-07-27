"""基础设施配置层：集中声明可由环境变量覆盖的应用配置。"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用启动配置；字段名自动映射为同名大写环境变量。"""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Yuanjing Trade Management API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./.data/yuanjing.db"
    seed_demo_data: bool = False
    demo_user_id: str = "u-001"
    auth_secret_key: str = "dev-only-change-me"
    mcp_credential_ttl_seconds: int = 30 * 24 * 60 * 60
    # 日志策略在配置层声明，业务模块不得自行读取环境变量。
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    log_format: Literal["json", "text"] = "json"
    log_slow_request_ms: int = Field(default=1_000, ge=0)
    log_health_requests: bool = False
    # 上传文件落地目录与对外访问前缀（本地对象存储；生产可挂载到对象存储卷）。
    upload_dir: str = "./.data/uploads"
    upload_url_prefix: str = "/uploads"
    upload_max_bytes: int = 5 * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
