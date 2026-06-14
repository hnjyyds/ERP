from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class Partner(Base):
    __tablename__ = "partners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    cn_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    en_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    partner_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    country: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="active", nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class PartnerContact(Base):
    __tablename__ = "partner_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    title: Mapped[str | None] = mapped_column(String(160), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
