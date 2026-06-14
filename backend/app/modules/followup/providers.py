from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.sample.records.repositories import SampleRecordRepository


def get_followup_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FollowupService:
    return FollowupService(
        followup_repository=FollowupRepository(session),
        purchase_contract_repository=PurchaseContractRepository(session),
        sample_record_repository=SampleRecordRepository(session),
    )
