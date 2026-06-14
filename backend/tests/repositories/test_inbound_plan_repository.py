from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.warehouse.inbound_plans.repositories import (
    InboundPlanRepository,
    InboundPlanRow,
)


async def test_inbound_plan_repository_records_lines_and_schedules_location(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = InboundPlanRepository(session)
        plan = await repository.create_plan(
            code="IP-REPO-001",
            purchase_contract_id="pc-001",
            purchase_contract_no="PC-001",
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            inbound_type="purchase_inbound",
            planned_date=date(2026, 8, 30),
            status="planned",
            owner_user_id="u-001",
        )
        await repository.add_line(
            plan_id=plan.id,
            purchase_contract_line_id="pcl-001",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            specification="40x35cm",
            model="BAG-40",
            planned_quantity="1000",
            unit="pcs",
            remark="采购合同待入库",
        )
        scheduled = await repository.schedule_plan(
            plan_id=plan.id,
            planned_date=date(2026, 8, 28),
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-a-01",
            location_name="A-01",
            operator_name="仓库主管",
        )
        await session.commit()

        plans, total = await repository.list_plans(
            q="PC-001",
            inbound_type="purchase_inbound",
            status="scheduled",
            supplier_id="supplier-pack-a",
            purchase_contract_id=None,
            owner_user_id=None,
        )
        lines = await repository.list_lines(plan.id)
        by_contract = await repository.get_plan_by_contract("pc-001")

    assert total == 1
    assert isinstance(plans[0], InboundPlanRow)
    assert scheduled is not None
    assert scheduled.status == "scheduled"
    assert scheduled.warehouse_name == "宁波总仓"
    assert lines[0].planned_quantity == "1000"
    assert by_contract is not None
    assert by_contract.id == plan.id
