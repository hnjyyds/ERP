from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.inbound_plans.repositories import InboundPlanRepository
from app.modules.warehouse.inbound_plans.schemas import (
    InboundPlanGenerateFromPurchaseContract,
    InboundPlanSchedule,
)
from app.modules.warehouse.inbound_plans.services import (
    InboundPlanService,
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
            "warehouse:inbound_plan:view",
            "warehouse:inbound_plan:edit",
            "warehouse:inbound_plan:view_all",
        ]
    )


async def _create_contract(
    repository: PurchaseContractRepository,
    *,
    approval_status: str,
) -> str:
    contract = await repository.create_contract(
        code=f"PC-INP-{approval_status}",
        contract_date=date(2026, 8, 5),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        currency="USD",
        delivery_date=date(2026, 8, 30),
        payment_terms="30% 预付，70% 出货前",
        source_type="stock_purchase",
        remarks="入库计划服务测试",
        approval_status=approval_status,
        owner_user_id="u-001",
    )
    await repository.add_line(
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
    await repository.refresh_statistics(contract.id)
    return contract.id


async def test_inbound_plan_service_generates_from_approved_contract_and_schedules_location(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_repository = PurchaseContractRepository(session)
        contract_id = await _create_contract(purchase_repository, approval_status="approved")
        service = InboundPlanService(
            inbound_repository=InboundPlanRepository(session),
            purchase_contract_repository=purchase_repository,
        )

        plan = await service.generate_from_purchase_contract(
            current_user=_warehouse_user(),
            payload=InboundPlanGenerateFromPurchaseContract(
                purchase_contract_id=contract_id,
                inbound_type="purchase_inbound",
                planned_date=None,
            ),
        )
        scheduled = await service.schedule_plan(
            current_user=_warehouse_user(),
            plan_id=plan.id,
            payload=InboundPlanSchedule(
                planned_date=date(2026, 8, 28),
                warehouse_id="wh-ningbo",
                warehouse_name="宁波总仓",
                location_id="loc-a-01",
                location_name="A-01",
                operator_name="仓库主管",
            ),
        )
        listed = await service.list_plans(
            current_user=_warehouse_user(),
            q="PC-INP-approved",
            inbound_type=None,
            status="scheduled",
            supplier_id=None,
            purchase_contract_id=None,
        )

    assert plan.purchase_contract_no == "PC-INP-approved"
    assert plan.planned_date == date(2026, 8, 30)
    assert plan.status == "planned"
    assert plan.lines[0].planned_quantity == "1000"
    assert scheduled.status == "scheduled"
    assert scheduled.warehouse_name == "宁波总仓"
    assert listed.total == 1


async def test_inbound_plan_service_rejects_unapproved_contract(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        purchase_repository = PurchaseContractRepository(session)
        contract_id = await _create_contract(purchase_repository, approval_status="draft")
        service = InboundPlanService(
            inbound_repository=InboundPlanRepository(session),
            purchase_contract_repository=purchase_repository,
        )

        with pytest.raises(ValueError):
            await service.generate_from_purchase_contract(
                current_user=_warehouse_user(),
                payload=InboundPlanGenerateFromPurchaseContract(
                    purchase_contract_id=contract_id,
                    inbound_type="purchase_inbound",
                    planned_date=None,
                ),
            )


async def test_inbound_plan_service_requires_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = InboundPlanService(
            inbound_repository=InboundPlanRepository(session),
            purchase_contract_repository=PurchaseContractRepository(session),
        )

        with pytest.raises(PermissionDeniedError):
            await service.list_plans(
                current_user=_user(["warehouse:inbound_plan:edit"]),
                q=None,
                inbound_type=None,
                status=None,
                supplier_id=None,
                purchase_contract_id=None,
            )
