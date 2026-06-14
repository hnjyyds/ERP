from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sample.records.repositories import SampleRecordRepository, SampleRecordRow


async def test_sample_record_repository_filters_and_maps_rows(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = SampleRecordRepository(session)
        record = await repository.create_record(
            code="SM-REPO-001",
            sample_type="confirm_sample",
            status="registered",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            customer_id="customer-a",
            customer_name="客户 A",
            supplier_id="supplier-a",
            supplier_name="供应商 A",
            customer_sku="CUST-BAG-40",
            supplier_sku="SUP-BAG-40",
            purchase_contract_id="pc-a",
            purchase_contract_no="PC-A",
            source_type="sample_request",
            source_id="sr-a",
            source_code="SR-A",
            source_note="来自打样",
            received_at=date(2026, 6, 22),
            submitted_at=date(2026, 6, 23),
            quantity="5",
            unit="pcs",
            description="确认样",
            owner_user_id="u-001",
        )
        await repository.add_image(
            sample_record_id=record.id,
            file_id="file-front",
            filename="front.jpg",
            url="https://assets.example.test/front.jpg",
            caption="正面",
            is_primary=True,
        )
        await repository.add_stock_event(
            sample_record_id=record.id,
            event_type="received",
            quantity="5",
            unit="pcs",
            occurred_at=date(2026, 6, 22),
            delivery_no=None,
            recipient=None,
            note="收样",
        )
        await repository.add_stock_event(
            sample_record_id=record.id,
            event_type="delivered",
            quantity="2",
            unit="pcs",
            occurred_at=date(2026, 6, 24),
            delivery_no="SD-REPO-001",
            recipient="客户 A",
            note="寄样",
        )
        await repository.add_followup_event(
            sample_record_id=record.id,
            purchase_contract_id="pc-a",
            purchase_contract_no="PC-A",
            node_code="confirm_sample_submitted",
            node_label="确认样提交",
            actual_date=date(2026, 6, 23),
            event_type="sample_completed",
        )
        await session.commit()

        records, total = await repository.list_records(
            q="Eco",
            sample_type="confirm_sample",
            customer_id="customer-a",
            purchase_contract_id="pc-a",
            owner_user_id=None,
        )
        images = await repository.list_images(record.id)
        stock_summary = await repository.get_stock_summary(record.id)
        stock_events = await repository.list_stock_events(record.id)
        followup_events = await repository.list_followup_events(record.id)

    assert total == 1
    assert isinstance(records[0], SampleRecordRow)
    assert records[0].code == "SM-REPO-001"
    assert images[0].filename == "front.jpg"
    assert stock_summary is not None
    assert f"{stock_summary.delivered_quantity:.0f}" == "2"
    assert f"{stock_summary.retained_quantity:.0f}" == "3"
    assert stock_events[0].delivery_no == "SD-REPO-001"
    assert followup_events[0].node_code == "confirm_sample_submitted"
