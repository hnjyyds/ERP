from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.quality.inspections.repositories import QualityInspectionRepository
from app.modules.quality.inspections.services import QualityInspectionService
from app.modules.sample.records.repositories import SampleRecordRepository


def get_quality_inspection_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QualityInspectionService:
    purchase_contract_repository = PurchaseContractRepository(session)
    return QualityInspectionService(
        quality_repository=QualityInspectionRepository(session),
        purchase_contract_repository=purchase_contract_repository,
        followup_service=FollowupService(
            followup_repository=FollowupRepository(session),
            purchase_contract_repository=purchase_contract_repository,
            sample_record_repository=SampleRecordRepository(session),
        ),
    )
