from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sales.contracts.repositories import ExportContractRepository, ExportContractRow


async def _create_contract(repository: ExportContractRepository) -> str:
    contract = await repository.create_contract(
        code="EC-REPO-001",
        contract_date=date(2026, 7, 3),
        customer_id="customer-a",
        customer_name="客户 A",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        planned_ship_date=date(2026, 8, 10),
        payment_terms="30% T/T in advance",
        source_quotation_id="quotation-a",
        source_quotation_no="QT-REPO-001",
        remarks="出口合同",
        approval_status="draft",
        owner_user_id="u-001",
    )
    await repository.add_line(
        contract_id=contract.id,
        product_id="product-a",
        product_code="BAG-40",
        product_name="Eco Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="1000",
        unit="pcs",
        unit_price="1.40",
        amount="1400.00",
        purchased_quantity="400",
        shipped_quantity="250",
        image_url="https://example.test/bag.png",
        remark="首单合同",
    )
    await repository.refresh_statistics(contract.id)
    return contract.id


async def test_export_contract_repository_filters_signature_payment_and_statistics(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ExportContractRepository(session)
        contract_id = await _create_contract(repository)
        await repository.add_signature(
            contract_id=contract_id,
            signed_by="Anna Schmidt",
            signed_at=date(2026, 7, 4),
            signature_method="email_scan",
            file_no="SIGN-REPO-001",
            remark="客户邮件回签",
        )
        await repository.add_advance_payment(
            contract_id=contract_id,
            payment_no="AR-REPO-001",
            received_at=date(2026, 7, 5),
            amount="300.00",
            currency="USD",
            payer_name="Euro Home Retail Ltd.",
            remark="30% 预收款",
        )
        submitted = await repository.submit_contract(contract_id)
        approved = await repository.approve_contract(
            contract_id=contract_id,
            reviewer_name="演示业务主管",
            approved_at=date(2026, 7, 6),
        )
        await repository.add_event(
            contract_id=contract_id,
            contract_no="EC-REPO-001",
            event_type="ExportContractApproved",
            payload='{"contract_no":"EC-REPO-001"}',
        )
        await session.commit()

        contracts, total = await repository.list_contracts(
            q="Eco",
            approval_status="approved",
            customer_id="customer-a",
            owner_user_id=None,
        )
        lines = await repository.list_lines(contract_id)
        signatures = await repository.list_signatures(contract_id)
        payments = await repository.list_advance_payments(contract_id)
        events = await repository.list_events(contract_id)

    assert submitted is not None
    assert submitted.approval_status == "submitted"
    assert approved is not None
    assert approved.approval_status == "approved"
    assert total == 1
    assert isinstance(contracts[0], ExportContractRow)
    assert contracts[0].code == "EC-REPO-001"
    assert contracts[0].total_quantity == "1000"
    assert contracts[0].total_amount == "1400.00"
    assert contracts[0].shipped_quantity == "250"
    assert contracts[0].shipped_amount == "350.00"
    assert contracts[0].purchased_quantity == "400"
    assert lines[0].unpurchased_quantity == "600"
    assert signatures[0].signed_by == "Anna Schmidt"
    assert payments[0].amount == "300.00"
    assert events[0].event_type == "ExportContractApproved"


async def test_export_contract_repository_updates_draft_and_replaces_lines(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ExportContractRepository(session)
        contract_id = await _create_contract(repository)
        updated = await repository.update_contract(
            contract_id=contract_id,
            code="EC-REPO-001",
            contract_date=date(2026, 7, 4),
            customer_id="customer-a",
            customer_name="客户 A",
            sales_user_id="u-001",
            sales_user_name="演示业务主管",
            currency="USD",
            trade_term="CIF Hamburg",
            planned_ship_date=date(2026, 8, 20),
            payment_terms="LC at sight",
            source_quotation_id="quotation-a",
            source_quotation_no="QT-REPO-001",
            remarks="草稿编辑",
        )
        await repository.delete_lines(contract_id)
        await repository.add_line(
            contract_id=contract_id,
            product_id="product-b",
            product_code="BAG-41",
            product_name="Eco Bag Plus",
            specification="42x38cm",
            model="BAG-41",
            quantity="500",
            unit="pcs",
            unit_price="1.50",
            amount="750.00",
            purchased_quantity="200",
            shipped_quantity="100",
            image_url=None,
            remark="编辑后明细",
        )
        await repository.refresh_statistics(contract_id)
        lines = await repository.list_lines(contract_id)

    assert updated is not None
    assert updated.trade_term == "CIF Hamburg"
    assert updated.planned_ship_date == date(2026, 8, 20)
    assert len(lines) == 1
    assert lines[0].product_id == "product-b"
    assert lines[0].amount == "750.00"
