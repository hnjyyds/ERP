from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class Reimbursement(Base):
    __tablename__ = "finance_reimbursements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    reimbursement_no: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
        nullable=False,
    )
    applicant_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    applicant_user_name: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, default="submitted", nullable=False)
    approved_by_user_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    approved_by_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    approval_remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(40), index=True, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class ReimbursementItem(Base):
    __tablename__ = "finance_reimbursement_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    reimbursement_id: Mapped[str] = mapped_column(
        ForeignKey("finance_reimbursements.id"),
        index=True,
        nullable=False,
    )
    expense_item: Mapped[str] = mapped_column(String(160), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
