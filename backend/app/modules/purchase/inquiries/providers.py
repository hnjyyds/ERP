from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.purchase.inquiries.repositories import PurchaseInquiryRepository
from app.modules.purchase.inquiries.services import PurchaseInquiryService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


def get_purchase_inquiry_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PurchaseInquiryService:
    return PurchaseInquiryService(
        PurchaseInquiryRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
