from datetime import date, datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.modules.quality.inspections.schemas import (
    QualityInspectionCreate,
    QualityInspectionIssueCreate,
    QualityInspectionLineCreate,
)


def test_quality_inspection_create_schema_accepts_lines_issues_and_attachment_group() -> None:
    payload = QualityInspectionCreate(
        code="QC-2026-001",
        purchase_contract_id="pc-001",
        inspected_at=date(2026, 8, 19),
        result="failed",
        inspector_id="u-qc-001",
        inspector_name="QC 张工",
        issue_summary="外箱破损，需返修",
        attachment_group_id="attach-qc-001",
        lines=[
            QualityInspectionLineCreate(
                purchase_contract_line_id="pcl-001",
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                inspected_quantity="120",
                failed_quantity="6",
                unit="pcs",
                result="failed",
                remark="抽检 6 件不合格",
            )
        ],
        issues=[
            QualityInspectionIssueCreate(
                issue_type="包装破损",
                severity="major",
                description="外箱 6 件破损",
                corrective_action="供应商重新包装后复检",
                status="open",
                attachment_group_id="attach-qc-issue-001",
            )
        ],
    )

    assert payload.result == "failed"
    assert payload.lines[0].inspected_quantity == Decimal("120")
    assert payload.lines[0].failed_quantity == Decimal("6")
    assert payload.issues[0].severity == "major"


def test_quality_inspection_schema_accepts_a_scheduled_pending_task_without_result() -> None:
    payload = QualityInspectionCreate(
        code="QC-TASK-001",
        purchase_contract_id="pc-001",
        scheduled_at=datetime(2026, 8, 20, 9, 30),
        status="pending",
        inspector_id="u-qc-001",
        inspector_name="QC 张工",
    )

    assert payload.status == "pending"
    assert payload.scheduled_at == datetime(2026, 8, 20, 9, 30)
    assert payload.inspected_at is None
    assert payload.result is None
    assert payload.lines == []


def test_quality_inspection_schema_requires_result_and_lines_when_completed() -> None:
    with pytest.raises(ValidationError, match="已完成的 QC 任务必须填写查验日期、结果和明细"):
        QualityInspectionCreate(
            code="QC-TASK-COMPLETE-001",
            purchase_contract_id="pc-001",
            scheduled_at=datetime(2026, 8, 20, 9, 30),
            status="completed",
            inspector_id="u-qc-001",
            inspector_name="QC 张工",
        )


def test_quality_inspection_schema_rejects_invalid_result_and_empty_lines() -> None:
    with pytest.raises(ValidationError):
        QualityInspectionCreate(
            code="QC-BAD-001",
            purchase_contract_id="pc-001",
            inspected_at=date(2026, 8, 19),
            result="ok",
            inspector_name="QC 张工",
            lines=[
                QualityInspectionLineCreate(
                    product_name="Eco Shopping Bag",
                    inspected_quantity="120",
                    unit="pcs",
                    result="passed",
                )
            ],
        )

    with pytest.raises(ValidationError):
        QualityInspectionCreate(
            code="QC-EMPTY-001",
            purchase_contract_id="pc-001",
            inspected_at=date(2026, 8, 19),
            result="passed",
            inspector_name="QC 张工",
            lines=[],
        )


def test_quality_inspection_schema_forbids_extra_fields() -> None:
    with pytest.raises(ValidationError):
        QualityInspectionLineCreate(
            product_name="Eco Shopping Bag",
            inspected_quantity="120",
            unit="pcs",
            result="passed",
            unexpected="field",
        )


def test_quality_inspection_schema_rejects_blank_required_text() -> None:
    with pytest.raises(ValidationError) as exc_info:
        QualityInspectionCreate(
            code="   ",
            purchase_contract_id=" ",
            inspected_at=date(2026, 8, 19),
            result="passed",
            inspector_id="",
            inspector_name="  ",
            lines=[
                QualityInspectionLineCreate(
                    product_name="Eco Shopping Bag",
                    inspected_quantity="120",
                    unit="pcs",
                    result="passed",
                )
            ],
        )

    error_locations = {tuple(error["loc"]) for error in exc_info.value.errors()}
    assert error_locations == {
        ("code",),
        ("purchase_contract_id",),
        ("inspector_id",),
        ("inspector_name",),
    }


def test_quality_inspection_line_schema_rejects_blank_text_and_invalid_quantities() -> None:
    with pytest.raises(ValidationError) as exc_info:
        QualityInspectionLineCreate(
            product_name=" ",
            inspected_quantity="0",
            failed_quantity="-1",
            unit="  ",
            result="passed",
        )

    error_locations = {tuple(error["loc"]) for error in exc_info.value.errors()}
    assert error_locations == {
        ("product_name",),
        ("inspected_quantity",),
        ("failed_quantity",),
        ("unit",),
    }

    with pytest.raises(ValidationError, match="不合格数量不能大于查验数量"):
        QualityInspectionLineCreate(
            product_name="Eco Shopping Bag",
            inspected_quantity="10",
            failed_quantity="11",
            unit="pcs",
            result="failed",
        )


def test_quality_issue_schema_only_allows_open_status_on_creation() -> None:
    with pytest.raises(ValidationError):
        QualityInspectionIssueCreate(
            issue_type="包装破损",
            severity="major",
            description="供应商尚未提交整改证明",
            status="resolved",
        )
