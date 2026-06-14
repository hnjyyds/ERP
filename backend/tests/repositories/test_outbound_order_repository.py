from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.warehouse.inbound_orders.repositories import InboundOrderRepository
from app.modules.warehouse.outbound_orders.repositories import (
    OutboundOrderRepository,
    OutboundOrderRow,
)


async def test_outbound_order_repository_records_order_deducts_stock_and_ledger(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        inbound_repository = InboundOrderRepository(session)
        repository = OutboundOrderRepository(session)
        order = await repository.create_order(
            code="OO-REPO-001",
            plan_id="plan-001",
            source_type="shipment_plan",
            source_id="shipment-001",
            source_code="SP-001",
            outbound_type="finished_goods_outbound",
            customer_id="customer-euro-home",
            customer_name="欧陆家居用品有限公司",
            outbound_mode="formal",
            outbound_at=date(2026, 9, 30),
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            operator_name="仓库主管",
            status="draft",
            exception_reason=None,
            owner_user_id="u-001",
        )
        await repository.add_line(
            order_id=order.id,
            plan_line_id="plan-line-001",
            source_line_id="shipment-line-001",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            specification="40x35cm",
            model="BAG-40",
            quantity="300",
            unit="pcs",
            remark="正式出库",
        )
        await inbound_repository.increase_balance(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            available_delta="500",
            pending_delta="0",
            unit="pcs",
        )
        submitted = await repository.submit_order(order.id)
        approved = await repository.approve_order(order.id, "业务主管", date(2026, 9, 30))
        balance = await repository.decrease_available_balance(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            quantity="300",
            unit="pcs",
            allow_negative=False,
        )
        await repository.add_ledger(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            direction="out",
            quantity="300",
            unit="pcs",
            stock_status="available",
            source_type="outbound_order",
            source_id=order.id,
            source_code=order.code,
            occurred_at=date(2026, 9, 30),
            remark="正式出库",
        )
        await session.commit()

        orders, total = await repository.list_orders(
            q="SP-001",
            status="approved",
            outbound_mode="formal",
            outbound_type="finished_goods_outbound",
            customer_id=None,
            source_id=None,
            owner_user_id=None,
        )
        lines = await repository.list_lines(order.id)
        ledgers, ledger_total = await inbound_repository.list_ledgers(source_id=order.id)
        balances, balance_total = await inbound_repository.list_balances(q="BAG-40")

    assert total == 1
    assert isinstance(orders[0], OutboundOrderRow)
    assert submitted is not None
    assert submitted.status == "submitted"
    assert approved is not None
    assert approved.status == "approved"
    assert lines[0].quantity == "300"
    assert balance is not None
    assert balance.available_quantity == "200"
    assert balance_total == 1
    assert balances[0].available_quantity == "200"
    assert ledger_total == 1
    assert ledgers[0].direction == "out"


async def test_outbound_order_repository_rejects_insufficient_available_stock(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        inbound_repository = InboundOrderRepository(session)
        repository = OutboundOrderRepository(session)
        await inbound_repository.increase_balance(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            available_delta="20",
            pending_delta="0",
            unit="pcs",
        )

        balance = await repository.decrease_available_balance(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            quantity="30",
            unit="pcs",
            allow_negative=False,
        )
        balances, _ = await inbound_repository.list_balances(q="BAG-40")

    assert balance is None
    assert balances[0].available_quantity == "20"
