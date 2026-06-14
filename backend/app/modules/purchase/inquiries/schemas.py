from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_PURCHASE_INQUIRY_STATUSES = ("draft", "sent", "quoted", "closed")


class PurchaseInquiryLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    specification: str | None = Field(default=None, max_length=240)
    model: str | None = Field(default=None, max_length=120)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)


class PurchaseInquiryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    inquiry_date: date
    buyer_user_id: str | None = Field(default=None, max_length=36)
    buyer_user_name: str | None = Field(default=None, max_length=160)
    remarks: str | None = Field(default=None, max_length=4000)
    lines: list[PurchaseInquiryLineCreate] = Field(min_length=1)


class PurchaseInquiryUpdate(PurchaseInquiryCreate):
    pass


class SupplierQuotationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inquiry_line_id: str = Field(min_length=1, max_length=36)
    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str = Field(min_length=1, max_length=240)
    quoted_at: date
    unit_price: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    lead_time_days: int | None = Field(default=None, ge=0)
    min_order_quantity: Decimal | None = Field(default=None, ge=0)
    sample_available: bool = False
    remark: str | None = Field(default=None, max_length=2000)


class PurchaseInquiryTemplateSend(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template_name: str = Field(min_length=1, max_length=120)
    recipient_emails: list[str] = Field(default_factory=list)


class PurchaseInquiryLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    inquiry_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str


class SupplierSampleEvidenceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sample_record_id: str
    sample_code: str
    sample_type: str
    status: str
    supplier_id: str | None
    supplier_name: str | None
    product_id: str | None
    product_code: str | None
    product_name: str
    received_at: date
    quantity: str
    unit: str


class SupplierQuotationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    inquiry_id: str
    inquiry_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    supplier_id: str | None
    supplier_name: str
    quoted_at: date
    unit_price: str
    currency: str
    lead_time_days: int | None
    min_order_quantity: str | None
    sample_available: bool
    has_sample: bool
    remark: str | None


class PurchaseInquiryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    inquiry_date: date
    buyer_user_id: str | None
    buyer_user_name: str | None
    status: str
    template_name: str | None
    template_sent_at: date | None
    remarks: str | None
    owner_user_id: str
    lines: list[PurchaseInquiryLineResponse]
    quotations: list[SupplierQuotationResponse]


class PurchaseInquiryListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseInquiryResponse]
    total: int


class SupplierSampleEvidenceListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SupplierSampleEvidenceResponse]
    total: int


class PurchaseInquiryReferenceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None
    product_code: str | None
    product_name: str
    supplier_name: str
    reference_price: str
    currency: str
    quote_date: date
    source_inquiry_no: str


class PurchaseInquiryReferenceListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseInquiryReferenceResponse]
    total: int


class PurchaseInquiryTemplateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str
