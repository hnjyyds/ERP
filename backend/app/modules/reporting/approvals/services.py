from datetime import date

from app.modules.reporting.approvals.repositories import (
    ApprovalDocumentRow,
    ApprovalQueryRepository,
)
from app.modules.reporting.approvals.schemas import (
    VALID_APPROVAL_DOCUMENT_TYPES,
    VALID_APPROVAL_STATUSES,
    ApprovalDocumentResponse,
    ApprovalQueryResponse,
    ApprovalTypeSummaryResponse,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ApprovalQueryService:
    def __init__(self, repository: ApprovalQueryRepository) -> None:
        self._repository = repository

    async def list_approvals(
        self,
        *,
        current_user: CurrentUserResponse,
        document_type: str | None,
        status: str | None,
        applicant_user_id: str | None,
        date_from: date | None,
        date_to: date | None,
    ) -> ApprovalQueryResponse:
        self._require_reporting(current_user)
        self._validate_document_type(document_type)
        self._validate_status(status)
        if date_from is not None and date_to is not None and date_from > date_to:
            raise ValueError("开始日期不能晚于结束日期")
        rows = await self._repository.list_documents(
            document_type=document_type,
            status=status,
            applicant_user_id=applicant_user_id,
            date_from=date_from,
            date_to=date_to,
        )
        return ApprovalQueryResponse(
            items=[self._document_response(row) for row in rows],
            total=len(rows),
            pending_count=sum(1 for row in rows if row.status == "submitted"),
            approved_count=sum(1 for row in rows if row.status == "approved"),
            type_summaries=self._type_summaries(rows),
        )

    def _document_response(self, row: ApprovalDocumentRow) -> ApprovalDocumentResponse:
        return ApprovalDocumentResponse(
            document_type=row.document_type,
            document_type_label=row.document_type_label,
            document_id=row.document_id,
            document_no=row.document_no,
            counterparty_name=row.counterparty_name,
            applicant_user_id=row.applicant_user_id,
            applicant_user_name=row.applicant_user_name,
            business_date=row.business_date,
            submitted_at=row.submitted_at,
            approved_at=row.approved_at,
            status=row.status,
            status_label=self._status_label(row.status),
            amount=row.amount,
            currency=row.currency,
            source_path=row.source_path,
        )

    def _type_summaries(
        self,
        rows: list[ApprovalDocumentRow],
    ) -> list[ApprovalTypeSummaryResponse]:
        labels = {row.document_type: row.document_type_label for row in rows}
        summaries: list[ApprovalTypeSummaryResponse] = []
        for document_type in sorted(labels):
            type_rows = [row for row in rows if row.document_type == document_type]
            summaries.append(
                ApprovalTypeSummaryResponse(
                    document_type=document_type,
                    document_type_label=labels[document_type],
                    pending_count=sum(1 for row in type_rows if row.status == "submitted"),
                    approved_count=sum(1 for row in type_rows if row.status == "approved"),
                    total_count=len(type_rows),
                )
            )
        return summaries

    def _status_label(self, status: str) -> str:
        if status == "submitted":
            return "待审批"
        if status == "approved":
            return "已审批"
        return status

    def _validate_document_type(self, document_type: str | None) -> None:
        if document_type is not None and document_type not in VALID_APPROVAL_DOCUMENT_TYPES:
            raise ValueError("审批单据类型无效")

    def _validate_status(self, status: str | None) -> None:
        if status is not None and status not in VALID_APPROVAL_STATUSES:
            raise ValueError("审批状态无效")

    def _require_reporting(self, current_user: CurrentUserResponse) -> None:
        if "reporting:view" not in current_user.permissions:
            raise PermissionDeniedError
