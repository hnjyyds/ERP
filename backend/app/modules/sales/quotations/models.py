from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class ExportQuotation(Base):
    __tablename__ = "export_quotations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    quote_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    sales_user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    sales_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    trade_term: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    valid_until: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    approval_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="draft",
        nullable=False,
    )
    submitted_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    approved_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    confirmed_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    generated_contract_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    generated_contract_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ExportQuotationLine(Base):
    __tablename__ = "export_quotation_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    quotation_id: Mapped[str] = mapped_column(
        ForeignKey("export_quotations.id"),
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
    freight_method: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    freight_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    purchase_reference_supplier_name: Mapped[str | None] = mapped_column(
        String(240),
        index=True,
        nullable=True,
    )
    purchase_reference_price: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 4),
        nullable=True,
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
