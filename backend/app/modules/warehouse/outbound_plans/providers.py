from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.sales.shipments.repositories import ShipmentPlanRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.warehouse.outbound_plans.repositories import OutboundPlanRepository
from app.modules.warehouse.outbound_plans.services import OutboundPlanService


def get_outbound_plan_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OutboundPlanService:
    return OutboundPlanService(
        outbound_repository=OutboundPlanRepository(session),
        shipment_repository=ShipmentPlanRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
