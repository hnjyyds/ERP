"""应用装配层：连接基础设施、API 路由、生命周期任务和 MCP 挂载点。"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.api.error_handlers import register_error_handlers
from app.api.language import LanguageMiddleware
from app.api.pagination import PaginationMiddleware, configure_pagination_openapi
from app.api.request_logging import RequestLoggingMiddleware
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db import model_registry  # noqa: F401
from app.db.migrate import run_migrations
from app.db.session import SessionLocal
from app.mcp.availability import McpAvailabilityMiddleware
from app.mcp.server import create_authenticated_mcp_app, mcp_http_app
from app.modules.system.auth.seed import (
    seed_admin_account,
    seed_system_base_data,
    seed_system_demo_data,
)
from app.modules.system.company.seed import seed_company_default
from app.modules.system.dashboard.seed import seed_dashboard_demo_data

_lifecycle_logger = logging.getLogger("app.lifecycle")


async def initialize_database_schema() -> None:
    """按 Alembic 版本升级数据库结构；未标记基线的旧库需先执行 stamp-existing。"""
    try:
        await run_migrations()
    except Exception:
        _lifecycle_logger.exception(
            "database migration failed",
            extra={"event": "database_migration_failed"},
        )
        raise


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """按依赖顺序初始化数据库、演示数据和 MCP，并记录服务生命周期事件。"""
    settings = get_settings()
    _lifecycle_logger.info(
        "service starting",
        extra={
            "event": "service_starting",
            "app_name": settings.app_name,
            "seed_demo_data": settings.seed_demo_data,
        },
    )
    await initialize_database_schema()
    _lifecycle_logger.info(
        "database schema ready",
        extra={"event": "database_schema_ready"},
    )

    async with SessionLocal() as session:
        await seed_system_base_data(session)
        await seed_admin_account(
            session,
            username=settings.admin_username,
            password=settings.admin_password,
            display_name=settings.admin_display_name,
            reset_password=settings.admin_password_reset,
        )
        if settings.seed_demo_data:
            await seed_system_demo_data(session)
            await seed_dashboard_demo_data(session, user_id=settings.demo_user_id)
            await seed_company_default(session)
    _lifecycle_logger.info(
        "system data ready",
        extra={"event": "system_data_ready"},
    )

    try:
        async with mcp_http_app.router.lifespan_context(mcp_http_app):
            _lifecycle_logger.info(
                "service ready",
                extra={"event": "service_ready"},
            )
            yield
    finally:
        _lifecycle_logger.info(
            "service stopped",
            extra={"event": "service_stopped"},
        )


def create_app(
    *,
    mcp_session_factory: async_sessionmaker[AsyncSession] = SessionLocal,
) -> FastAPI:
    """创建 FastAPI 应用，并按 HTTP 边界顺序注册日志、异常和业务路由。"""
    settings = get_settings()
    # 日志必须先于应用和生命周期对象配置，保证启动失败也使用统一格式。
    configure_logging(level=settings.log_level, format_name=settings.log_format)
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    register_error_handlers(app)
    app.add_middleware(PaginationMiddleware)
    # 请求日志位于 HTTP 边界，覆盖 API、上传文件和最后挂载的 MCP 应用。
    app.add_middleware(
        RequestLoggingMiddleware,
        slow_request_ms=settings.log_slow_request_ms,
        log_health_requests=settings.log_health_requests,
    )
    # 语言协商位于最外层，保证日志与异常处理阶段都能拿到当前请求语言。
    app.add_middleware(LanguageMiddleware)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    configure_pagination_openapi(app)
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount(
        settings.upload_url_prefix,
        StaticFiles(directory=str(upload_dir)),
        name="uploads",
    )
    # Keep this catch-all mount last so FastAPI API/static routes retain priority.
    app.mount(
        "/",
        McpAvailabilityMiddleware(
            create_authenticated_mcp_app(mcp_session_factory),
            session_factory=mcp_session_factory,
        ),
        name="mcp",
    )
    return app


app = create_app()
