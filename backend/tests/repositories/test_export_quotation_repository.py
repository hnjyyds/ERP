from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.quotations.repositories import (
    ExportQuotationRepository,
    ExportQuotationRow,
)


async def _create_quotation(repository: ExportQuotationRepository) -> str:
    quotation = await repository.create_quotation(
        code="QT-REPO-001",
        quote_date=date(2026, 7, 1),
        customer_id="customer-a",
        customer_name="客户 A",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        valid_until=date(2026, 7, 15),
        description="环保袋报价",
        approval_status="draft",
        owner_user_id="u-001",
    )
    await repository.add_line(
        quotation_id=quotation.id,
        product_id="product-a",
        product_code="BAG-40",
        product_name="Eco Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="1000",
        unit="pcs",
        unit_price="1.25",
        amount="1250.00",
        freight_method="sea",
        freight_amount="120.00",
        purchase_reference_supplier_name="供应商 A",
        purchase_reference_price="0.82",
        remark="首单报价",
    )
    return quotation.id


async def test_export_quotation_repository_filters_history_references_and_contract(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ExportQuotationRepository(session)
        quotation_id = await _create_quotation(repository)
        await repository.submit_quotation(quotation_id)
        approved = await repository.approve_quotation(
            quotation_id=quotation_id,
            reviewer_name="演示业务主管",
            approved_at=date(2026, 7, 2),
        )
        contract = await repository.confirm_contract(
            quotation_id=quotation_id,
            confirmed_at=date(2026, 7, 3),
            contract_no="EC-REPO-001",
        )
        await session.commit()

        quotations, total = await repository.list_quotations(
            q="Eco",
            approval_status="contract_generated",
            customer_id="customer-a",
            owner_user_id=None,
        )
        history, history_total = await repository.list_history(
            customer_id="customer-a",
            product_id="product-a",
        )
        references = await repository.list_purchase_references(product_id="product-a")

    assert approved is not None
    assert approved.approval_status == "approved"
    assert contract is not None
    assert contract.generated_contract_no == "EC-REPO-001"
    assert total == 1
    assert isinstance(quotations[0], ExportQuotationRow)
    assert quotations[0].code == "QT-REPO-001"
    assert history_total == 1
    assert history[0].code == "QT-REPO-001"
    assert references[0].supplier_name == "供应商 A"
    assert references[0].reference_price == "0.82"


async def test_export_quotation_repository_updates_header_and_replaces_lines(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ExportQuotationRepository(session)
        quotation_id = await _create_quotation(repository)
        updated = await repository.update_quotation(
            quotation_id=quotation_id,
            code="QT-REPO-001",
            quote_date=date(2026, 7, 2),
            customer_id="customer-a",
            customer_name="客户 A",
            sales_user_id="u-001",
            sales_user_name="演示业务主管",
            currency="USD",
            trade_term="CIF Hamburg",
            valid_until=date(2026, 7, 20),
            description="草稿编辑",
        )
        await repository.delete_lines(quotation_id)
        await repository.add_line(
            quotation_id=quotation_id,
            product_id="product-b",
            product_code="BAG-41",
            product_name="Eco Bag Plus",
            specification="42x38cm",
            model="BAG-41",
            quantity="500",
            unit="pcs",
            unit_price="1.50",
            amount="750.00",
            freight_method="air",
            freight_amount="80.00",
            purchase_reference_supplier_name="供应商 B",
            purchase_reference_price="1.02",
            remark="编辑后明细",
        )
        lines = await repository.list_lines(quotation_id)

    assert updated is not None
    assert updated.trade_term == "CIF Hamburg"
    assert updated.quote_date == date(2026, 7, 2)
    assert len(lines) == 1
    assert lines[0].product_id == "product-b"
    assert lines[0].amount == "750.00"
