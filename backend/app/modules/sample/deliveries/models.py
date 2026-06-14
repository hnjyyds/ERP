from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class SampleDelivery(Base):
    __tablename__ = "sample_deliveries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    delivery_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    factory_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    factory_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    recipient_name: Mapped[str] = mapped_column(String(160), nullable=False)
    recipient_company: Mapped[str | None] = mapped_column(String(240), nullable=True)
    recipient_address: Mapped[str] = mapped_column(Text, nullable=False)
    express_company: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    tracking_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    quote_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    quote_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, default="draft", nullable=False)
    submitted_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    approved_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleDeliveryLine(Base):
    __tablename__ = "sample_delivery_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    delivery_id: Mapped[str] = mapped_column(
        ForeignKey("sample_deliveries.id"),
        index=True,
        nullable=False,
    )
    sample_record_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    sample_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    sample_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleDeliveryFee(Base):
    __tablename__ = "sample_delivery_fees"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    delivery_id: Mapped[str] = mapped_column(
        ForeignKey("sample_deliveries.id"),
        index=True,
        nullable=False,
    )
    fee_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    payer_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
