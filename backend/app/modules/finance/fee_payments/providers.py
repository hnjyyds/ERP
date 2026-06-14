from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.fee_payments.repositories import FeePaymentRepository
from app.modules.finance.fee_payments.services import FeePaymentService
from app.modules.masterdata.partners.repositories import PartnerRepository
from app.modules.sales.shipments.repositories import ShipmentPlanRepository


def get_fee_payment_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FeePaymentService:
    return FeePaymentService(
        FeePaymentRepository(session),
        PartnerRepository(session),
        ShipmentPlanRepository(session),
    )
