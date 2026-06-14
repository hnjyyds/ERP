from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class OutboundPlan(Base):
    __tablename__ = "warehouse_outbound_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    source_type: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    source_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    source_code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    outbound_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    planned_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="planned", nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    warehouse_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    warehouse_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    location_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    location_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    operator_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class OutboundPlanLine(Base):
    __tablename__ = "warehouse_outbound_plan_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(
        ForeignKey("warehouse_outbound_plans.id"),
        index=True,
        nullable=False,
    )
    source_line_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    specification: Mapped[str | None] = mapped_column(String(240), nullable=True)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    planned_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    outbound_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="pending", nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
