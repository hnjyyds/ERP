from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.quality.inspections.repositories import QualityInspectionRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.inbound_orders.repositories import InboundOrderRepository
from app.modules.warehouse.inbound_orders.schemas import (
    InboundOrderApprove,
    InboundOrderGenerateFromPlan,
)
from app.modules.warehouse.inbound_orders.services import (
    InboundOrderService,
    PermissionDeniedError,
)
from app.modules.warehouse.inbound_plans.repositories import InboundPlanRepository
from app.modules.warehouse.inbound_plans.services import InboundPlanService


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
            "warehouse:inbound_order:view",
            "warehouse:inbound_order:edit",
            "warehouse:inbound_order:approve",
            "warehouse:inbound_order:view_all",
        ]
    )


async def _prepare_plan(
    session: AsyncSession,
    *,
    approval_status: str = "approved",
) -> tuple[str, str, str]:
    purchase_repository = PurchaseContractRepository(session)
    contract = await purchase_repository.create_contract(
        code=f"PC-IO-{approval_status}",
        contract_date=date(2026, 8, 5),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        currency="USD",
        delivery_date=date(2026, 8, 30),
        payment_terms="30% 预付，70% 出货前",
        source_type="stock_purchase",
        remarks="货物入库服务测试",
        approval_status=approval_status,
        owner_user_id="u-001",
    )
    line = await purchase_repository.add_line(
        contract_id=contract.id,
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="1000",
        unit="pcs",
        unit_price="1.2",
        amount="1200.00",
        source_export_contract_id=None,
        source_export_contract_no=None,
        source_export_contract_line_id=None,
        remark="待入库商品",
    )
    updated_contract = await purchase_repository.refresh_statistics(contract.id)
    assert updated_contract is not None
    followup_service = FollowupService(
        followup_repository=FollowupRepository(session),
        purchase_contract_repository=purchase_repository,
        sample_record_repository=SampleRecordRepository(session),
    )
    await followup_service.ensure_plan_for_contract(contract=updated_contract)
    inbound_plan_service = InboundPlanService(
        inbound_repository=InboundPlanRepository(session),
        purchase_contract_repository=purchase_repository,
    )
    plan = await inbound_plan_service.ensure_plan_for_contract(contract=updated_contract)
    return contract.id, line.id, plan.id


async def _add_qc_result(
    session: AsyncSession,
    *,
    purchase_contract_id: str,
    purchase_contract_line_id: str,
    result: str,
) -> None:
    purchase_repository = PurchaseContractRepository(session)
    contract = await purchase_repository.get_contract(purchase_contract_id)
    assert contract is not None
    quality_repository = QualityInspectionRepository(session)
    inspection = await quality_repository.create_inspection(
        code=f"QC-IO-{result}",
        purchase_contract_id=contract.id,
        purchase_contract_no=contract.code,
        supplier_id=contract.supplier_id,
        supplier_name=contract.supplier_name,
        inspected_at=date(2026, 8, 19),
        result=result,
        inspector_id="u-qc-001",
        inspector_name="QC 张工",
        issue_summary=None,
        attachment_group_id="attach-qc",
        owner_user_id="u-001",
    )
    await quality_repository.add_line(
        inspection_id=inspection.id,
        purchase_contract_line_id=purchase_contract_line_id,
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        inspected_quantity="120",
        failed_quantity="0" if result == "passed" else "20",
        unit="pcs",
        result=result,
        remark="QC 测试",
    )


def _payload(plan_id: str, *, inbound_mode: str) -> InboundOrderGenerateFromPlan:
    return InboundOrderGenerateFromPlan(
        plan_id=plan_id,
        code=f"IO-SVC-{inbound_mode}",
        inbound_mode=inbound_mode,
        inbound_at=date(2026, 8, 30),
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-a-01",
        location_name="A-01",
        operator_name="仓库主管",
        lines=[],
    )


