from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.purchase.invoice_notices.repositories import (
    PurchaseInvoiceNoticeRepository,
    PurchaseInvoiceNoticeRow,
)


async def test_purchase_invoice_notice_repository_records_lines_status_and_reminders(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = PurchaseInvoiceNoticeRepository(session)
        notice = await repository.create_notice(
            code="PIN-REPO-001",
            notice_date=date(2026, 9, 4),
            supplier_id="supplier-pack-a",
            supplier_name="华东包装制品厂",
            customs_declaration_id="cd-001",
            customs_declaration_no="CD-2026-001",
            declaration_date=date(2026, 9, 3),
            currency="CNY",
            remarks="通知供应商开票",
            status="draft",
            owner_user_id="u-001",
        )
        line = await repository.add_line(
            notice_id=notice.id,
            purchase_contract_id="pc-001",
            purchase_contract_no="PC-001",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            customs_name="环保购物袋",
            invoice_name="无纺布购物袋",
            quantity="1000",
            unit="pcs",
            amount="5200.00",
            currency="CNY",
            remark="按报关品名开票",
        )
        refreshed = await repository.refresh_statistics(notice.id)
        sent = await repository.send_notice(
            notice_id=notice.id,
            sender_name="演示业务主管",
            sent_at=date(2026, 9, 5),
        )
        await repository.add_reminder(
            notice_id=notice.id,
            title="PIN-REPO-001 税票催收提醒",
            due_date=date(2026, 9, 12),
            owner_user_id="u-001",
        )
        received = await repository.receive_tax_invoice(
            notice_id=notice.id,
            tax_invoice_no="VAT-2026-001",
            received_at=date(2026, 9, 9),
        )
        await repository.close_reminders(notice.id)
        await session.commit()

        notices, total = await repository.list_notices(
            q="无纺布",
            status="received",
            supplier_id="supplier-pack-a",
            customs_declaration_id=None,
            owner_user_ids=None,
        )
        lines = await repository.list_lines(notice.id)
        reminders = await repository.list_reminders(notice.id)

    assert total == 1
    assert isinstance(notices[0], PurchaseInvoiceNoticeRow)
    assert refreshed is not None
    assert refreshed.total_quantity == "1000"
    assert refreshed.total_amount == "5200.00"
    assert sent is not None
    assert sent.status == "sent"
    assert received is not None
    assert received.status == "received"
    assert lines[0].id == line.id
    assert reminders[0].status == "done"
