from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class InventoryBalance(Base):
    __tablename__ = "warehouse_inventory_balances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    warehouse_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    warehouse_name: Mapped[str] = mapped_column(String(160), nullable=False)
    location_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    location_name: Mapped[str] = mapped_column(String(160), nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    available_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    locked_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    pending_inspection_quantity: Mapped[Decimal] = mapped_column(
        Numeric(14, 4),
        default=0,
        nullable=False,
    )
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class InventoryLedger(Base):
    __tablename__ = "warehouse_inventory_ledgers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    warehouse_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    warehouse_name: Mapped[str] = mapped_column(String(160), nullable=False)
    location_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    location_name: Mapped[str] = mapped_column(String(160), nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    direction: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    stock_status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    source_type: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    source_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    source_code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    occurred_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PendingInspection(Base):
    """按入库单行挂账的待检量，QC 判定后逐笔转可用或退回流出。"""

    __tablename__ = "warehouse_pending_inspections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    inbound_order_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    inbound_order_code: Mapped[str] = mapped_column(String(80), nullable=False)
    inbound_order_line_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
        nullable=False,
    )
    purchase_contract_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    purchase_contract_line_id: Mapped[str | None] = mapped_column(
        String(36),
        index=True,
        nullable=True,
    )
    warehouse_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    warehouse_name: Mapped[str] = mapped_column(String(160), nullable=False)
    location_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    location_name: Mapped[str] = mapped_column(String(160), nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="pending",
        nullable=False,
    )
    inspection_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    inspection_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
