from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class SampleRecord(Base):
    __tablename__ = "sample_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    sample_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="registered",
        nullable=False,
    )
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    customer_sku: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    supplier_sku: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    purchase_contract_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    purchase_contract_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    source_type: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    source_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    submitted_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleImage(Base):
    __tablename__ = "sample_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    sample_record_id: Mapped[str] = mapped_column(
        ForeignKey("sample_records.id"),
        index=True,
        nullable=False,
    )
    file_id: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(240), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str | None] = mapped_column(String(240), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleStockEvent(Base):
    __tablename__ = "sample_stock_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    sample_record_id: Mapped[str] = mapped_column(
        ForeignKey("sample_records.id"),
        index=True,
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    occurred_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    delivery_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    recipient: Mapped[str | None] = mapped_column(String(240), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleStockSummary(Base):
    __tablename__ = "sample_stock_summaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    sample_record_id: Mapped[str] = mapped_column(
        ForeignKey("sample_records.id"),
        unique=True,
        index=True,
        nullable=False,
    )
    received_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    delivered_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    retained_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleFollowupEvent(Base):
    __tablename__ = "sample_followup_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    sample_record_id: Mapped[str] = mapped_column(
        ForeignKey("sample_records.id"),
        index=True,
        nullable=False,
    )
    purchase_contract_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    purchase_contract_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    node_code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    node_label: Mapped[str] = mapped_column(String(120), nullable=False)
    actual_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
