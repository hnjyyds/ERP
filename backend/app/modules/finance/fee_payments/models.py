from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class PartnerFeeInvoice(Base):
    __tablename__ = "finance_partner_fee_invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    invoice_no: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    partner_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    partner_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    partner_type: Mapped[str | None] = mapped_column(String(40), index=True, nullable=True)
    shipment_plan_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    shipment_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    sales_user_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    sales_user_name: Mapped[str | None] = mapped_column(String(160), index=True, nullable=True)
    fee_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, default="unpaid", nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class FeePaymentRequest(Base):
    __tablename__ = "finance_fee_payment_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    request_no: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    partner_fee_invoice_id: Mapped[str] = mapped_column(
        ForeignKey("finance_partner_fee_invoices.id"),
        index=True,
        nullable=False,
    )
    partner_fee_invoice_no: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    partner_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    partner_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    partner_type: Mapped[str | None] = mapped_column(String(40), index=True, nullable=True)
    shipment_plan_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    shipment_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    sales_user_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    sales_user_name: Mapped[str | None] = mapped_column(String(160), index=True, nullable=True)
    fee_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    request_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    requested_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    approved_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="submitted", nullable=False)
    requester_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    requester_user_name: Mapped[str] = mapped_column(String(120), nullable=False)
    reviewer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    approved_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    payment_account: Mapped[str | None] = mapped_column(String(160), nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class FeePaymentAllocation(Base):
    __tablename__ = "finance_fee_payment_allocations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    fee_payment_request_id: Mapped[str] = mapped_column(
        ForeignKey("finance_fee_payment_requests.id"),
        index=True,
        nullable=False,
    )
    partner_fee_invoice_id: Mapped[str] = mapped_column(
        ForeignKey("finance_partner_fee_invoices.id"),
        index=True,
        nullable=False,
    )
    allocated_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
