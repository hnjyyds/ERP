from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.warehouse.inbound_orders.repositories import (
    InboundOrderRepository,
    InboundOrderRow,
)


async def test_inbound_order_repository_records_inventory_balance_and_ledger(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = InboundOrderRepository(session)
        order = await repository.create_order(
            code="IO-REPO-001",
            plan_id="plan-001",
            purchase_contract_id="pc-001",
            purchase_contract_no="PC-001",
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            inbound_type="purchase_inbound",
            inbound_mode="formal",
            inbound_at=date(2026, 8, 30),
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-a-01",
            location_name="A-01",
            operator_name="仓库主管",
            status="draft",
            owner_user_id="u-001",
        )
        await repository.add_line(
            order_id=order.id,
            plan_line_id="plan-line-001",
            purchase_contract_line_id="pcl-001",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            specification="40x35cm",
            model="BAG-40",
            quantity="1000",
            unit="pcs",
            stock_status="available",
            remark="正式入库",
        )
        submitted = await repository.submit_order(order.id)
        approved = await repository.approve_order(order.id, "业务主管", date(2026, 8, 31))
        balance = await repository.increase_balance(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-a-01",
            location_name="A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            available_delta="1000",
            pending_delta="0",
            unit="pcs",
        )
        await repository.add_ledger(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-a-01",
            location_name="A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            direction="in",
            quantity="1000",
            unit="pcs",
            stock_status="available",
            source_type="inbound_order",
            source_id=order.id,
            source_code=order.code,
            occurred_at=date(2026, 8, 31),
            remark="正式入库",
        )
        await session.commit()

        orders, total = await repository.list_orders(
            q="PC-001",
            status="approved",
            inbound_mode="formal",
            supplier_id="supplier-pack-a",
            purchase_contract_id=None,
            owner_user_ids=None,
        )
        lines = await repository.list_lines(order.id)
        balances, balance_total = await repository.list_balances(q="BAG-40")
        ledgers, ledger_total = await repository.list_ledgers(source_id=order.id)

    assert total == 1
    assert isinstance(orders[0], InboundOrderRow)
    assert submitted is not None
    assert submitted.status == "submitted"
    assert approved is not None
    assert approved.status == "approved"
    assert lines[0].quantity == "1000"
    assert balance.available_quantity == "1000"
    assert balance.pending_inspection_quantity == "0"
    assert balance_total == 1
    assert balances[0].product_code == "BAG-40"
    assert ledger_total == 1
    assert ledgers[0].stock_status == "available"
