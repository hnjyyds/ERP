from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_QUOTATION_STATUSES = (
    "draft",
    "submitted",
    "approved",
    "rejected",
    "contract_generated",
)
VALID_QUOTATION_EXPORT_FORMATS = ("pdf", "excel")


class ExportQuotationLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    specification: str | None = Field(default=None, max_length=240)
    model: str | None = Field(default=None, max_length=120)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    unit_price: Decimal = Field(gt=0)
    freight_method: str = Field(min_length=1, max_length=80)
    freight_amount: Decimal = Field(default=Decimal("0"), ge=0)
    purchase_reference_supplier_name: str | None = Field(default=None, max_length=240)
    purchase_reference_price: Decimal | None = Field(default=None, ge=0)
    remark: str | None = Field(default=None, max_length=2000)


class ExportQuotationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    quote_date: date
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str = Field(min_length=1, max_length=240)
    sales_user_id: str | None = Field(default=None, max_length=36)
    sales_user_name: str | None = Field(default=None, max_length=160)
    currency: str = Field(min_length=1, max_length=10)
    trade_term: str = Field(min_length=1, max_length=80)
    valid_until: date | None = None
    description: str | None = Field(default=None, max_length=4000)
    lines: list[ExportQuotationLineCreate] = Field(min_length=1)


class ExportQuotationApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date


class ExportQuotationConfirmContract(BaseModel):
    model_config = ConfigDict(extra="forbid")

    confirmed_at: date
    contract_no: str = Field(min_length=1, max_length=80)


class ExportQuotationLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    quotation_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str
    unit_price: str
    amount: str
    freight_method: str
    freight_amount: str
    purchase_reference_supplier_name: str | None
    purchase_reference_price: str | None
    remark: str | None


class ExportQuotationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    quote_date: date
    customer_id: str | None
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    trade_term: str
    valid_until: date | None
    description: str | None
    total_amount: str
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    confirmed_at: date | None
    generated_contract_id: str | None
    generated_contract_no: str | None
    owner_user_id: str
    lines: list[ExportQuotationLineResponse]


class ExportQuotationListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ExportQuotationResponse]
    total: int


class ExportQuotationPurchaseReferenceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None
    product_code: str | None
    product_name: str
    supplier_name: str
    reference_price: str
    currency: str
    quote_date: date
    source_quotation_no: str


class ExportQuotationPurchaseReferenceListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ExportQuotationPurchaseReferenceResponse]
    total: int


class ExportQuotationExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str


class ExportQuotationContractResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    quotation_id: str
    quotation_no: str
    contract_id: str
    contract_no: str
    customer_id: str | None
    customer_name: str
    confirmed_at: date
    currency: str
    trade_term: str
    total_amount: str
