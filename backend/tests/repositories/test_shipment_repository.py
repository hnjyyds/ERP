from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.shipments.repositories import ShipmentPlanRepository, ShipmentPlanRow


async def test_shipment_repository_lists_multi_contract_plan_finance_and_reminders(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ShipmentPlanRepository(session)
        plan = await repository.create_plan(
            code="SP-REPO-001",
            shipment_date=date(2026, 8, 18),
            planned_ship_date=date(2026, 8, 20),
            customer_id="customer-a",
            customer_name="客户 A",
            currency="USD",
            shipping_method="sea",
            port_of_loading="Ningbo",
            port_of_destination="Hamburg",
            vessel_name="COSCO Star",
            container_no="CONT-REPO-001",
            booking_no="BOOK-REPO-001",
            document_owner_name="单证部",
            payable_amount="780.00",
            remarks="两个出口合同合并出运",
            approval_status="draft",
            owner_user_id="u-001",
        )
        await repository.add_line(
            shipment_id=plan.id,
            contract_id="contract-a",
            contract_no="EC-REPO-A",
            contract_line_id="line-a",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            specification="40x35cm",
            model="BAG-40",
            quantity="300",
            unit="pcs",
            unit_price="1.40",
            amount="420.00",
            planned_ship_date=date(2026, 8, 10),
        )
        await repository.add_line(
            shipment_id=plan.id,
            contract_id="contract-b",
            contract_no="EC-REPO-B",
            contract_line_id="line-b",
            product_id="product-b",
            product_code="BOX-20",
            product_name="Gift Box",
            specification="20x20cm",
            model="BOX-20",
            quantity="200",
            unit="pcs",
            unit_price="2.10",
            amount="420.00",
            planned_ship_date=date(2026, 8, 12),
        )
        refreshed = await repository.refresh_finance(plan.id)
        submitted = await repository.submit_plan(plan.id)
        approved = await repository.approve_plan(
            shipment_id=plan.id,
            reviewer_name="演示业务主管",
            approved_at=date(2026, 8, 19),
        )
        await session.commit()

        plans, total = await repository.list_plans(
            q="EC-REPO-A",
            approval_status="approved",
            customer_id="customer-a",
            contract_id="contract-a",
            owner_user_ids=None,
        )
        lines = await repository.list_lines(plan.id)
        reminders = await repository.list_reminders(owner_user_ids=None)

    assert refreshed is not None
    assert refreshed.receivable_amount == "840.00"
    assert refreshed.payable_amount == "780.00"
    assert refreshed.profit_amount == "60.00"
    assert refreshed.profit_rate == "7.14"
    assert submitted is not None
    assert submitted.approval_status == "submitted"
    assert approved is not None
    assert approved.approval_status == "approved"
    assert total == 1
    assert isinstance(plans[0], ShipmentPlanRow)
    assert plans[0].code == "SP-REPO-001"
    assert len(lines) == 2
    assert lines[0].contract_no == "EC-REPO-A"
    assert reminders[0].shipment_no == "SP-REPO-001"
    assert reminders[0].reminder_date == date(2026, 8, 13)
