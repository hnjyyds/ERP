from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.purchase.contracts.repositories import (
    PurchaseContractRepository,
    PurchaseContractRow,
)


async def test_purchase_contract_repository_records_lines_sources_and_reminders(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = PurchaseContractRepository(session)
        contract = await repository.create_contract(
            code="PC-REPO-001",
            contract_date=date(2026, 8, 5),
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            buyer_user_id="u-001",
            buyer_user_name="演示业务主管",
            currency="USD",
            delivery_date=date(2026, 8, 28),
            payment_terms="30% 预付，70% 出货前",
            source_type="export_contract",
            remarks="由出口合同生成采购合同",
            approval_status="draft",
            owner_user_id="u-001",
        )
        line = await repository.add_line(
            contract_id=contract.id,
            product_id="accessory-cotton-rope",
            product_code="ACC-ROPE",
            product_name="棉绳",
            specification="5mm",
            model="ROPE-5",
            quantity="450",
            unit="m",
            unit_price="0.12",
            amount="54.00",
            source_export_contract_id="ec-001",
            source_export_contract_no="EC-001",
            source_export_contract_line_id="ecl-001",
            remark="按配件耗料生成",
        )
        await repository.add_source_link(
            contract_id=contract.id,
            export_contract_id="ec-001",
            export_contract_no="EC-001",
            export_contract_line_id="ecl-001",
            customer_name="欧陆家居用品有限公司",
            product_id="product-bag",
            product_code="BAG-40",
            demand_quantity="1000",
            unit="pcs",
        )
        await repository.add_reminder(
            contract_id=contract.id,
            reminder_type="delivery",
            title="供应商交货提醒",
            due_date=date(2026, 8, 28),
            amount=None,
            currency="USD",
        )
        await repository.add_reminder(
            contract_id=contract.id,
            reminder_type="payment",
            title="供应商付款提醒",
            due_date=date(2026, 8, 12),
            amount="16.20",
            currency="USD",
        )
        refreshed = await repository.refresh_statistics(contract.id)
        await session.commit()

        contracts, total = await repository.list_contracts(
            q="棉绳",
            approval_status="draft",
            supplier_id="supplier-pack-a",
            owner_user_ids=None,
        )
        lines = await repository.list_lines(contract.id)
        sources = await repository.list_source_links(contract.id)
        reminders = await repository.list_reminders(contract.id)

    assert total == 1
    assert isinstance(contracts[0], PurchaseContractRow)
    assert refreshed is not None
    assert refreshed.total_quantity == "450"
    assert refreshed.total_amount == "54.00"
    assert lines[0].id == line.id
    assert lines[0].amount == "54.00"
    assert sources[0].export_contract_no == "EC-001"
    assert [item.reminder_type for item in reminders] == ["payment", "delivery"]
