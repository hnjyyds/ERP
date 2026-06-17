from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.sales.shipments.repositories import ShipmentPlanRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.warehouse.inbound_orders.repositories import InboundOrderRepository
from app.modules.warehouse.outbound_orders.repositories import OutboundOrderRepository
from app.modules.warehouse.outbound_orders.services import OutboundOrderService
from app.modules.warehouse.outbound_plans.repositories import OutboundPlanRepository


def get_outbound_order_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OutboundOrderService:
    purchase_contract_repository = PurchaseContractRepository(session)
    data_scope_resolver = DataScopeResolver(AuthRepository(session))
    return OutboundOrderService(
        outbound_order_repository=OutboundOrderRepository(session),
        outbound_plan_repository=OutboundPlanRepository(session),
        inventory_repository=InboundOrderRepository(session),
        shipment_repository=ShipmentPlanRepository(session),
        purchase_contract_repository=purchase_contract_repository,
        followup_service=FollowupService(
            followup_repository=FollowupRepository(session),
            purchase_contract_repository=purchase_contract_repository,
            sample_record_repository=SampleRecordRepository(session),
            data_scope_resolver=data_scope_resolver,
        ),
        data_scope_resolver=data_scope_resolver,
    )
