from datetime import datetime, time
from decimal import Decimal

from app.modules.quality.inspections.models import (
    QualityInspection,
    QualityInspectionAttachment,
    QualityInspectionEvent,
    QualityInspectionLine,
    QualityIssue,
)
from app.modules.quality.inspections.rows import (
    QualityAttachmentRow,
    QualityInspectionEventRow,
    QualityInspectionLineRow,
    QualityInspectionRow,
    QualityIssueRow,
)


def format_quantity(value: Decimal) -> str:
    return f"{value:.4f}".rstrip("0").rstrip(".")


def map_quality_inspection(inspection: QualityInspection) -> QualityInspectionRow:
    return QualityInspectionRow(
        id=inspection.id,
        code=inspection.code,
        purchase_contract_id=inspection.purchase_contract_id,
        purchase_contract_no=inspection.purchase_contract_no,
        supplier_id=inspection.supplier_id,
        supplier_name=inspection.supplier_name,
        status=inspection.status,
        scheduled_at=inspection.scheduled_at
        or datetime.combine(inspection.inspected_at, time(hour=9)),
        inspected_at=inspection.inspected_at,
        result=inspection.result,
        inspector_id=inspection.inspector_id,
        inspector_name=inspection.inspector_name,
        qc_user_id=inspection.qc_user_id,
        qc_user_name=inspection.qc_user_name,
        issue_summary=inspection.issue_summary,
        attachment_group_id=inspection.attachment_group_id,
        parent_inspection_id=inspection.parent_inspection_id,
        reinspection_no=inspection.reinspection_no,
        cancel_reason=inspection.cancel_reason,
        owner_user_id=inspection.owner_user_id,
        created_at=inspection.created_at,
        updated_at=inspection.updated_at,
    )


def map_quality_inspection_line(line: QualityInspectionLine) -> QualityInspectionLineRow:
    return QualityInspectionLineRow(
        id=line.id,
        inspection_id=line.inspection_id,
        purchase_contract_line_id=line.purchase_contract_line_id,
        product_id=line.product_id,
        product_code=line.product_code,
        product_name=line.product_name,
        inspected_quantity=format_quantity(line.inspected_quantity),
        failed_quantity=format_quantity(line.failed_quantity),
        unit=line.unit,
        result=line.result,
        remark=line.remark,
        created_at=line.created_at,
    )


def map_quality_issue(issue: QualityIssue) -> QualityIssueRow:
    return QualityIssueRow(
        id=issue.id,
        inspection_id=issue.inspection_id,
        line_id=issue.line_id,
        issue_type=issue.issue_type,
        severity=issue.severity,
        description=issue.description,
        corrective_action=issue.corrective_action,
        status=issue.status,
        attachment_group_id=issue.attachment_group_id,
        resolution_note=issue.resolution_note,
        resolved_at=issue.resolved_at,
        resolved_by_id=issue.resolved_by_id,
        resolved_by_name=issue.resolved_by_name,
        created_at=issue.created_at,
    )


def map_quality_attachment(
    attachment: QualityInspectionAttachment,
) -> QualityAttachmentRow:
    return QualityAttachmentRow(
        id=attachment.id,
        inspection_id=attachment.inspection_id,
        issue_id=attachment.issue_id,
        category=attachment.category,
        filename=attachment.filename,
        url=attachment.url,
        uploaded_by_id=attachment.uploaded_by_id,
        uploaded_by_name=attachment.uploaded_by_name,
        created_at=attachment.created_at,
    )


def map_quality_inspection_event(
    event: QualityInspectionEvent,
) -> QualityInspectionEventRow:
    return QualityInspectionEventRow(
        id=event.id,
        inspection_id=event.inspection_id,
        event_type=event.event_type,
        from_status=event.from_status,
        to_status=event.to_status,
        notes=event.notes,
        actor_user_id=event.actor_user_id,
        actor_user_name=event.actor_user_name,
        created_at=event.created_at,
    )
