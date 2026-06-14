from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.purchase.inquiries.repositories import PurchaseInquiryRepository
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.quotations.repositories import ExportQuotationRepository
from app.modules.sales.quotations.services import ExportQuotationService
from app.modules.sample.deliveries.repositories import SampleDeliveryRepository


def get_export_quotation_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ExportQuotationService:
    return ExportQuotationService(
        ExportQuotationRepository(session),
        SampleDeliveryRepository(session),
        ExportContractRepository(session),
        PurchaseInquiryRepository(session),
    )
