from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class ExportContract(Base):
    __tablename__ = "export_contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    contract_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    sales_user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    sales_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    trade_term: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    planned_ship_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    payment_terms: Mapped[str] = mapped_column(String(400), nullable=False)
    source_quotation_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    source_quotation_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    shipped_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    shipped_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    purchased_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    advance_payment_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )
    approval_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="draft",
        nullable=False,
    )
    submitted_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    approved_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    signature_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="not_signed",
        nullable=False,
    )
    customer_signed_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ExportContractLine(Base):
    __tablename__ = "export_contract_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    contract_id: Mapped[str] = mapped_column(
        ForeignKey("export_contracts.id"),
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
    purchased_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    shipped_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ExportContractSignature(Base):
    __tablename__ = "export_contract_signatures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    contract_id: Mapped[str] = mapped_column(
        ForeignKey("export_contracts.id"),
        index=True,
        nullable=False,
    )
    signed_by: Mapped[str] = mapped_column(String(160), nullable=False)
    signed_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    signature_method: Mapped[str] = mapped_column(String(80), nullable=False)
    file_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ExportContractAdvancePayment(Base):
    __tablename__ = "export_contract_advance_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    contract_id: Mapped[str] = mapped_column(
        ForeignKey("export_contracts.id"),
        index=True,
        nullable=False,
    )
    payment_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    received_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    payer_name: Mapped[str] = mapped_column(String(240), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ExportContractEvent(Base):
    __tablename__ = "export_contract_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    contract_id: Mapped[str] = mapped_column(
        ForeignKey("export_contracts.id"),
        index=True,
        nullable=False,
    )
    contract_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
