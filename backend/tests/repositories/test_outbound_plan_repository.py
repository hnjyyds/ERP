from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.warehouse.outbound_plans.repositories import (
    OutboundPlanRepository,
    OutboundPlanRow,
)


async def test_outbound_plan_repository_records_plan_lines_and_schedule(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = OutboundPlanRepository(session)
        plan = await repository.create_plan(
            code="OP-REPO-001",
            source_type="shipment_plan",
            source_id="shipment-001",
            source_code="SP-001",
            outbound_type="finished_goods_outbound",
            planned_date=date(2026, 8, 20),
            status="planned",
            customer_id="customer-euro-home",
            customer_name="欧陆家居用品有限公司",
            owner_user_id="u-001",
        )
        await repository.add_line(
            plan_id=plan.id,
            source_line_id="shipment-line-001",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            specification="40x35cm",
            model="BAG-40",
            planned_quantity="300",
            unit="pcs",
            remark="出货计划待出库",
        )
        scheduled = await repository.schedule_plan(
            plan_id=plan.id,
            planned_date=date(2026, 8, 18),
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            operator_name="仓库主管",
        )
        await session.commit()

        plans, total = await repository.list_plans(
            q="SP-001",
            status="scheduled",
            outbound_type="finished_goods_outbound",
            source_type="shipment_plan",
            customer_id="customer-euro-home",
            source_id=None,
            owner_user_ids=None,
        )
        lines = await repository.list_lines(plan.id)

    assert total == 1
    assert isinstance(plans[0], OutboundPlanRow)
    assert scheduled is not None
    assert scheduled.status == "scheduled"
    assert scheduled.location_name == "成品区 A-01"
    assert lines[0].planned_quantity == "300"
    assert lines[0].outbound_quantity == "0"
    assert lines[0].status == "pending"
