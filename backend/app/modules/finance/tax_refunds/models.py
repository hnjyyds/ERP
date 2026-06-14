from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class VerificationDocument(Base):
    __tablename__ = "finance_verification_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    document_no: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    received_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    owner_user_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    owner_user_name: Mapped[str | None] = mapped_column(String(160), index=True, nullable=True)
    shipment_plan_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    shipment_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    refundable_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    refunded_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    valid_until: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    reminder_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    reminder_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="pending",
        nullable=False,
    )
    reminder_message: Mapped[str] = mapped_column(String(400), nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="issued", nullable=False)
    customs_declaration_no: Mapped[str | None] = mapped_column(
        String(120),
        index=True,
        nullable=True,
    )
    customs_receipt_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    customs_receipt_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    verification_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    verified_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class VerificationTaxRefund(Base):
    __tablename__ = "finance_verification_tax_refunds"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    verification_document_id: Mapped[str] = mapped_column(
        ForeignKey("finance_verification_documents.id"),
        index=True,
        nullable=False,
    )
    refund_no: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    refunded_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    bank_receipt_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
