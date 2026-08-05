from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class QualityInspection(Base):
    __tablename__ = "quality_inspections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    purchase_contract_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    purchase_contract_no: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    supplier_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        default="completed",
        nullable=False,
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=True,
    )
    inspected_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    result: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    inspector_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    inspector_name: Mapped[str] = mapped_column(String(160), nullable=False)
    qc_user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    qc_user_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    issue_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_group_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    parent_inspection_id: Mapped[str | None] = mapped_column(
        ForeignKey("quality_inspections.id"),
        index=True,
        nullable=True,
    )
    reinspection_no: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class QualityInspectionLine(Base):
    __tablename__ = "quality_inspection_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    inspection_id: Mapped[str] = mapped_column(
        ForeignKey("quality_inspections.id"),
        index=True,
        nullable=False,
    )
    purchase_contract_line_id: Mapped[str | None] = mapped_column(
        String(36),
        index=True,
        nullable=True,
    )
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    inspected_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    failed_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    result: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class QualityIssue(Base):
    __tablename__ = "quality_issues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    inspection_id: Mapped[str] = mapped_column(
        ForeignKey("quality_inspections.id"),
        index=True,
        nullable=False,
    )
    line_id: Mapped[str | None] = mapped_column(
        ForeignKey("quality_inspection_lines.id"),
        index=True,
        nullable=True,
    )
    issue_type: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    corrective_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), index=True, default="open", nullable=False)
    attachment_group_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    resolved_by_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class QualityInspectionAttachment(Base):
    __tablename__ = "quality_inspection_attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    inspection_id: Mapped[str] = mapped_column(
        ForeignKey("quality_inspections.id"),
        index=True,
        nullable=False,
    )
    issue_id: Mapped[str | None] = mapped_column(
        ForeignKey("quality_issues.id"),
        index=True,
        nullable=True,
    )
    category: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(240), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    uploaded_by_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class QualityInspectionEvent(Base):
    __tablename__ = "quality_inspection_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    inspection_id: Mapped[str] = mapped_column(
        ForeignKey("quality_inspections.id"),
        index=True,
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    to_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    actor_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    actor_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
