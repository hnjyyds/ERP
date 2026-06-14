from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_PURCHASE_INVOICE_NOTICE_STATUSES = ("draft", "sent", "received")


class PurchaseInvoiceNoticeLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str = Field(min_length=1, max_length=240)
    purchase_contract_id: str | None = Field(default=None, max_length=36)
    purchase_contract_no: str | None = Field(default=None, max_length=80)
    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    customs_name: str = Field(min_length=1, max_length=240)
    invoice_name: str = Field(min_length=1, max_length=240)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    amount: Decimal = Field(ge=0)
    remark: str | None = Field(default=None, max_length=2000)


class PurchaseInvoiceNoticeGenerateFromDeclaration(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customs_declaration_id: str | None = Field(default=None, max_length=36)
    customs_declaration_no: str = Field(min_length=1, max_length=80)
    declaration_date: date
    notice_date: date
    currency: str = Field(min_length=1, max_length=10)
    remarks: str | None = Field(default=None, max_length=4000)
    lines: list[PurchaseInvoiceNoticeLineCreate] = Field(min_length=1)


class PurchaseInvoiceNoticeSend(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sender_name: str = Field(min_length=1, max_length=160)
    sent_at: date


class PurchaseInvoiceNoticeReceiveTaxInvoice(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tax_invoice_no: str = Field(min_length=1, max_length=120)
    received_at: date


class PurchaseInvoiceNoticeLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    notice_id: str
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    product_id: str | None
    product_code: str | None
    product_name: str
    customs_name: str
    invoice_name: str
    quantity: str
    unit: str
    amount: str
    currency: str
    remark: str | None


class PurchaseInvoiceNoticeReminderResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    notice_id: str
    title: str
    due_date: date
    status: str


class PurchaseInvoiceNoticeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    notice_date: date
    supplier_id: str | None
    supplier_name: str
    customs_declaration_id: str | None
    customs_declaration_no: str
    declaration_date: date
    currency: str
    remarks: str | None
    status: str
    sent_at: date | None
    sender_name: str | None
    tax_invoice_no: str | None
    tax_invoice_received_at: date | None
    total_quantity: str
    total_amount: str
    owner_user_id: str
    lines: list[PurchaseInvoiceNoticeLineResponse]
    reminders: list[PurchaseInvoiceNoticeReminderResponse]


class PurchaseInvoiceNoticeListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseInvoiceNoticeResponse]
    total: int


class PurchaseInvoiceNoticeReminderListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseInvoiceNoticeReminderResponse]
    total: int
