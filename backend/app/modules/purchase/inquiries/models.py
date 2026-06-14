from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class PurchaseInquiry(Base):
    __tablename__ = "purchase_inquiries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    inquiry_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    buyer_user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    buyer_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, default="draft", nullable=False)
    template_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    template_sent_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseInquiryLine(Base):
    __tablename__ = "purchase_inquiry_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    inquiry_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_inquiries.id"),
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SupplierQuotation(Base):
    __tablename__ = "supplier_quotations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    inquiry_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_inquiries.id"),
        index=True,
        nullable=False,
    )
    inquiry_line_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_inquiry_lines.id"),
        index=True,
        nullable=False,
    )
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    quoted_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    lead_time_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_order_quantity: Mapped[Decimal | None] = mapped_column(Numeric(14, 4), nullable=True)
    sample_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
