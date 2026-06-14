from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.modules.purchase.inquiries.schemas import (
    PurchaseInquiryCreate,
    PurchaseInquiryLineCreate,
    PurchaseInquiryTemplateSend,
    PurchaseInquiryUpdate,
    SupplierQuotationCreate,
)


def test_purchase_inquiry_schema_accepts_lines_and_template_payload() -> None:
    payload = PurchaseInquiryCreate(
        code="PI-SCHEMA-001",
        inquiry_date=date(2026, 8, 1),
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        remarks="环保袋供应商询价",
        lines=[
            PurchaseInquiryLineCreate(
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                specification="40x35cm",
                model="BAG-40",
                quantity="1000",
                unit="pcs",
            )
        ],
    )
    template = PurchaseInquiryTemplateSend(
        template_name="标准采购询价模板",
        recipient_emails=["supplier@example.com"],
    )

    assert payload.lines[0].quantity == Decimal("1000")
    assert template.recipient_emails == ["supplier@example.com"]


def test_purchase_inquiry_update_schema_uses_same_line_contract() -> None:
    payload = PurchaseInquiryUpdate(
        code="PI-SCHEMA-EDIT",
        inquiry_date=date(2026, 8, 3),
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        remarks="编辑后的采购询价",
        lines=[
            PurchaseInquiryLineCreate(
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

    assert payload.lines[0].quantity == Decimal("1200")
    assert payload.remarks == "编辑后的采购询价"


def test_supplier_quotation_schema_rejects_invalid_price_and_quantity() -> None:
    with pytest.raises(ValidationError):
        SupplierQuotationCreate(
            inquiry_line_id="line-001",
            supplier_id="supplier-pack",
            supplier_name="华东包装制品厂",
            quoted_at=date(2026, 8, 2),
            unit_price="0",
            currency="USD",
            lead_time_days=20,
            min_order_quantity="-1",
        )


def test_purchase_inquiry_schema_rejects_empty_lines() -> None:
    with pytest.raises(ValidationError):
        PurchaseInquiryCreate(
            code="PI-SCHEMA-EMPTY",
            inquiry_date=date(2026, 8, 1),
            lines=[],
        )
