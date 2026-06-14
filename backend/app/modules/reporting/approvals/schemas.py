from datetime import date

from pydantic import BaseModel, ConfigDict

VALID_APPROVAL_DOCUMENT_TYPES = ("export_contract", "purchase_contract")
VALID_APPROVAL_STATUSES = ("submitted", "approved")


class ApprovalDocumentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_type: str
    document_type_label: str
    document_id: str
    document_no: str
    counterparty_name: str
    applicant_user_id: str | None
    applicant_user_name: str | None
    business_date: date
    submitted_at: date | None
    approved_at: date | None
    status: str
    status_label: str
    amount: str
    currency: str
    source_path: str


class ApprovalTypeSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_type: str
    document_type_label: str
    pending_count: int
    approved_count: int
    total_count: int


class ApprovalQueryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ApprovalDocumentResponse]
    total: int
    pending_count: int
    approved_count: int
    type_summaries: list[ApprovalTypeSummaryResponse]
