from app.modules.quality.inspections.repositories import (
    QualityAttachmentRow,
    QualityInspectionEventRow,
    QualityInspectionLineRow,
    QualityInspectionRepository,
    QualityInspectionRow,
    QualityIssueRow,
)
from app.modules.quality.inspections.schemas import (
    QualityAttachmentResponse,
    QualityInspectionEventResponse,
    QualityInspectionLineResponse,
    QualityInspectionResponse,
    QualityIssueResponse,
)


class QualityInspectionResponseBuilder:
    """Build API response models from QC aggregate rows."""

    def __init__(self, repository: QualityInspectionRepository) -> None:
        self._repository = repository

    async def build(self, inspection: QualityInspectionRow) -> QualityInspectionResponse:
        return (await self.build_many([inspection]))[0]

    async def build_many(
        self,
        inspections: list[QualityInspectionRow],
    ) -> list[QualityInspectionResponse]:
        if not inspections:
            return []
        inspection_ids = [inspection.id for inspection in inspections]
        lines = await self._repository.list_lines_for_inspections(inspection_ids)
        issues = await self._repository.list_issues_for_inspections(inspection_ids)
        attachments = await self._repository.list_attachments_for_inspections(inspection_ids)
        events = await self._repository.list_events_for_inspections(inspection_ids)

        lines_by_inspection: dict[str, list[QualityInspectionLineRow]] = {}
        issues_by_inspection: dict[str, list[QualityIssueRow]] = {}
        attachments_by_inspection: dict[str, list[QualityAttachmentRow]] = {}
        attachments_by_issue: dict[str, list[QualityAttachmentRow]] = {}
        events_by_inspection: dict[str, list[QualityInspectionEventRow]] = {}
        for row in lines:
            lines_by_inspection.setdefault(row.inspection_id, []).append(row)
        for row in issues:
            issues_by_inspection.setdefault(row.inspection_id, []).append(row)
        for row in attachments:
            attachments_by_inspection.setdefault(row.inspection_id, []).append(row)
            if row.issue_id is not None:
                attachments_by_issue.setdefault(row.issue_id, []).append(row)
        for row in events:
            events_by_inspection.setdefault(row.inspection_id, []).append(row)

        return [
            self._build_response(
                inspection=inspection,
                lines=lines_by_inspection.get(inspection.id, []),
                issues=issues_by_inspection.get(inspection.id, []),
                attachments=attachments_by_inspection.get(inspection.id, []),
                attachments_by_issue=attachments_by_issue,
                events=events_by_inspection.get(inspection.id, []),
            )
            for inspection in inspections
        ]

    def _build_response(
        self,
        *,
        inspection: QualityInspectionRow,
        lines: list[QualityInspectionLineRow],
        issues: list[QualityIssueRow],
        attachments: list[QualityAttachmentRow],
        attachments_by_issue: dict[str, list[QualityAttachmentRow]],
        events: list[QualityInspectionEventRow],
    ) -> QualityInspectionResponse:
        return QualityInspectionResponse(
            id=inspection.id,
            code=inspection.code,
            purchase_contract_id=inspection.purchase_contract_id,
            purchase_contract_no=inspection.purchase_contract_no,
            supplier_id=inspection.supplier_id,
            supplier_name=inspection.supplier_name,
            status=inspection.status,
            scheduled_at=inspection.scheduled_at,
            inspected_at=inspection.inspected_at if inspection.status == "completed" else None,
            result=inspection.result if inspection.status == "completed" else None,
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
            lines=[self._line_response(row) for row in lines],
            issues=[
                self._issue_response(
                    row,
                    attachments_by_issue.get(row.id, []),
                )
                for row in issues
            ],
            attachments=[self._attachment_response(row) for row in attachments],
            events=[self._event_response(row) for row in events],
        )

    def _line_response(self, line: QualityInspectionLineRow) -> QualityInspectionLineResponse:
        return QualityInspectionLineResponse(
            id=line.id,
            inspection_id=line.inspection_id,
            purchase_contract_line_id=line.purchase_contract_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            inspected_quantity=line.inspected_quantity,
            failed_quantity=line.failed_quantity,
            unit=line.unit,
            result=line.result,
            remark=line.remark,
        )

    def _issue_response(
        self,
        issue: QualityIssueRow,
        attachments: list[QualityAttachmentRow],
    ) -> QualityIssueResponse:
        return QualityIssueResponse(
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
            attachments=[self._attachment_response(row) for row in attachments],
        )

    def _attachment_response(self, row: QualityAttachmentRow) -> QualityAttachmentResponse:
        return QualityAttachmentResponse(
            id=row.id,
            inspection_id=row.inspection_id,
            issue_id=row.issue_id,
            category=row.category,
            filename=row.filename,
            url=row.url,
            uploaded_by_id=row.uploaded_by_id,
            uploaded_by_name=row.uploaded_by_name,
            created_at=row.created_at,
        )

    def _event_response(self, row: QualityInspectionEventRow) -> QualityInspectionEventResponse:
        return QualityInspectionEventResponse(
            id=row.id,
            inspection_id=row.inspection_id,
            event_type=row.event_type,
            from_status=row.from_status,
            to_status=row.to_status,
            notes=row.notes,
            actor_user_id=row.actor_user_id,
            actor_user_name=row.actor_user_name,
            created_at=row.created_at,
        )
