from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class PurchaseInvoiceNotice(Base):
    __tablename__ = "purchase_invoice_notices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    notice_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    customs_declaration_id: Mapped[str | None] = mapped_column(
        String(36),
        index=True,
        nullable=True,
    )
    customs_declaration_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    declaration_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    sent_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    sender_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    tax_invoice_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    tax_invoice_received_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseInvoiceNoticeLine(Base):
    __tablename__ = "purchase_invoice_notice_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    notice_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_invoice_notices.id"),
        index=True,
        nullable=False,
    )
    purchase_contract_id: Mapped[str | None] = mapped_column(
        String(36),
        index=True,
        nullable=True,
    )
    purchase_contract_no: Mapped[str | None] = mapped_column(
        String(80),
        index=True,
        nullable=True,
    )
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    customs_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    invoice_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseInvoiceNoticeReminder(Base):
    __tablename__ = "purchase_invoice_notice_reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    notice_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_invoice_notices.id"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="open", nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
