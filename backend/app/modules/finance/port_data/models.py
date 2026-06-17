from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class PortImportBatch(Base):
    __tablename__ = "finance_port_import_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    batch_no: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    imported_at: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="imported", nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_by_user_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class CustomsDeclarationRecord(Base):
    __tablename__ = "finance_customs_declaration_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    batch_id: Mapped[str] = mapped_column(
        ForeignKey("finance_port_import_batches.id"),
        index=True,
        nullable=False,
    )
    declaration_no: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    customs_receipt_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    trade_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    export_contract_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    customs_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    hs_code: Mapped[str | None] = mapped_column(String(40), index=True, nullable=True)
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(16, 4), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    customer_or_supplier: Mapped[str | None] = mapped_column(String(240), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
