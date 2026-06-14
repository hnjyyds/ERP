from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.purchase.invoice_notices.repositories import PurchaseInvoiceNoticeRepository
from app.modules.purchase.invoice_notices.services import PurchaseInvoiceNoticeService


def get_purchase_invoice_notice_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PurchaseInvoiceNoticeService:
    return PurchaseInvoiceNoticeService(
        repository=PurchaseInvoiceNoticeRepository(session),
    )
