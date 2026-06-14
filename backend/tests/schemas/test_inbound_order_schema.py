from datetime import date

import pytest
from pydantic import ValidationError

from app.modules.warehouse.inbound_orders.schemas import (
    InboundOrderGenerateFromPlan,
    InboundOrderLineReceive,
)


def test_inbound_order_generation_schema_accepts_formal_mode() -> None:
    payload = InboundOrderGenerateFromPlan(
        plan_id="plan-001",
        code="IO-001",
        inbound_mode="formal",
        inbound_at=date(2026, 8, 30),
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-a-01",
        location_name="A-01",
        operator_name="仓库主管",
        lines=[
            InboundOrderLineReceive(
                plan_line_id="line-001",
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                quantity="1000",
                unit="pcs",
            )
        ],
    )

    assert payload.inbound_mode == "formal"
    assert payload.lines[0].quantity == 1000


def test_inbound_order_generation_schema_rejects_invalid_mode_and_quantity() -> None:
    with pytest.raises(ValidationError):
        InboundOrderGenerateFromPlan(
            plan_id="plan-001",
            code="IO-001",
            inbound_mode="bad_mode",
            inbound_at=date(2026, 8, 30),
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-a-01",
            location_name="A-01",
            operator_name="仓库主管",
            lines=[
                {
                    "plan_line_id": "line-001",
                    "product_name": "Eco Shopping Bag",
                    "quantity": "0",
                    "unit": "pcs",
                }
            ],
        )
