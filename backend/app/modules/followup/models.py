from datetime import UTC, date, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class FollowProcessTemplate(Base):
    __tablename__ = "follow_process_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class FollowProcessNode(Base):
    __tablename__ = "follow_process_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    template_id: Mapped[str] = mapped_column(
        ForeignKey("follow_process_templates.id"),
        index=True,
        nullable=False,
    )
    node_code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    node_name: Mapped[str] = mapped_column(String(120), nullable=False)
    sequence_no: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    standard_days: Mapped[int] = mapped_column(Integer, nullable=False)
    remind_before_days: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_date_source: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseFollowPlan(Base):
    __tablename__ = "purchase_follow_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    purchase_contract_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
        nullable=False,
    )
    purchase_contract_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    template_id: Mapped[str] = mapped_column(
        ForeignKey("follow_process_templates.id"),
        index=True,
        nullable=False,
    )
    base_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    overall_status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="pending",
        nullable=False,
    )
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PurchaseFollowNode(Base):
    __tablename__ = "purchase_follow_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    follow_plan_id: Mapped[str] = mapped_column(
        ForeignKey("purchase_follow_plans.id"),
        index=True,
        nullable=False,
    )
    node_code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    node_name: Mapped[str] = mapped_column(String(120), nullable=False)
    sequence_no: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    planned_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    remind_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    actual_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    source_record_type: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    source_record_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    source_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
