from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.purchase.inquiries.repositories import PurchaseInquiryRepository
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.quotations.repositories import ExportQuotationRepository
from app.modules.sales.quotations.services import ExportQuotationService
from app.modules.sample.deliveries.repositories import SampleDeliveryRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


def get_export_quotation_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ExportQuotationService:
    return ExportQuotationService(
        ExportQuotationRepository(session),
        SampleDeliveryRepository(session),
        ExportContractRepository(session),
        PurchaseInquiryRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
