from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.tax_refunds.repositories import TaxRefundRepository
from app.modules.finance.tax_refunds.services import TaxRefundService
from app.modules.sales.shipments.repositories import ShipmentPlanRepository


def get_tax_refund_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TaxRefundService:
    return TaxRefundService(
        TaxRefundRepository(session),
        ShipmentPlanRepository(session),
    )
