import pytest
from pydantic import ValidationError

from app.modules.sales.quotations.schemas import ExportQuotationCreate, ExportQuotationLineCreate


def test_export_quotation_schema_requires_positive_quantity_and_price() -> None:
    line = ExportQuotationLineCreate(
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="1000",
        unit="pcs",
        unit_price="1.25",
        freight_method="sea",
        freight_amount="120.00",
        purchase_reference_supplier_name="华东包装制品厂",
        purchase_reference_price="0.82",
        remark="首单报价",
    )

    payload = ExportQuotationCreate(
        code="QT-SCHEMA-001",
        quote_date="2026-07-01",
        customer_id="customer-euro-home",
        customer_name="欧陆家居用品有限公司",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        valid_until="2026-07-15",
        description="环保袋首单报价",
        lines=[line],
    )

    assert payload.lines[0].quantity == 1000
    assert payload.lines[0].unit_price == 1.25

    with pytest.raises(ValidationError):
        ExportQuotationLineCreate(
            product_name="Eco Shopping Bag",
            quantity="0",
            unit="pcs",
            unit_price="1.25",
            freight_method="sea",
            freight_amount="0",
        )


def test_export_quotation_schema_requires_at_least_one_line() -> None:
    with pytest.raises(ValidationError):
        ExportQuotationCreate(
            code="QT-SCHEMA-EMPTY",
            quote_date="2026-07-01",
            customer_id="customer-euro-home",
            customer_name="欧陆家居用品有限公司",
            sales_user_id="u-001",
            sales_user_name="演示业务主管",
            currency="USD",
            trade_term="FOB Ningbo",
            valid_until="2026-07-15",
            description="空明细报价",
            lines=[],
        )
