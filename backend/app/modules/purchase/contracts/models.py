from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class PurchaseContract(Base):
    __tablename__ = "purchase_contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    contract_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    buyer_user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    buyer_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    qc_user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    qc_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    delivery_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    payment_terms: Mapped[str] = mapped_column(Text, nullable=False)
    source_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    approval_status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    submitted_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    approved_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    total_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    received_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseContractLine(Base):
    __tablename__ = "purchase_contract_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    contract_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_contracts.id"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    specification: Mapped[str | None] = mapped_column(String(240), nullable=True)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    received_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    source_export_contract_id: Mapped[str | None] = mapped_column(
        String(36),
        index=True,
        nullable=True,
    )
    source_export_contract_no: Mapped[str | None] = mapped_column(
        String(80),
        index=True,
        nullable=True,
    )
    source_export_contract_line_id: Mapped[str | None] = mapped_column(
        String(36),
        index=True,
        nullable=True,
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseContractSourceLink(Base):
    __tablename__ = "purchase_contract_source_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    contract_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_contracts.id"),
        index=True,
        nullable=False,
    )
    export_contract_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    export_contract_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    export_contract_line_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(240), nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    demand_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseContractReminder(Base):
    __tablename__ = "purchase_contract_reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    contract_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_contracts.id"),
        index=True,
        nullable=False,
    )
    reminder_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
