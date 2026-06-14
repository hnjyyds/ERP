from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.modules.purchase.contracts.schemas import (
    PurchaseContractCreate,
    PurchaseContractGenerateFromExportContracts,
    PurchaseContractLineCreate,
    PurchaseContractSourceSelection,
)


def test_purchase_contract_schema_accepts_stock_purchase_payload() -> None:
    payload = PurchaseContractCreate(
        code="PC-SCHEMA-001",
        contract_date=date(2026, 8, 5),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        currency="USD",
        delivery_date=date(2026, 8, 28),
        payment_terms="30% 预付，70% 出货前",
        source_type="stock_purchase",
        remarks="库存采购",
        lines=[
            PurchaseContractLineCreate(
                product_id="accessory-cotton-rope",
                product_code="ACC-ROPE",
                product_name="棉绳",
                specification="5mm",
                model="ROPE-5",
                quantity="450",
                unit="m",
                unit_price="0.12",
                source_export_contract_id=None,
                source_export_contract_no=None,
                source_export_contract_line_id=None,
                remark="按安全库存采购",
            )
        ],
    )

    assert payload.lines[0].quantity == Decimal("450")
    assert payload.source_type == "stock_purchase"


def test_purchase_contract_generation_schema_accepts_multiple_export_contracts() -> None:
    payload = PurchaseContractGenerateFromExportContracts(
        code="PC-SCHEMA-GEN",
        contract_date=date(2026, 8, 6),
        supplier_id="supplier-pack-a",
        supplier_name="华东包装制品厂",
        buyer_user_id="u-001",
        buyer_user_name="演示业务主管",
        currency="USD",
        delivery_date=date(2026, 8, 30),
        payment_terms="月结 30 天",
        unit_price="0.12",
        remarks="两个出口合同合并采购",
        sources=[
            PurchaseContractSourceSelection(export_contract_id="ec-001"),
            PurchaseContractSourceSelection(export_contract_id="ec-002"),
        ],
    )

    assert payload.unit_price == Decimal("0.12")
    assert len(payload.sources) == 2


def test_purchase_contract_schema_rejects_empty_lines() -> None:
    with pytest.raises(ValidationError):
        PurchaseContractCreate(
            code="PC-SCHEMA-EMPTY",
            contract_date=date(2026, 8, 5),
            supplier_name="华东包装制品厂",
            currency="USD",
            delivery_date=date(2026, 8, 28),
            payment_terms="30% 预付",
            source_type="stock_purchase",
            lines=[],
        )
