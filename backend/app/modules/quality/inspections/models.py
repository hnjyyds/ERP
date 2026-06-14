from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
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
    inspected_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    result: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    inspector_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    inspector_name: Mapped[str] = mapped_column(String(160), nullable=False)
    issue_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_group_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
