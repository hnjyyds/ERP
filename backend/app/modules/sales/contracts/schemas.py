from datetime import date
from decimal import Decimal
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

VALID_CONTRACT_STATUSES = ("draft", "submitted", "approved", "rejected")
VALID_CONTRACT_EXPORT_FORMATS = ("pdf", "excel")


class ExportContractLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    specification: str | None = Field(default=None, max_length=240)
    model: str | None = Field(default=None, max_length=120)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    unit_price: Decimal = Field(gt=0)
    purchased_quantity: Decimal = Field(default=Decimal("0"), ge=0)
    shipped_quantity: Decimal = Field(default=Decimal("0"), ge=0)
    image_url: str | None = Field(default=None, max_length=1000)
    remark: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_progress_quantities(self) -> Self:
        if self.purchased_quantity > self.quantity:
            raise ValueError("已采购数量不能超过合同数量")
        if self.shipped_quantity > self.quantity:
            raise ValueError("已出货数量不能超过合同数量")
        return self


class ExportContractCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    contract_date: date
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str = Field(min_length=1, max_length=240)
    sales_user_id: str | None = Field(default=None, max_length=36)
    sales_user_name: str | None = Field(default=None, max_length=160)
    currency: str = Field(min_length=1, max_length=10)
    trade_term: str = Field(min_length=1, max_length=80)
    planned_ship_date: date
    payment_terms: str = Field(min_length=1, max_length=400)
    source_quotation_id: str | None = Field(default=None, max_length=36)
    source_quotation_no: str | None = Field(default=None, max_length=80)
    remarks: str | None = Field(default=None, max_length=4000)
    lines: list[ExportContractLineCreate] = Field(min_length=1)


class ExportContractApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date


class ExportContractSignatureCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    signed_by: str = Field(min_length=1, max_length=160)
    signed_at: date
    signature_method: str = Field(min_length=1, max_length=80)
    file_no: str | None = Field(default=None, max_length=120)
    remark: str | None = Field(default=None, max_length=2000)


class ExportContractAdvancePaymentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_no: str = Field(min_length=1, max_length=80)
    received_at: date
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    payer_name: str = Field(min_length=1, max_length=240)
    remark: str | None = Field(default=None, max_length=2000)


class ExportContractLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    contract_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str
    unit_price: str
    amount: str
    purchased_quantity: str
    unpurchased_quantity: str
    shipped_quantity: str
    unshipped_quantity: str
    shipped_amount: str
    unshipped_amount: str
    image_url: str | None
    remark: str | None


class ExportContractSignatureResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    contract_id: str
    signed_by: str
    signed_at: date
    signature_method: str
    file_no: str | None
    remark: str | None


class ExportContractAdvancePaymentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    contract_id: str
    payment_no: str
    received_at: date
    amount: str
    currency: str
    payer_name: str
    remark: str | None


class ExportContractStatisticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_quantity: str
    total_amount: str
    shipped_quantity: str
    shipped_amount: str
    unshipped_quantity: str
    unshipped_amount: str
    purchased_quantity: str
    unpurchased_quantity: str
    advance_payment_amount: str


class ExportContractPurchaseStatusResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None
    product_code: str | None
    product_name: str
    total_quantity: str
    purchased_quantity: str
    unpurchased_quantity: str
    unit: str
    status: str


class ExportContractShipmentStatusResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None
    product_code: str | None
    product_name: str
    planned_ship_date: date
    total_quantity: str
    shipped_quantity: str
    unshipped_quantity: str
    shipped_amount: str
    unshipped_amount: str
    unit: str
    status: str


class ExportContractResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    contract_date: date
    customer_id: str | None
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    trade_term: str
    planned_ship_date: date
    payment_terms: str
    source_quotation_id: str | None
    source_quotation_no: str | None
    remarks: str | None
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    signature_status: str
    customer_signed_at: date | None
    owner_user_id: str
    statistics: ExportContractStatisticsResponse
    lines: list[ExportContractLineResponse]
    signatures: list[ExportContractSignatureResponse]
    advance_payments: list[ExportContractAdvancePaymentResponse]
    purchase_statuses: list[ExportContractPurchaseStatusResponse]
    shipment_statuses: list[ExportContractShipmentStatusResponse]


class ExportContractListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ExportContractResponse]
    total: int


class ExportContractExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str
