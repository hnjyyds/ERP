from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.warehouse.inbound_plans.repositories import InboundPlanRepository
from app.modules.warehouse.inbound_plans.services import InboundPlanService


def get_inbound_plan_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InboundPlanService:
    return InboundPlanService(
        inbound_repository=InboundPlanRepository(session),
        purchase_contract_repository=PurchaseContractRepository(session),
    )
