from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.payments.repositories import PaymentRepository
from app.modules.finance.payments.services import PaymentService
from app.modules.purchase.invoice_notices.repositories import PurchaseInvoiceNoticeRepository


def get_payment_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PaymentService:
    return PaymentService(
        PaymentRepository(session),
        PurchaseInvoiceNoticeRepository(session),
    )
