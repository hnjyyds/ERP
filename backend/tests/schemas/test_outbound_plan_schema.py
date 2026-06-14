from datetime import date

import pytest
from pydantic import ValidationError

from app.modules.warehouse.outbound_plans.schemas import (
    OutboundPlanGenerateFromShipment,
    OutboundPlanSchedule,
)


def test_outbound_plan_generation_schema_accepts_finished_goods_source() -> None:
    payload = OutboundPlanGenerateFromShipment(
        shipment_plan_id="shipment-001",
        outbound_type="finished_goods_outbound",
        planned_date=date(2026, 8, 20),
    )
    schedule = OutboundPlanSchedule(
        planned_date=date(2026, 8, 18),
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-fg-01",
        location_name="成品区 A-01",
        operator_name="仓库主管",
    )

    assert payload.outbound_type == "finished_goods_outbound"
    assert payload.planned_date == date(2026, 8, 20)
    assert schedule.location_name == "成品区 A-01"


def test_outbound_plan_generation_schema_rejects_invalid_type() -> None:
    with pytest.raises(ValidationError):
        OutboundPlanGenerateFromShipment(
            shipment_plan_id="shipment-001",
            outbound_type="bad_type",
            planned_date=date(2026, 8, 20),
        )
