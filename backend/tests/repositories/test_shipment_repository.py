from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.shipments.models import ShipmentPlan
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


async def test_refresh_finance_rebases_profit_with_refunds_and_misc_fees(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """利润按应收−应付+退税−杂费整体重算；重复重算与写入顺序不改变结果。"""
    from app.modules.finance.misc_fees.models import MiscFeeAllocation, MiscFeeItem
    from app.modules.finance.tax_refunds.models import (
        VerificationDocument,
        VerificationTaxRefund,
    )

    async with session_factory() as session:
        repository = ShipmentPlanRepository(session)
        plan = await repository.create_plan(
            code="SP-REPO-REFUND",
            shipment_date=date(2026, 8, 18),
            planned_ship_date=date(2026, 8, 20),
            customer_id="customer-a",
            customer_name="客户 A",
            currency="USD",
            shipping_method="sea",
            port_of_loading="Ningbo",
            port_of_destination="Hamburg",
            vessel_name=None,
            container_no=None,
            booking_no=None,
            document_owner_name=None,
            payable_amount="40.00",
            remarks="",
            approval_status="approved",
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
            specification=None,
            model=None,
            quantity="10",
            unit="pcs",
            unit_price="10.00",
            amount="100.00",
            planned_ship_date=date(2026, 8, 10),
        )
        fee_item = MiscFeeItem(
            code="FEE-REPO",
            name="测试杂费",
            category="logistics",
            default_allocation_method="manual",
            is_active=True,
            created_by_user_id="u-001",
            created_by_user_name="测试",
        )
        session.add(fee_item)
        await session.flush()
        # 先记杂费并重算一次，再加退税，验证顺序变化不影响最终结果。
        session.add(
            MiscFeeAllocation(
                allocation_no="MFA-REPO-1",
                item_id=fee_item.id,
                item_code=fee_item.code,
                item_name=fee_item.name,
                item_category=fee_item.category,
                shipment_plan_id=plan.id,
                shipment_no=plan.code,
                customer_name="客户 A",
                allocated_at=date(2026, 8, 2),
                amount="5.00",
                currency="USD",
                allocation_method="manual",
                status="allocated",
                created_by_user_id="u-001",
                created_by_user_name="测试",
            )
        )
        await session.flush()
        first = await repository.refresh_finance(plan.id)
        assert first is not None
        # 100 - 40 - 5 = 55，此时尚无退税。
        assert first.profit_amount == "55.00"

        document = VerificationDocument(
            document_no="VD-REPO-REFUND",
            received_at=date(2026, 8, 1),
            shipment_plan_id=plan.id,
            shipment_no=plan.code,
            customer_name="客户 A",
            currency="USD",
            refundable_amount="10.00",
            refunded_amount="10.00",
            valid_until=date(2026, 9, 1),
            reminder_date=date(2026, 8, 25),
            reminder_message="核销单到期",
            status="refunded",
            created_by_user_id="u-001",
            created_by_user_name="测试",
        )
        session.add(document)
        await session.flush()
        session.add(
            VerificationTaxRefund(
                verification_document_id=document.id,
                refund_no="TR-REPO-1",
                refunded_at=date(2026, 8, 2),
                amount="10.00",
                currency="USD",
            )
        )
        await session.flush()
        # 模拟历史记录：派生利润仍停留在旧值。
        stale = await session.get(ShipmentPlan, plan.id)
        assert stale is not None
        stale.profit_amount = Decimal("999.00")
        await session.flush()
        refreshed = await repository.refresh_finance(plan.id)
        assert refreshed is not None
        assert refreshed.receivable_amount == "100.00"
        # 100 - 40 + 10 - 5 = 65；利润率分母统一为应收 100。
        assert refreshed.profit_amount == "65.00"
        assert refreshed.profit_rate == "65.00"
        again = await repository.refresh_finance(plan.id)
        assert again is not None
        assert again.profit_amount == "65.00"
        assert again.profit_rate == "65.00"

