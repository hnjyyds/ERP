from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class MiscFeeItem(Base):
    __tablename__ = "finance_misc_fee_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    default_allocation_method: Mapped[str] = mapped_column(
        String(40),
        index=True,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class MiscFeeAllocation(Base):
    __tablename__ = "finance_misc_fee_allocations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    allocation_no: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    item_id: Mapped[str] = mapped_column(
        ForeignKey("finance_misc_fee_items.id"),
        index=True,
        nullable=False,
    )
    item_code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    item_name: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    item_category: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    shipment_plan_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    shipment_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    sales_user_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    sales_user_name: Mapped[str | None] = mapped_column(String(160), index=True, nullable=True)
    allocated_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    allocation_method: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    basis: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, default="allocated", nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
