from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class ShipmentPlan(Base):
    __tablename__ = "shipment_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    shipment_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    planned_ship_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    shipping_method: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    port_of_loading: Mapped[str] = mapped_column(String(120), nullable=False)
    port_of_destination: Mapped[str] = mapped_column(String(120), nullable=False)
    vessel_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    container_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    booking_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    document_owner_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    receivable_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    payable_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    profit_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    profit_rate: Mapped[Decimal] = mapped_column(Numeric(7, 2), default=0, nullable=False)
    reminder_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    reminder_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="pending",
        nullable=False,
    )
    reminder_message: Mapped[str] = mapped_column(String(400), nullable=False)
    approval_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="draft",
        nullable=False,
    )
    submitted_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    approved_at: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ShipmentLine(Base):
    __tablename__ = "shipment_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    shipment_id: Mapped[str] = mapped_column(
        ForeignKey("shipment_plans.id"),
        index=True,
        nullable=False,
    )
    contract_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    contract_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    contract_line_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    specification: Mapped[str | None] = mapped_column(String(240), nullable=True)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    planned_ship_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
