from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class SampleRequest(Base):
    __tablename__ = "sample_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    request_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    sales_user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    sales_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    destination: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, default="draft", nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleRequestLine(Base):
    __tablename__ = "sample_request_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    sample_request_id: Mapped[str] = mapped_column(
        ForeignKey("sample_requests.id"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), nullable=False)
    specification: Mapped[str | None] = mapped_column(String(240), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    requirement: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleRequestProgress(Base):
    __tablename__ = "sample_request_progress"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    sample_request_id: Mapped[str] = mapped_column(
        ForeignKey("sample_requests.id"),
        index=True,
        nullable=False,
    )
    stage: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    occurred_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    handler_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class SampleFee(Base):
    __tablename__ = "sample_fees"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    sample_request_id: Mapped[str] = mapped_column(
        ForeignKey("sample_requests.id"),
        index=True,
        nullable=False,
    )
    fee_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    payee_type: Mapped[str] = mapped_column(String(40), nullable=False)
    payee_name: Mapped[str] = mapped_column(String(240), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="not_requested",
        nullable=False,
    )
    payment_request_no: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    finance_invoice_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    finance_payment_request_id: Mapped[str | None] = mapped_column(
        String(36),
        index=True,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
