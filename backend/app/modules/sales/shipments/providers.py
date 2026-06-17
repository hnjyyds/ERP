from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.shipments.repositories import ShipmentPlanRepository
from app.modules.sales.shipments.services import ShipmentPlanService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


def get_shipment_plan_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ShipmentPlanService:
    return ShipmentPlanService(
        ShipmentPlanRepository(session),
        ExportContractRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
