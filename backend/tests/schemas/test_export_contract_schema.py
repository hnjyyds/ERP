import pytest
from pydantic import ValidationError

from app.modules.sales.contracts.schemas import (
    ExportContractAdvancePaymentCreate,
    ExportContractCreate,
    ExportContractLineCreate,
)


def test_export_contract_schema_requires_positive_line_values() -> None:
    line = ExportContractLineCreate(
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        specification="40x35cm",
        model="BAG-40",
        quantity="1000",
        unit="pcs",
        unit_price="1.40",
        purchased_quantity="400",
        shipped_quantity="250",
        image_url="https://example.test/bag.png",
        remark="首单合同",
    )
    payload = ExportContractCreate(
        code="EC-SCHEMA-001",
        contract_date="2026-07-03",
        customer_id="customer-euro-home",
        customer_name="欧陆家居用品有限公司",
        sales_user_id="u-001",
        sales_user_name="演示业务主管",
        currency="USD",
        trade_term="FOB Ningbo",
        planned_ship_date="2026-08-10",
        payment_terms="30% T/T in advance, balance before shipment",
        source_quotation_id="quotation-001",
        source_quotation_no="QT-SCHEMA-001",
        remarks="客户确认后签订出口合同",
        lines=[line],
    )

    assert str(payload.lines[0].quantity) == "1000"
    assert str(payload.lines[0].unit_price) == "1.40"

    with pytest.raises(ValidationError):
        ExportContractLineCreate(
            product_name="Eco Shopping Bag",
            quantity="0",
            unit="pcs",
            unit_price="1.40",
        )


def test_export_contract_schema_rejects_empty_lines_and_over_progress() -> None:
    with pytest.raises(ValidationError):
        ExportContractCreate(
            code="EC-SCHEMA-EMPTY",
            contract_date="2026-07-03",
            customer_name="欧陆家居用品有限公司",
            currency="USD",
            trade_term="FOB Ningbo",
            planned_ship_date="2026-08-10",
            payment_terms="T/T",
            lines=[],
        )

    with pytest.raises(ValidationError):
        ExportContractLineCreate(
            product_name="Eco Shopping Bag",
            quantity="1000",
            unit="pcs",
            unit_price="1.40",
            purchased_quantity="1001",
        )


def test_export_contract_advance_payment_requires_positive_amount() -> None:
    payment = ExportContractAdvancePaymentCreate(
        payment_no="AR-SCHEMA-001",
        received_at="2026-07-05",
        amount="300.00",
        currency="USD",
        payer_name="Euro Home Retail Ltd.",
        remark="30% 预收款",
    )

    assert payment.amount == 300

    with pytest.raises(ValidationError):
        ExportContractAdvancePaymentCreate(
            payment_no="AR-SCHEMA-BAD",
            received_at="2026-07-05",
            amount="0",
            currency="USD",
            payer_name="Euro Home Retail Ltd.",
        )
