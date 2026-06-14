from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.purchase.inquiries.repositories import (
    PurchaseInquiryLineWrite,
    PurchaseInquiryRepository,
    PurchaseInquiryRow,
)
from app.modules.sample.records.repositories import SampleRecordRepository


async def test_purchase_inquiry_repository_records_quotes_and_sample_evidence(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = PurchaseInquiryRepository(session)
        sample_repository = SampleRecordRepository(session)
        inquiry = await repository.create_inquiry(
            code="PI-REPO-001",
            inquiry_date=date(2026, 8, 1),
            buyer_user_id="u-001",
            buyer_user_name="演示业务主管",
            status="draft",
            remarks="环保袋供应商询价",
            owner_user_id="u-001",
        )
        line = await repository.add_line(
            inquiry_id=inquiry.id,
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            specification="40x35cm",
            model="BAG-40",
            quantity="1000",
            unit="pcs",
        )
        await sample_repository.create_record(
            code="SM-PI-REPO-001",
            sample_type="confirm_sample",
            status="registered",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            customer_id=None,
            customer_name=None,
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            customer_sku=None,
            supplier_sku="PACK-A-40",
            purchase_contract_id=None,
            purchase_contract_no=None,
            source_type="purchase_inquiry",
            source_id=inquiry.id,
            source_code=inquiry.code,
            source_note="询价前供应商样品",
            received_at=date(2026, 7, 28),
            submitted_at=None,
            quantity="3",
            unit="pcs",
            description="供应商已提供确认样",
            owner_user_id="u-001",
        )
        await repository.add_supplier_quotation(
            inquiry_id=inquiry.id,
            inquiry_line_id=line.id,
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            quoted_at=date(2026, 8, 2),
            unit_price="0.78",
            currency="USD",
            lead_time_days=18,
            min_order_quantity="800",
            sample_available=True,
            remark="含环保包装",
        )
        await repository.add_supplier_quotation(
            inquiry_id=inquiry.id,
            inquiry_line_id=line.id,
            supplier_id="supplier-pack-b",
            supplier_name="宁波成品包装厂",
            quoted_at=date(2026, 8, 2),
            unit_price="0.82",
            currency="USD",
            lead_time_days=15,
            min_order_quantity="1000",
            sample_available=False,
            remark="交期更短",
        )
        await repository.mark_template_sent(
            inquiry_id=inquiry.id,
            template_name="标准采购询价模板",
            sent_at=date(2026, 8, 1),
        )
        await session.commit()

        inquiries, total = await repository.list_inquiries(
            q="环保袋",
            status="sent",
            product_id="product-bag",
            supplier_id="supplier-pack-a",
            owner_user_id=None,
        )
        lines = await repository.list_lines(inquiry.id)
        quotations = await repository.list_supplier_quotations(inquiry.id)
        samples = await repository.list_supplier_sample_evidence(
            product_id="product-bag",
            supplier_id="supplier-pack-a",
        )
        references = await repository.list_purchase_references(product_id="product-bag")

    assert total == 1
    assert isinstance(inquiries[0], PurchaseInquiryRow)
    assert inquiries[0].status == "sent"
    assert lines[0].product_name == "Eco Shopping Bag"
    assert len(quotations) == 2
    assert quotations[0].unit_price == "0.78"
    assert quotations[0].has_sample is True
    assert samples[0].sample_code == "SM-PI-REPO-001"
    assert references[0].supplier_name == "华东包装制品厂"
    assert references[0].reference_price == "0.78"


async def test_purchase_inquiry_repository_updates_header_and_replaces_lines(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = PurchaseInquiryRepository(session)
        inquiry = await repository.create_inquiry(
            code="PI-REPO-EDIT",
            inquiry_date=date(2026, 8, 1),
            buyer_user_id="u-001",
            buyer_user_name="演示业务主管",
            status="draft",
            remarks="原询价",
            owner_user_id="u-001",
        )
        await repository.add_line(
            inquiry_id=inquiry.id,
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            specification="40x35cm",
            model="BAG-40",
            quantity="1000",
            unit="pcs",
        )

        updated = await repository.update_inquiry(
            inquiry_id=inquiry.id,
            code="PI-REPO-EDIT",
            inquiry_date=date(2026, 8, 3),
            buyer_user_id="u-002",
            buyer_user_name="采购专员",
            remarks="编辑后的采购询价",
        )
        replaced_lines = await repository.replace_lines(
            inquiry_id=inquiry.id,
            lines=[
                PurchaseInquiryLineWrite(
                    product_id="product-bag",
                    product_code="BAG-40",
                    product_name="Eco Shopping Bag",
                    specification="40x35cm",
                    model="BAG-40",
                    quantity="1200",
                    unit="pcs",
                )
            ],
        )
        await session.commit()

        lines = await repository.list_lines(inquiry.id)

    assert updated is not None
    assert updated.inquiry_date == date(2026, 8, 3)
    assert updated.buyer_user_name == "采购专员"
    assert len(replaced_lines) == 1
    assert len(lines) == 1
    assert lines[0].quantity == 1200
    assert lines[0].id == replaced_lines[0].id
    assert lines[0].product_name == "Eco Shopping Bag"
