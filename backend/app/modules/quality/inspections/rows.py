from dataclasses import dataclass
from datetime import date, datetime


@dataclass(frozen=True)
class QualityInspectionRow:
    id: str
    code: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    status: str
    scheduled_at: datetime
    inspected_at: date
    result: str
    inspector_id: str | None
    inspector_name: str
    qc_user_id: str | None
    qc_user_name: str | None
    issue_summary: str | None
    attachment_group_id: str | None
    parent_inspection_id: str | None
    reinspection_no: int
    cancel_reason: str | None
    owner_user_id: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class QualityInspectionLineRow:
    id: str
    inspection_id: str
    purchase_contract_line_id: str | None
    product_id: str | None
    product_code: str | None
    product_name: str
    inspected_quantity: str
    failed_quantity: str
    unit: str
    result: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class QualityIssueRow:
    id: str
    inspection_id: str
    line_id: str | None
    issue_type: str
    severity: str
    description: str
    corrective_action: str | None
    status: str
    attachment_group_id: str | None
    resolution_note: str | None
    resolved_at: datetime | None
    resolved_by_id: str | None
    resolved_by_name: str | None
    created_at: datetime


@dataclass(frozen=True)
class QualityAttachmentRow:
    id: str
    inspection_id: str
    issue_id: str | None
    category: str
    filename: str
    url: str
    uploaded_by_id: str
    uploaded_by_name: str
    created_at: datetime


@dataclass(frozen=True)
class QualityInspectionEventRow:
    id: str
    inspection_id: str
    event_type: str
    from_status: str | None
    to_status: str | None
    notes: str | None
    actor_user_id: str
    actor_user_name: str
    created_at: datetime
