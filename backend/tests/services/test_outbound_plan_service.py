from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.shipments.repositories import ShipmentPlanRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.outbound_plans.repositories import OutboundPlanRepository
from app.modules.warehouse.outbound_plans.schemas import (
    OutboundPlanGenerateFromShipment,
    OutboundPlanSchedule,
)
from app.modules.warehouse.outbound_plans.services import (
    OutboundPlanService,
    PermissionDeniedError,
)


def _user(
    permissions: list[str],
    *,
    user_id: str = "u-001",
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username=user_id,
        display_name="演示业务主管",
        department_name="业务部",
        roles=["业务主管"],
        permissions=permissions,
    )


def _warehouse_user() -> CurrentUserResponse:
    return _user(
        [
            "warehouse:outbound_plan:view",
            "warehouse:outbound_plan:edit",
            "warehouse:outbound_plan:view_all",
        ]
    )


async def _prepare_shipment(
    session: AsyncSession,
    *,
    approval_status: str = "approved",
) -> str:
    repository = ShipmentPlanRepository(session)
    plan = await repository.create_plan(
        code=f"SP-OP-{approval_status}",
        shipment_date=date(2026, 8, 18),
        planned_ship_date=date(2026, 8, 20),
        customer_id="customer-euro-home",
        customer_name="欧陆家居用品有限公司",
        currency="USD",
        shipping_method="sea",
        port_of_loading="Ningbo",
        port_of_destination="Hamburg",
        vessel_name="COSCO Star",
        container_no="CONT-OP",
        booking_no="BOOK-OP",
        document_owner_name="单证部",
        payable_amount="780.00",
        remarks="出库计划服务测试",
        approval_status=approval_status,
        owner_user_id="u-001",
    )
    await repository.add_line(
        shipment_id=plan.id,
        contract_id="contract-001",
        contract_no="EC-001",
        contract_line_id="contract-line-001",
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="300",
        unit="pcs",
        unit_price="1.4",
        amount="420.00",
        planned_ship_date=date(2026, 8, 20),
    )
    await repository.refresh_finance(plan.id)
    return plan.id


def _payload(shipment_plan_id: str) -> OutboundPlanGenerateFromShipment:
    return OutboundPlanGenerateFromShipment(
        shipment_plan_id=shipment_plan_id,
        outbound_type="finished_goods_outbound",
        planned_date=None,
    )


async def test_outbound_plan_service_generates_from_approved_shipment_and_schedules(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        shipment_id = await _prepare_shipment(session)
        service = OutboundPlanService(
            outbound_repository=OutboundPlanRepository(session),
            shipment_repository=ShipmentPlanRepository(session),
        )

        plan = await service.generate_from_shipment(
            current_user=_warehouse_user(),
            payload=_payload(shipment_id),
        )
        scheduled = await service.schedule_plan(
            current_user=_warehouse_user(),
            plan_id=plan.id,
            payload=OutboundPlanSchedule(
                planned_date=date(2026, 8, 18),
                warehouse_id="wh-ningbo",
                warehouse_name="宁波总仓",
                location_id="loc-fg-01",
                location_name="成品区 A-01",
                operator_name="仓库主管",
            ),
        )
        listed = await service.list_plans(
            current_user=_warehouse_user(),
            q="BAG-40",
            status="scheduled",
            outbound_type="finished_goods_outbound",
            source_type="shipment_plan",
            customer_id=None,
            source_id=None,
        )

    assert plan.code.startswith("OP-SP-OP-approved")
    assert plan.status == "planned"
    assert plan.planned_date == date(2026, 8, 20)
    assert plan.lines[0].planned_quantity == "300"
    assert scheduled.status == "scheduled"
    assert scheduled.location_name == "成品区 A-01"
    assert listed.total == 1
    assert listed.items[0].source_code == "SP-OP-approved"


async def test_outbound_plan_service_rejects_unapproved_shipment(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        shipment_id = await _prepare_shipment(session, approval_status="draft")
        service = OutboundPlanService(
            outbound_repository=OutboundPlanRepository(session),
            shipment_repository=ShipmentPlanRepository(session),
        )

        with pytest.raises(ValueError):
            await service.generate_from_shipment(
                current_user=_warehouse_user(),
                payload=_payload(shipment_id),
            )


async def test_outbound_plan_service_requires_view_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = OutboundPlanService(
            outbound_repository=OutboundPlanRepository(session),
            shipment_repository=ShipmentPlanRepository(session),
        )

        with pytest.raises(PermissionDeniedError):
            await service.list_plans(
                current_user=_user(["warehouse:outbound_plan:edit"]),
                q=None,
                status=None,
                outbound_type=None,
                source_type=None,
                customer_id=None,
                source_id=None,
            )
