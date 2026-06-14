from datetime import date

import pytest
from pydantic import ValidationError

from app.modules.warehouse.inbound_plans.schemas import (
    InboundPlanGenerateFromPurchaseContract,
    InboundPlanSchedule,
)


def test_inbound_plan_generation_schema_accepts_purchase_inbound_type() -> None:
    payload = InboundPlanGenerateFromPurchaseContract(
        purchase_contract_id="pc-001",
        inbound_type="purchase_inbound",
        planned_date=date(2026, 8, 30),
    )

    assert payload.purchase_contract_id == "pc-001"
    assert payload.inbound_type == "purchase_inbound"
    assert payload.planned_date == date(2026, 8, 30)


def test_inbound_plan_generation_schema_rejects_invalid_inbound_type() -> None:
    with pytest.raises(ValidationError):
        InboundPlanGenerateFromPurchaseContract(
            purchase_contract_id="pc-001",
            inbound_type="unknown_inbound",
        )


def test_inbound_plan_schedule_schema_requires_location_information() -> None:
    payload = InboundPlanSchedule(
        planned_date=date(2026, 8, 28),
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-a-01",
        location_name="A-01",
        operator_name="仓库主管",
    )

    assert payload.warehouse_name == "宁波总仓"
    assert payload.location_name == "A-01"
