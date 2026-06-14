from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class BankReceipt(Base):
    __tablename__ = "finance_bank_receipts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    receipt_no: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    received_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    payer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    allocated_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    bank_account: Mapped[str] = mapped_column(String(160), nullable=False)
    reference_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    receipt_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="unclaimed",
        nullable=False,
    )
    claim_message: Mapped[str] = mapped_column(String(240), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ReceiptClaim(Base):
    __tablename__ = "finance_receipt_claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    receipt_id: Mapped[str] = mapped_column(
        ForeignKey("finance_bank_receipts.id"),
        index=True,
        nullable=False,
    )
    claimed_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    claimed_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    claimed_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ReceiptAllocation(Base):
    __tablename__ = "finance_receipt_allocations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    receipt_id: Mapped[str] = mapped_column(
        ForeignKey("finance_bank_receipts.id"),
        index=True,
        nullable=False,
    )
    allocation_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    contract_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    contract_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    invoice_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    allocated_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
