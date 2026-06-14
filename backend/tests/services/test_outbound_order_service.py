from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.sales.shipments.repositories import ShipmentPlanRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.inbound_orders.repositories import InboundOrderRepository
from app.modules.warehouse.outbound_orders.repositories import OutboundOrderRepository
from app.modules.warehouse.outbound_orders.schemas import (
    OutboundOrderApprove,
    OutboundOrderGenerateFromPlan,
    OutboundOrderLineShip,
)
from app.modules.warehouse.outbound_orders.services import (
    OutboundOrderService,
    PermissionDeniedError,
)
from app.modules.warehouse.outbound_plans.repositories import OutboundPlanRepository
from app.modules.warehouse.outbound_plans.schemas import OutboundPlanSchedule
from app.modules.warehouse.outbound_plans.services import OutboundPlanService


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
            "warehouse:outbound_order:view",
            "warehouse:outbound_order:edit",
            "warehouse:outbound_order:approve",
            "warehouse:outbound_order:view_all",
            "warehouse:outbound_plan:view",
            "warehouse:outbound_plan:edit",
            "warehouse:outbound_plan:view_all",
        ]
    )


async def _prepare_followup_contract(session: AsyncSession) -> str:
    purchase_repository = PurchaseContractRepository(session)
    contract = await purchase_repository.create_contract(
        code="PC-OO-SVC",
        contract_date=date(2026, 9, 1),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        currency="USD",
        delivery_date=date(2026, 9, 20),
        payment_terms="30% 预付，70% 出货前",
        source_type="export_contract",
        remarks="货物出库服务测试采购合同",
        approval_status="approved",
        owner_user_id="u-001",
    )
    await purchase_repository.add_line(
        contract_id=contract.id,
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="300",
        unit="pcs",
        unit_price="1.2",
        amount="360.00",
        source_export_contract_id="export-001",
        source_export_contract_no="EC-001",
        source_export_contract_line_id="export-line-001",
        remark="出库回写跟单测试",
    )
    refreshed = await purchase_repository.refresh_statistics(contract.id)
    assert refreshed is not None
    followup_service = FollowupService(
        followup_repository=FollowupRepository(session),
        purchase_contract_repository=purchase_repository,
        sample_record_repository=SampleRecordRepository(session),
    )
    await followup_service.ensure_plan_for_contract(contract=refreshed)
    return contract.id


async def _prepare_scheduled_outbound_plan(
    session: AsyncSession,
    *,
    quantity: str = "300",
) -> tuple[str, str]:
    shipment_repository = ShipmentPlanRepository(session)
    shipment = await shipment_repository.create_plan(
        code=f"SP-OO-SVC-{quantity}",
        shipment_date=date(2026, 9, 25),
        planned_ship_date=date(2026, 9, 30),
        customer_id="customer-euro-home",
        customer_name="欧陆家居用品有限公司",
        currency="USD",
        shipping_method="sea",
        port_of_loading="Ningbo",
        port_of_destination="Hamburg",
        vessel_name="COSCO Star",
        container_no="CONT-OO",
        booking_no="BOOK-OO",
        document_owner_name="单证部",
        payable_amount="420.00",
        remarks="货物出库服务测试发货计划",
        approval_status="approved",
        owner_user_id="u-001",
    )
    shipment_line = await shipment_repository.add_line(
        shipment_id=shipment.id,
        contract_id="export-001",
        contract_no="EC-001",
        contract_line_id="export-line-001",
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity=quantity,
        unit="pcs",
        unit_price="1.4",
        amount="420.00",
        planned_ship_date=date(2026, 9, 30),
    )
    await shipment_repository.refresh_finance(shipment.id)
    outbound_plan_repository = OutboundPlanRepository(session)
    plan = await outbound_plan_repository.create_plan(
        code=f"OP-{shipment.code}",
        source_type="shipment_plan",
        source_id=shipment.id,
        source_code=shipment.code,
        outbound_type="finished_goods_outbound",
        planned_date=date(2026, 9, 30),
        status="planned",
        customer_id=shipment.customer_id,
        customer_name=shipment.customer_name,
        owner_user_id="u-001",
    )
    await outbound_plan_repository.add_line(
        plan_id=plan.id,
        source_line_id=shipment_line.id,
        product_id=shipment_line.product_id,
        product_code=shipment_line.product_code,
        product_name=shipment_line.product_name,
        specification=shipment_line.specification,
        model=shipment_line.model,
        planned_quantity=quantity,
        unit=shipment_line.unit,
        remark="待出库商品",
    )
    outbound_plan_service = OutboundPlanService(
        outbound_repository=outbound_plan_repository,
        shipment_repository=shipment_repository,
    )
    scheduled = await outbound_plan_service.schedule_plan(
        current_user=_warehouse_user(),
        plan_id=plan.id,
        payload=OutboundPlanSchedule(
            planned_date=date(2026, 9, 30),
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            operator_name="仓库主管",
        ),
    )
    return scheduled.id, shipment_line.id


async def _add_available_stock(session: AsyncSession, *, quantity: str) -> None:
    await InboundOrderRepository(session).increase_balance(
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-fg-01",
        location_name="成品区 A-01",
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        available_delta=quantity,
        pending_delta="0",
        unit="pcs",
    )


def _service(session: AsyncSession) -> OutboundOrderService:
    purchase_repository = PurchaseContractRepository(session)
    return OutboundOrderService(
        outbound_order_repository=OutboundOrderRepository(session),
        outbound_plan_repository=OutboundPlanRepository(session),
        inventory_repository=InboundOrderRepository(session),
        shipment_repository=ShipmentPlanRepository(session),
        purchase_contract_repository=purchase_repository,
        followup_service=FollowupService(
            followup_repository=FollowupRepository(session),
            purchase_contract_repository=purchase_repository,
            sample_record_repository=SampleRecordRepository(session),
        ),
    )