async def test_inbound_order_service_pending_inspection_does_not_increase_available_stock(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        _, _, plan_id = await _prepare_plan(session)
        service = InboundOrderService(
            inbound_repository=InboundOrderRepository(session),
            inbound_plan_repository=InboundPlanRepository(session),
            purchase_contract_repository=PurchaseContractRepository(session),
            quality_repository=QualityInspectionRepository(session),
            followup_service=FollowupService(
                followup_repository=FollowupRepository(session),
                purchase_contract_repository=PurchaseContractRepository(session),
                sample_record_repository=SampleRecordRepository(session),
            ),
        )
        order = await service.generate_from_plan(
            current_user=_warehouse_user(),
            payload=_payload(plan_id, inbound_mode="pending_inspection"),
        )
        submitted = await service.submit_order(current_user=_warehouse_user(), order_id=order.id)
        approved = await service.approve_order(
            current_user=_warehouse_user(),
            order_id=submitted.id,
            payload=InboundOrderApprove(reviewer_name="业务主管", approved_at=date(2026, 8, 30)),
        )
        balances = await service.list_inventory_balances(current_user=_warehouse_user(), q="BAG-40")
        ledgers = await service.list_inventory_ledgers(
            current_user=_warehouse_user(),
            source_id=approved.id,
        )

    assert approved.status == "approved"
    assert approved.inbound_mode == "pending_inspection"
    assert balances.items[0].available_quantity == "0"
    assert balances.items[0].pending_inspection_quantity == "1000"
    assert ledgers.items[0].stock_status == "pending_inspection"


async def test_inbound_order_service_formal_inbound_requires_passed_qc(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        contract_id, line_id, plan_id = await _prepare_plan(session)
        await _add_qc_result(
            session,
            purchase_contract_id=contract_id,
            purchase_contract_line_id=line_id,
            result="failed",
        )
        service = InboundOrderService(
            inbound_repository=InboundOrderRepository(session),
            inbound_plan_repository=InboundPlanRepository(session),
            purchase_contract_repository=PurchaseContractRepository(session),
            quality_repository=QualityInspectionRepository(session),
            followup_service=FollowupService(
                followup_repository=FollowupRepository(session),
                purchase_contract_repository=PurchaseContractRepository(session),
                sample_record_repository=SampleRecordRepository(session),
            ),
        )
        order = await service.generate_from_plan(
            current_user=_warehouse_user(),
            payload=_payload(plan_id, inbound_mode="formal"),
        )
        await service.submit_order(current_user=_warehouse_user(), order_id=order.id)

        with pytest.raises(ValueError):
            await service.approve_order(
                current_user=_warehouse_user(),
                order_id=order.id,
                payload=InboundOrderApprove(
                    reviewer_name="业务主管",
                    approved_at=date(2026, 8, 30),
                ),
            )


async def test_inbound_order_service_formal_inbound_posts_inventory_and_followup(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        contract_id, line_id, plan_id = await _prepare_plan(session)
        await _add_qc_result(
            session,
            purchase_contract_id=contract_id,
            purchase_contract_line_id=line_id,
            result="passed",
        )
        purchase_repository = PurchaseContractRepository(session)
        inbound_plan_repository = InboundPlanRepository(session)
        followup_repository = FollowupRepository(session)
        service = InboundOrderService(
            inbound_repository=InboundOrderRepository(session),
            inbound_plan_repository=inbound_plan_repository,
            purchase_contract_repository=purchase_repository,
            quality_repository=QualityInspectionRepository(session),
            followup_service=FollowupService(
                followup_repository=followup_repository,
                purchase_contract_repository=purchase_repository,
                sample_record_repository=SampleRecordRepository(session),
            ),
        )
        order = await service.generate_from_plan(
            current_user=_warehouse_user(),
            payload=_payload(plan_id, inbound_mode="formal"),
        )
        await service.submit_order(current_user=_warehouse_user(), order_id=order.id)
        approved = await service.approve_order(
            current_user=_warehouse_user(),
            order_id=order.id,
            payload=InboundOrderApprove(reviewer_name="业务主管", approved_at=date(2026, 8, 30)),
        )
        balances = await service.list_inventory_balances(current_user=_warehouse_user(), q="BAG-40")
        ledgers = await service.list_inventory_ledgers(
            current_user=_warehouse_user(),
            source_id=approved.id,
        )
        contract = await purchase_repository.get_contract(contract_id)
        plan = await inbound_plan_repository.get_plan(plan_id)
        plan_lines = await inbound_plan_repository.list_lines(plan_id)
        followup_plan = await followup_repository.get_plan_by_contract(contract_id)
        assert followup_plan is not None
        inbound_node = await followup_repository.get_plan_node(
            plan_id=followup_plan.id,
            node_code="inbound_completed",
        )

    assert approved.status == "approved"
    assert balances.items[0].available_quantity == "1000"
    assert balances.items[0].pending_inspection_quantity == "0"
    assert ledgers.items[0].quantity == "1000"
    assert ledgers.items[0].stock_status == "available"
    assert contract is not None
    assert contract.received_quantity == "1000"
    assert plan is not None
    assert plan.status == "closed"
    assert plan_lines[0].received_quantity == "1000"
    assert inbound_node is not None
    assert inbound_node.status == "completed"
    assert inbound_node.actual_date == date(2026, 8, 30)


async def test_inbound_order_service_requires_view_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = InboundOrderService(
            inbound_repository=InboundOrderRepository(session),
            inbound_plan_repository=InboundPlanRepository(session),
            purchase_contract_repository=PurchaseContractRepository(session),
            quality_repository=QualityInspectionRepository(session),
            followup_service=FollowupService(
                followup_repository=FollowupRepository(session),
                purchase_contract_repository=PurchaseContractRepository(session),
                sample_record_repository=SampleRecordRepository(session),
            ),
        )

        with pytest.raises(PermissionDeniedError):
            await service.list_orders(
                current_user=_user(["warehouse:inbound_order:edit"]),
                q=None,
                status=None,
                inbound_mode=None,
                supplier_id=None,
                purchase_contract_id=None,
            )
