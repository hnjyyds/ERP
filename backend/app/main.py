from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.modules.finance.fee_payments import models as finance_fee_payment_models  # noqa: F401
from app.modules.finance.misc_fees import models as finance_misc_fee_models  # noqa: F401
from app.modules.finance.payments import models as finance_payment_models  # noqa: F401
from app.modules.finance.receipts import models as finance_receipt_models  # noqa: F401
from app.modules.finance.settlements import models as finance_settlement_models  # noqa: F401
from app.modules.finance.tax_refunds import models as finance_tax_refund_models  # noqa: F401
from app.modules.followup import models as followup_models  # noqa: F401
from app.modules.masterdata.customers import models as customer_models  # noqa: F401
from app.modules.masterdata.document_parties import models as document_party_models  # noqa: F401
from app.modules.masterdata.partners import models as partner_models  # noqa: F401
from app.modules.masterdata.products import models as product_models  # noqa: F401
from app.modules.masterdata.suppliers import models as supplier_models  # noqa: F401
from app.modules.purchase.contracts import models as purchase_contract_models  # noqa: F401
from app.modules.purchase.inquiries import models as purchase_inquiry_models  # noqa: F401
from app.modules.purchase.invoice_notices import (
    models as purchase_invoice_notice_models,  # noqa: F401
)
from app.modules.quality.inspections import models as quality_inspection_models  # noqa: F401
from app.modules.sales.contracts import models as contract_models  # noqa: F401
from app.modules.sales.quotations import models as quotation_models  # noqa: F401
from app.modules.sales.shipments import models as shipment_models  # noqa: F401
from app.modules.sample.deliveries import models as sample_delivery_models  # noqa: F401
from app.modules.sample.records import models as sample_record_models  # noqa: F401
from app.modules.sample.requests import models as sample_request_models  # noqa: F401
from app.modules.system.auth import models as auth_models  # noqa: F401
from app.modules.system.auth.seed import seed_system_demo_data
from app.modules.system.dashboard import models as dashboard_models  # noqa: F401
from app.modules.system.dashboard.migrations import ensure_dashboard_schema
from app.modules.system.dashboard.seed import seed_dashboard_demo_data
from app.modules.warehouse.inbound_orders import models as inbound_order_models  # noqa: F401
from app.modules.warehouse.inbound_plans import models as inbound_plan_models  # noqa: F401
from app.modules.warehouse.outbound_orders import models as outbound_order_models  # noqa: F401
from app.modules.warehouse.outbound_plans import models as outbound_plan_models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await connection.run_sync(ensure_dashboard_schema)

    if settings.seed_demo_data:
        async with SessionLocal() as session:
            await seed_system_demo_data(session)
            await seed_dashboard_demo_data(session, user_id=settings.demo_user_id)

    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
