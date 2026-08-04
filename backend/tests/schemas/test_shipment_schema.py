import pytest
from pydantic import ValidationError

from app.modules.sales.shipments.schemas import (
    ShipmentApprove,
    ShipmentContractSelection,
    ShipmentPlanGenerate,
    ShipmentSubmit,
)


def test_shipment_plan_generate_accepts_multi_contract_selection() -> None:
    payload = ShipmentPlanGenerate(
        code="SP-SCHEMA-001",
        shipment_date="2026-08-18",
        planned_ship_date="2026-08-20",
        shipping_method="sea",
        port_of_loading="Ningbo",
        port_of_destination="Hamburg",
        vessel_name="COSCO Star",
        container_no="CONT-SCHEMA-001",
        booking_no="BOOK-SCHEMA-001",
        document_owner_name="单证部",
        estimated_payable_amount="780.00",
        remarks="两个出口合同合并出运",
        selections=[
            ShipmentContractSelection(contract_id="contract-a", quantity="300"),
            ShipmentContractSelection(contract_id="contract-b", quantity="200"),
        ],
    )

    assert payload.code == "SP-SCHEMA-001"
    assert str(payload.selections[0].quantity) == "300"
    assert str(payload.estimated_payable_amount) == "780.00"


def test_shipment_plan_generate_rejects_empty_selection() -> None:
    with pytest.raises(ValidationError):
        ShipmentPlanGenerate(
            code="SP-SCHEMA-EMPTY",
            shipment_date="2026-08-18",
            planned_ship_date="2026-08-20",
            shipping_method="sea",
            port_of_loading="Ningbo",
            port_of_destination="Hamburg",
            estimated_payable_amount="0",
            selections=[],
        )


def test_shipment_plan_generate_rejects_invalid_amounts() -> None:
    with pytest.raises(ValidationError):
        ShipmentContractSelection(contract_id="contract-a", quantity="0")

    with pytest.raises(ValidationError):
        ShipmentPlanGenerate(
            code="SP-SCHEMA-BAD",
            shipment_date="2026-08-18",
            planned_ship_date="2026-08-20",
            shipping_method="sea",
            port_of_loading="Ningbo",
            port_of_destination="Hamburg",
            estimated_payable_amount="-1",
            selections=[ShipmentContractSelection(contract_id="contract-a", quantity="1")],
        )


def test_shipment_submit_requires_reviewer_and_approve_requires_date() -> None:
    submit_payload = ShipmentSubmit(reviewer_id="u-reviewer")
    payload = ShipmentApprove(approved_at="2026-08-19")

    assert submit_payload.reviewer_id == "u-reviewer"
    assert payload.approved_at.isoformat() == "2026-08-19"

    with pytest.raises(ValidationError):
        ShipmentSubmit(reviewer_id="")
