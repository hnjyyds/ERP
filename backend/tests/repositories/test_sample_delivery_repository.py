from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sample.deliveries.repositories import (
    SampleDeliveryRepository,
    SampleDeliveryRow,
)


async def test_sample_delivery_repository_filters_statistics_and_histories(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = SampleDeliveryRepository(session)
        delivery = await repository.create_delivery(
            code="SD-REPO-001",
            delivery_date=date(2026, 6, 25),
            customer_id="customer-a",
            customer_name="客户 A",
            supplier_id="supplier-a",
            supplier_name="供应商 A",
            factory_id="factory-a",
            factory_name="工厂 A",
            recipient_name="Anna",
            recipient_company="客户 A",
            recipient_address="客户地址",
            express_company="DHL",
            tracking_no="DHL-REPO-001",
            quote_id="quote-a",
            quote_no="QT-A",
            remark="报价前寄样",
            status="draft",
            owner_user_id="u-001",
        )
        await repository.add_line(
            delivery_id=delivery.id,
            sample_record_id="sample-a",
            sample_code="SM-A",
            sample_type="confirm_sample",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            quantity="2",
            unit="pcs",
            remark="寄客户确认",
        )
        await repository.add_fee(
            delivery_id=delivery.id,
            fee_type="express",
            amount="18.50",
            currency="USD",
            payer_type="company",
            remark="DHL",
        )
        await repository.submit_delivery(delivery.id)
        await repository.approve_delivery(
            delivery_id=delivery.id,
            reviewer_name="演示业务主管",
            approved_at=date(2026, 6, 25),
        )
        await repository.update_tracking(
            delivery_id=delivery.id,
            express_company="DHL",
            tracking_no="DHL-REPO-001",
            status="shipped",
        )
        await session.commit()

        deliveries, total = await repository.list_deliveries(
            q="Eco",
            status="shipped",
            customer_id="customer-a",
            express_company="DHL",
            owner_user_ids=None,
        )
        statistics = await repository.get_fee_statistics(
            customer_id="customer-a",
            date_from=date(2026, 6, 1),
            date_to=date(2026, 6, 30),
            express_company="DHL",
            owner_user_ids=None,
        )
        sample_history, sample_history_total = await repository.list_sample_history("sample-a")
        quote_history, quote_history_total = await repository.list_quote_history(
            customer_id="customer-a",
            product_id="product-a",
        )

    assert total == 1
    assert isinstance(deliveries[0], SampleDeliveryRow)
    assert deliveries[0].code == "SD-REPO-001"
    assert statistics[0].total_amount == "18.50"
    assert statistics[0].delivery_count == 1
    assert sample_history_total == 1
    assert sample_history[0].code == "SD-REPO-001"
    assert quote_history_total == 1
    assert quote_history[0].quote_no == "QT-A"


async def test_sample_delivery_repository_updates_header_and_replaces_children(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = SampleDeliveryRepository(session)
        delivery = await repository.create_delivery(
            code="SD-REPO-EDIT-001",
            delivery_date=date(2026, 6, 25),
            customer_id="customer-a",
            customer_name="客户 A",
            supplier_id="supplier-a",
            supplier_name="供应商 A",
            factory_id="factory-a",
            factory_name="工厂 A",
            recipient_name="Anna",
            recipient_company="客户 A",
            recipient_address="客户地址",
            express_company="DHL",
            tracking_no="DHL-REPO-EDIT-001",
            quote_id="quote-a",
            quote_no="QT-A",
            remark="报价前寄样",
            status="draft",
            owner_user_id="u-001",
        )
        await repository.add_line(
            delivery_id=delivery.id,
            sample_record_id="sample-a",
            sample_code="SM-A",
            sample_type="confirm_sample",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            quantity="2",
            unit="pcs",
            remark="寄客户确认",
        )
        await repository.add_fee(
            delivery_id=delivery.id,
            fee_type="express",
            amount="18.50",
            currency="USD",
            payer_type="company",
            remark="DHL",
        )

        updated = await repository.update_delivery(
            delivery_id=delivery.id,
            code="SD-REPO-EDIT-001",
            delivery_date=date(2026, 6, 26),
            customer_id="customer-a",
            customer_name="客户 A",
            supplier_id="supplier-a",
            supplier_name="供应商 A",
            factory_id="factory-b",
            factory_name="工厂 B",
            recipient_name="Anna",
            recipient_company="客户 A",
            recipient_address="客户地址 8 楼",
            express_company="FedEx",
            tracking_no="FDX-REPO-EDIT-001",
            quote_id="quote-a",
            quote_no="QT-A",
            remark="草稿编辑",
        )
        await repository.delete_lines(delivery.id)
        await repository.delete_fees(delivery.id)
        await repository.add_line(
            delivery_id=delivery.id,
            sample_record_id="sample-b",
            sample_code="SM-B",
            sample_type="confirm_sample",
            product_id="product-b",
            product_code="BAG-41",
            product_name="Eco Bag Plus",
            quantity="3",
            unit="pcs",
            remark="编辑后明细",
        )
        await repository.add_fee(
            delivery_id=delivery.id,
            fee_type="express",
            amount="21.00",
            currency="USD",
            payer_type="company",
            remark="FedEx",
        )
        lines = await repository.list_lines(delivery.id)
        fees = await repository.list_fees(delivery.id)

    assert updated is not None
    assert updated.delivery_date == date(2026, 6, 26)
    assert updated.express_company == "FedEx"
    assert len(lines) == 1
    assert lines[0].sample_record_id == "sample-b"
    assert lines[0].quantity == 3
    assert len(fees) == 1
    assert fees[0].amount == 21
