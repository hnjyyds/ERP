from datetime import date

import pytest
from pydantic import ValidationError

from app.modules.followup.schemas import (
    FollowProcessTemplateCreate,
    FollowProcessTemplateNodeCreate,
    FollowSourceEventSync,
    PurchaseFollowPlanGenerateFromContract,
)


def _node(
    *,
    node_code: str = "confirm_sample_submitted",
    node_name: str = "确认样提交",
    sequence_no: int = 20,
    actual_date_source: str = "sample_confirm",
) -> FollowProcessTemplateNodeCreate:
    return FollowProcessTemplateNodeCreate(
        node_code=node_code,
        node_name=node_name,
        sequence_no=sequence_no,
        standard_days=3,
        remind_before_days=1,
        actual_date_source=actual_date_source,
    )


def test_followup_template_schema_accepts_configured_nodes() -> None:
    payload = FollowProcessTemplateCreate(
        name="标准采购跟单流程",
        enabled=True,
        is_default=True,
        nodes=[
            _node(
                node_code="contract_confirmed",
                node_name="合同下单确立",
                sequence_no=10,
                actual_date_source="purchase_contract",
            ),
            _node(),
        ],
    )

    assert payload.nodes[0].standard_days == 3
    assert payload.nodes[1].actual_date_source == "sample_confirm"


def test_followup_template_schema_requires_nodes() -> None:
    with pytest.raises(ValidationError):
        FollowProcessTemplateCreate(
            name="空模板",
            enabled=True,
            is_default=False,
            nodes=[],
        )


def test_followup_plan_and_source_event_payloads() -> None:
    plan = PurchaseFollowPlanGenerateFromContract(
        purchase_contract_id="pc-001",
        as_of=date(2026, 8, 5),
    )
    event = FollowSourceEventSync(
        purchase_contract_id="pc-001",
        node_code="confirm_sample_submitted",
        source_record_type="sample_followup_event",
        source_record_id="sample-event-001",
        actual_date=date(2026, 8, 8),
        source_summary="确认样提交",
    )

    assert plan.purchase_contract_id == "pc-001"
    assert event.node_code == "confirm_sample_submitted"


def test_followup_source_event_rejects_manual_source() -> None:
    with pytest.raises(ValidationError):
        FollowSourceEventSync(
            purchase_contract_id="pc-001",
            node_code="confirm_sample_submitted",
            source_record_type="manual",
            source_record_id="manual-001",
            actual_date=date(2026, 8, 8),
            source_summary="手工录入",
        )