def _payload(plan_id: str, *, outbound_mode: str = "formal") -> OutboundOrderGenerateFromPlan:
    return OutboundOrderGenerateFromPlan(
        plan_id=plan_id,
        code=f"OO-SVC-{outbound_mode}",
        outbound_mode=outbound_mode,
        outbound_at=date(2026, 9, 30),
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-fg-01",
        location_name="成品区 A-01",
        operator_name="仓库主管",
        exception_reason=("客户临时改柜，先发部分货物" if outbound_mode == "exception" else None),
        lines=[],
    )


async def test_outbound_order_service_formal_outbound_deducts_stock_and_followup(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_contract_id = await _prepare_followup_contract(session)
        plan_id, _ = await _prepare_scheduled_outbound_plan(session)
        await _add_available_stock(session, quantity="300")
        service = _service(session)
        order = await service.generate_from_plan(
            current_user=_warehouse_user(),
            payload=_payload(plan_id),
        )
        submitted = await service.submit_order(current_user=_warehouse_user(), order_id=order.id)
        approved = await service.approve_order(
            current_user=_warehouse_user(),
            order_id=submitted.id,
            payload=OutboundOrderApprove(
                reviewer_name="业务主管",
                approved_at=date(2026, 9, 30),
                allow_negative=False,
            ),
        )
        balances = await InboundOrderRepository(session).list_balances(q="BAG-40")
        ledgers = await InboundOrderRepository(session).list_ledgers(source_id=approved.id)
        plan = await OutboundPlanRepository(session).get_plan(plan_id)
        plan_lines = await OutboundPlanRepository(session).list_lines(plan_id)
        followup_repository = FollowupRepository(session)
        followup_plan = await followup_repository.get_plan_by_contract(purchase_contract_id)
        assert followup_plan is not None
        outbound_node = await followup_repository.get_plan_node(
            plan_id=followup_plan.id,
            node_code="outbound_completed",
        )

    assert approved.status == "approved"
    assert approved.outbound_mode == "formal"
    assert balances[0][0].available_quantity == "0"
    assert ledgers[0][0].direction == "out"
    assert ledgers[0][0].quantity == "300"
    assert plan is not None
    assert plan.status == "closed"
    assert plan_lines[0].outbound_quantity == "300"
    assert plan_lines[0].status == "shipped"
    assert outbound_node is not None
    assert outbound_node.status == "completed"
    assert outbound_node.actual_date == date(2026, 9, 30)


async def test_outbound_order_service_exception_outbound_records_reason(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await _prepare_followup_contract(session)
        plan_id, _ = await _prepare_scheduled_outbound_plan(session)
        await _add_available_stock(session, quantity="300")
        service = _service(session)
        plan_line = (await OutboundPlanRepository(session).list_lines(plan_id))[0]
        order = await service.generate_from_plan(
            current_user=_warehouse_user(),
            payload=OutboundOrderGenerateFromPlan(
                plan_id=plan_id,
                code="OO-SVC-EXCEPTION",
                outbound_mode="exception",
                outbound_at=date(2026, 9, 30),
                warehouse_id="wh-ningbo",
                warehouse_name="宁波总仓",
                location_id="loc-fg-01",
                location_name="成品区 A-01",
                operator_name="仓库主管",
                exception_reason="客户临时改柜，先发 50 件",
                lines=[
                    OutboundOrderLineShip(
                        plan_line_id=plan_line.id,
                        product_id=plan_line.product_id,
                        product_code=plan_line.product_code,
                        product_name=plan_line.product_name,
                        quantity="50",
                        unit=plan_line.unit,
                    )
                ],
            ),
        )
        await service.submit_order(current_user=_warehouse_user(), order_id=order.id)
        approved = await service.approve_order(
            current_user=_warehouse_user(),
            order_id=order.id,
            payload=OutboundOrderApprove(
                reviewer_name="业务主管",
                approved_at=date(2026, 9, 30),
            ),
        )
        plan_lines = await OutboundPlanRepository(session).list_lines(plan_id)

    assert approved.outbound_mode == "exception"
    assert approved.exception_reason == "客户临时改柜，先发 50 件"
    assert approved.lines[0].quantity == "50"
    assert plan_lines[0].outbound_quantity == "50"
    assert plan_lines[0].status == "partial"


async def test_outbound_order_service_rejects_unauthorized_negative_stock(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await _prepare_followup_contract(session)
        plan_id, _ = await _prepare_scheduled_outbound_plan(session)
        await _add_available_stock(session, quantity="20")
        service = _service(session)
        order = await service.generate_from_plan(
            current_user=_warehouse_user(),
            payload=_payload(plan_id),
        )
        await service.submit_order(current_user=_warehouse_user(), order_id=order.id)

        with pytest.raises(ValueError):
            await service.approve_order(
                current_user=_warehouse_user(),
                order_id=order.id,
                payload=OutboundOrderApprove(
                    reviewer_name="业务主管",
                    approved_at=date(2026, 9, 30),
                    allow_negative=False,
                ),
            )
        balances = await InboundOrderRepository(session).list_balances(q="BAG-40")
        plan_lines = await OutboundPlanRepository(session).list_lines(plan_id)

    assert balances[0][0].available_quantity == "20"
    assert plan_lines[0].outbound_quantity == "0"


async def test_outbound_order_service_requires_view_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _service(session)

        with pytest.raises(PermissionDeniedError):
            await service.list_orders(
                current_user=_user(["warehouse:outbound_order:edit"]),
                q=None,
                status=None,
                outbound_mode=None,
                outbound_type=None,
                customer_id=None,
                source_id=None,
            )
