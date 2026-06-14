from datetime import date
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
