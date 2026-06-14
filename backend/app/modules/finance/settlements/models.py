from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class FinancialSettlement(Base):
    __tablename__ = "finance_financial_settlements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    settlement_no: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
        nullable=False,
    )
    shipment_plan_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    shipment_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    settlement_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    sales_income: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    purchase_cost_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    partner_fee_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    misc_fee_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    tax_refund_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    manual_cost_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    gross_profit: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    gross_profit_rate: Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="locked", nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ProfitCostLink(Base):
    __tablename__ = "finance_profit_cost_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    settlement_id: Mapped[str] = mapped_column(
        ForeignKey("finance_financial_settlements.id"),
        index=True,
        nullable=False,
    )
    shipment_plan_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    shipment_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    cost_no: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    cost_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    source_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    source_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    cost_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    direction: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(400), nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
