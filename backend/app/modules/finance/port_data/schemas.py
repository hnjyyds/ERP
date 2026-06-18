from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_TRADE_TYPES = ("import", "export")
VALID_PORT_IMPORT_STATUSES = ("imported",)


class CustomsDeclarationRecordCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    declaration_no: str = Field(min_length=1, max_length=120)
    customs_receipt_no: str | None = Field(default=None, max_length=120)
    trade_type: str = Field(min_length=1, max_length=20)
    export_contract_no: str | None = Field(default=None, max_length=120)
    customs_date: date | None = None
    product_name: str = Field(min_length=1, max_length=240)
    hs_code: str | None = Field(default=None, max_length=40)
    quantity: Decimal | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, max_length=20)
    amount: Decimal = Field(ge=0)
    currency: str = Field(min_length=1, max_length=10)
    customer_or_supplier: str | None = Field(default=None, max_length=240)


class PortImportBatchCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    batch_no: str = Field(min_length=1, max_length=120)
    source: str = Field(min_length=1, max_length=120)
    imported_at: date
    record_count: int = Field(ge=0)
    remark: str | None = Field(default=None, max_length=2000)
    records: list[CustomsDeclarationRecordCreate] = Field(min_length=1)


class CustomsDeclarationRecordResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    batch_id: str
    declaration_no: str
    customs_receipt_no: str | None
    trade_type: str
    export_contract_no: str | None
    customs_date: date | None
    product_name: str
    hs_code: str | None
    quantity: str | None
    unit: str | None
    amount: str
    currency: str
    customer_or_supplier: str | None
    match_status: str
    verification_document_id: str | None
    verification_document_no: str | None


class CustomsDeclarationRecordListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CustomsDeclarationRecordResponse]
    total: int


class PortImportBatchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    batch_no: str
    source: str
    imported_at: date
    record_count: int
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    records: list[CustomsDeclarationRecordResponse]


class PortImportBatchListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PortImportBatchResponse]
    total: int


class CustomsReceiptMatchRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    declaration_no: str
    customs_receipt_no: str
    verification_document_id: str
    verification_document_no: str


class CustomsReceiptAutoMatchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    matched_count: int
    unmatched_count: int
    matched_records: list[CustomsReceiptMatchRecord]
