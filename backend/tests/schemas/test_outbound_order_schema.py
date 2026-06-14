from datetime import date

import pytest
from pydantic import ValidationError

from app.modules.warehouse.outbound_orders.schemas import (
    OutboundOrderApprove,
    OutboundOrderGenerateFromPlan,
    OutboundOrderLineShip,
)


def test_outbound_order_generation_schema_accepts_formal_mode() -> None:
    payload = OutboundOrderGenerateFromPlan(
        plan_id="plan-001",
        code="OO-001",
        outbound_mode="formal",
        outbound_at=date(2026, 9, 30),
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-fg-01",
        location_name="成品区 A-01",
        operator_name="仓库主管",
        exception_reason=None,
        lines=[
            OutboundOrderLineShip(
                plan_line_id="line-001",
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                quantity="300",
                unit="pcs",
            )
        ],
    )
    approve = OutboundOrderApprove(
        reviewer_name="业务主管",
        approved_at=date(2026, 9, 30),
        allow_negative=False,
    )

    assert payload.outbound_mode == "formal"
    assert payload.lines[0].quantity == 300
    assert approve.allow_negative is False


def test_outbound_order_generation_schema_accepts_exception_reason() -> None:
    payload = OutboundOrderGenerateFromPlan(
        plan_id="plan-001",
        code="OO-EX-001",
        outbound_mode="exception",
        outbound_at=date(2026, 9, 30),
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-fg-01",
        location_name="成品区 A-01",
        operator_name="仓库主管",
        exception_reason="客户临时改柜，先发 50 件",
        lines=[],
    )

    assert payload.exception_reason == "客户临时改柜，先发 50 件"


def test_outbound_order_generation_schema_rejects_invalid_mode_and_quantity() -> None:
    with pytest.raises(ValidationError):
        OutboundOrderGenerateFromPlan(
            plan_id="plan-001",
            code="OO-001",
            outbound_mode="bad_mode",
            outbound_at=date(2026, 9, 30),
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-fg-01",
            location_name="成品区 A-01",
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
