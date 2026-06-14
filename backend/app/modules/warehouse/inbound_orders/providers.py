from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.quality.inspections.repositories import QualityInspectionRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.warehouse.inbound_orders.repositories import InboundOrderRepository
from app.modules.warehouse.inbound_orders.services import InboundOrderService
from app.modules.warehouse.inbound_plans.repositories import InboundPlanRepository


def get_inbound_order_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InboundOrderService:
    purchase_contract_repository = PurchaseContractRepository(session)
    return InboundOrderService(
        inbound_repository=InboundOrderRepository(session),
        inbound_plan_repository=InboundPlanRepository(session),
        purchase_contract_repository=purchase_contract_repository,
        quality_repository=QualityInspectionRepository(session),
        followup_service=FollowupService(
            followup_repository=FollowupRepository(session),
            purchase_contract_repository=purchase_contract_repository,
            sample_record_repository=SampleRecordRepository(session),
        ),
    )
