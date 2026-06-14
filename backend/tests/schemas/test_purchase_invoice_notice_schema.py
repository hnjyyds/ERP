from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.modules.purchase.invoice_notices.schemas import (
    PurchaseInvoiceNoticeGenerateFromDeclaration,
    PurchaseInvoiceNoticeLineCreate,
    PurchaseInvoiceNoticeReceiveTaxInvoice,
    PurchaseInvoiceNoticeSend,
)


def test_purchase_invoice_notice_generation_schema_groups_supplier_lines() -> None:
    payload = PurchaseInvoiceNoticeGenerateFromDeclaration(
        customs_declaration_id="cd-001",
        customs_declaration_no="CD-2026-001",
        declaration_date=date(2026, 9, 3),
        notice_date=date(2026, 9, 4),
        currency="CNY",
        remarks="报关完成后通知供应商开票",
        lines=[
            PurchaseInvoiceNoticeLineCreate(
                supplier_id="supplier-pack-a",
                supplier_name="华东包装制品厂",
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
                remark="按报关品名开票",
            )
        ],
    )

    assert payload.lines[0].quantity == Decimal("1000")
    assert payload.lines[0].amount == Decimal("5200.00")
    assert payload.currency == "CNY"


def test_purchase_invoice_notice_generation_schema_rejects_empty_lines() -> None:
    with pytest.raises(ValidationError):
        PurchaseInvoiceNoticeGenerateFromDeclaration(
            customs_declaration_no="CD-EMPTY",
            declaration_date=date(2026, 9, 3),
            notice_date=date(2026, 9, 4),
            currency="CNY",
            lines=[],
        )


def test_purchase_invoice_notice_action_schemas() -> None:
    send_payload = PurchaseInvoiceNoticeSend(
        sender_name="演示业务主管",
        sent_at=date(2026, 9, 5),
    )
    receive_payload = PurchaseInvoiceNoticeReceiveTaxInvoice(
        tax_invoice_no="VAT-2026-001",
        received_at=date(2026, 9, 9),
    )

    assert send_payload.sender_name == "演示业务主管"
    assert receive_payload.tax_invoice_no == "VAT-2026-001"
