"""应用装配层：连接基础设施、API 路由、生命周期任务和 MCP 挂载点。"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.api.error_handlers import register_error_handlers
from app.api.pagination import PaginationMiddleware, configure_pagination_openapi
from app.api.request_logging import RequestLoggingMiddleware
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.mcp.availability import McpAvailabilityMiddleware
from app.mcp.server import create_authenticated_mcp_app, mcp_http_app
from app.modules.finance.fee_payments import models as finance_fee_payment_models  # noqa: F401
from app.modules.finance.misc_fees import models as finance_misc_fee_models  # noqa: F401
from app.modules.finance.payments import models as finance_payment_models  # noqa: F401
from app.modules.finance.port_data import models as finance_port_data_models  # noqa: F401
from app.modules.finance.port_data.migrations import ensure_port_data_schema
from app.modules.finance.receipts import models as finance_receipt_models  # noqa: F401
from app.modules.finance.reimbursements import models as finance_reimbursement_models  # noqa: F401
from app.modules.finance.settlements import models as finance_settlement_models  # noqa: F401
from app.modules.finance.tax_refunds import models as finance_tax_refund_models  # noqa: F401
from app.modules.followup import models as followup_models  # noqa: F401
from app.modules.masterdata.customers import models as customer_models  # noqa: F401
from app.modules.masterdata.document_parties import models as document_party_models  # noqa: F401
from app.modules.masterdata.partners import models as partner_models  # noqa: F401
from app.modules.masterdata.products import models as product_models  # noqa: F401
from app.modules.masterdata.products.migrations import ensure_product_schema
from app.modules.masterdata.suppliers import models as supplier_models  # noqa: F401
from app.modules.purchase.contracts import models as purchase_contract_models  # noqa: F401
from app.modules.purchase.contracts.migrations import ensure_purchase_contract_schema
from app.modules.purchase.inquiries import models as purchase_inquiry_models  # noqa: F401
from app.modules.purchase.invoice_notices import (
    models as purchase_invoice_notice_models,  # noqa: F401
)
from app.modules.quality.inspections import models as quality_inspection_models  # noqa: F401
from app.modules.quality.inspections.migrations import ensure_quality_inspection_schema
from app.modules.sales.contracts import models as contract_models  # noqa: F401
from app.modules.sales.quotations import models as quotation_models  # noqa: F401
from app.modules.sales.shipments import models as shipment_models  # noqa: F401
from app.modules.sample.deliveries import models as sample_delivery_models  # noqa: F401
from app.modules.sample.records import models as sample_record_models  # noqa: F401
from app.modules.sample.requests import models as sample_request_models  # noqa: F401
from app.modules.system.approval_assignments.migrations import (
    ensure_approval_assignment_schema,
)
from app.modules.system.auth import models as auth_models  # noqa: F401
from app.modules.system.auth.migrations import ensure_auth_schema
from app.modules.system.auth.seed import seed_system_demo_data
from app.modules.system.company import models as company_models  # noqa: F401
from app.modules.system.company.migrations import ensure_company_schema
from app.modules.system.company.seed import seed_company_default
from app.modules.system.dashboard import models as dashboard_models  # noqa: F401
from app.modules.system.dashboard.migrations import ensure_dashboard_schema
from app.modules.system.dashboard.seed import seed_dashboard_demo_data
from app.modules.system.mcp_settings import models as mcp_settings_models  # noqa: F401
from app.modules.system.mcp_settings.migrations import ensure_mcp_settings_schema
from app.modules.warehouse.inbound_orders import models as inbound_order_models  # noqa: F401
from app.modules.warehouse.inbound_orders.migrations import ensure_inbound_order_schema
from app.modules.warehouse.inbound_plans import models as inbound_plan_models  # noqa: F401
from app.modules.warehouse.outbound_orders import models as outbound_order_models  # noqa: F401
from app.modules.warehouse.outbound_plans import models as outbound_plan_models  # noqa: F401

_lifecycle_logger = logging.getLogger("app.lifecycle")


async def initialize_database_schema() -> None:
    """Initialize tables safely when multiple API replicas start together."""
    for attempt in range(3):
        try:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
                await connection.run_sync(ensure_auth_schema)
                await connection.run_sync(ensure_approval_assignment_schema)
                await connection.run_sync(ensure_dashboard_schema)
                await connection.run_sync(ensure_product_schema)
                await connection.run_sync(ensure_company_schema)
                await connection.run_sync(ensure_port_data_schema)
                await connection.run_sync(ensure_purchase_contract_schema)
                await connection.run_sync(ensure_quality_inspection_schema)
                await connection.run_sync(ensure_inbound_order_schema)
                await connection.run_sync(ensure_mcp_settings_schema)
            return
        except OperationalError as exc:
            message = str(exc).lower()
            concurrent_create = "already exists" in message or "duplicate column name" in message
            if not concurrent_create or attempt == 2:
                _lifecycle_logger.exception(
                    "database schema initialization failed",
                    extra={
                        "event": "database_schema_initialization_failed",
                        "attempt": attempt + 1,
                    },
                )
                raise
            _lifecycle_logger.warning(
                "database schema initialization will retry",
                extra={
                    "event": "database_schema_initialization_retry",
                    "attempt": attempt + 1,
                },
            )


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

    if settings.seed_demo_data:
        async with SessionLocal() as session:
            await seed_system_demo_data(session)
            await seed_dashboard_demo_data(session, user_id=settings.demo_user_id)
            await seed_company_default(session)
        _lifecycle_logger.info(
            "demo data ready",
            extra={"event": "demo_data_ready"},
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
