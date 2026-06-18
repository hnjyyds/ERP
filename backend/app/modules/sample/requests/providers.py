from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.fee_payments.repositories import FeePaymentRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.requests.repositories import SampleRequestRepository
from app.modules.sample.requests.services import SampleRequestService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


async def get_sample_request_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SampleRequestService:
    return SampleRequestService(
        SampleRequestRepository(session),
        sample_record_repository=SampleRecordRepository(session),
        fee_payment_repository=FeePaymentRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
