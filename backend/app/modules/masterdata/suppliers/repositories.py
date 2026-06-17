from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.suppliers.models import (
    Supplier,
    SupplierContact,
    SupplierCreditProfile,
)


@dataclass(frozen=True)
class SupplierRow:
    id: str
    code: str
    cn_name: str
    en_name: str
    country: str
    address: str | None
    website: str | None
    status: str
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class SupplierContactRow:
    id: str
    supplier_id: str
    name: str
    title: str | None
    email: str | None
    phone: str | None
    is_primary: bool
    created_at: datetime


@dataclass(frozen=True)
class SupplierCreditProfileRow:
    id: str
    supplier_id: str
    credit_grade: str
    credit_limit: Decimal
    currency: str
    payment_terms: str
    risk_note: str | None
    updated_at: datetime


class SupplierRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_supplier(
        self,
        *,
        code: str,
        cn_name: str,
        en_name: str,
        country: str,
        address: str | None,
        website: str | None,
        status: str,
        owner_user_id: str,
    ) -> SupplierRow:
        supplier = Supplier(
            code=code,
            cn_name=cn_name,
            en_name=en_name,
            country=country,
            address=address,
            website=website,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(supplier)
        await self.session.flush()
        return self._map_supplier(supplier)

    async def update_supplier(
        self,
        *,
        supplier_id: str,
        cn_name: str,
        en_name: str,
        country: str,
        address: str | None,
        website: str | None,
        status: str,
    ) -> SupplierRow | None:
        supplier = await self.session.scalar(select(Supplier).where(Supplier.id == supplier_id))
        if supplier is None:
            return None
        supplier.cn_name = cn_name
        supplier.en_name = en_name
        supplier.country = country
        supplier.address = address
        supplier.website = website
        supplier.status = status
        await self.session.flush()
        return self._map_supplier(supplier)

    async def add_contact(
        self,
        *,
        supplier_id: str,
        name: str,
        title: str | None,
        email: str | None,
        phone: str | None,
        is_primary: bool,
    ) -> SupplierContactRow:
        if is_primary:
            await self.session.execute(
                update(SupplierContact)
                .where(SupplierContact.supplier_id == supplier_id)
                .values(is_primary=False)
            )
        contact = SupplierContact(
            supplier_id=supplier_id,
            name=name,
            title=title,
            email=email,
            phone=phone,
            is_primary=is_primary,
        )
        self.session.add(contact)
        await self.session.flush()
        return self._map_contact(contact)

    async def upsert_credit_profile(
        self,
        *,
        supplier_id: str,
        credit_grade: str,
        credit_limit: Decimal | str,
        currency: str,
        payment_terms: str,
        risk_note: str | None,
    ) -> SupplierCreditProfileRow:
        profile = await self.session.scalar(
            select(SupplierCreditProfile).where(SupplierCreditProfile.supplier_id == supplier_id)
        )
        if profile is None:
            profile = SupplierCreditProfile(
                supplier_id=supplier_id,
                credit_grade=credit_grade,
                credit_limit=Decimal(str(credit_limit)),
                currency=currency,
                payment_terms=payment_terms,
                risk_note=risk_note,
            )
            self.session.add(profile)
        else:
            profile.credit_grade = credit_grade
            profile.credit_limit = Decimal(str(credit_limit))
            profile.currency = currency
            profile.payment_terms = payment_terms
            profile.risk_note = risk_note
        await self.session.flush()
        return self._map_credit_profile(profile)

    async def get_supplier(self, supplier_id: str) -> SupplierRow | None:
        supplier = await self.session.scalar(select(Supplier).where(Supplier.id == supplier_id))
        if supplier is None:
            return None
        return self._map_supplier(supplier)

    async def set_supplier_status(self, *, supplier_id: str, status: str) -> SupplierRow | None:
        supplier = await self.session.scalar(select(Supplier).where(Supplier.id == supplier_id))
        if supplier is None:
            return None
        supplier.status = status
        await self.session.flush()
        return self._map_supplier(supplier)

    async def list_contacts(self, supplier_id: str) -> list[SupplierContactRow]:
        rows = await self.session.scalars(
            select(SupplierContact)
            .where(SupplierContact.supplier_id == supplier_id)
            .order_by(SupplierContact.is_primary.desc(), SupplierContact.created_at.asc())
        )
        return [self._map_contact(row) for row in rows]

    async def get_credit_profile(self, supplier_id: str) -> SupplierCreditProfileRow | None:
        profile = await self.session.scalar(
            select(SupplierCreditProfile).where(SupplierCreditProfile.supplier_id == supplier_id)
        )
        if profile is None:
            return None
        return self._map_credit_profile(profile)

    async def list_suppliers(
        self,
        *,
        q: str | None = None,
        country: str | None = None,
        credit_grade: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SupplierRow], int]:
        statement = select(Supplier)
        count_statement = select(func.count()).select_from(Supplier)
        conditions = []
        if q:
            pattern = f"%{q}%"
            contact_exists = (
                select(SupplierContact.id)
                .where(SupplierContact.supplier_id == Supplier.id)
                .where(
                    or_(
                        SupplierContact.name.ilike(pattern),
                        SupplierContact.email.ilike(pattern),
                        SupplierContact.phone.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    Supplier.code.ilike(pattern),
                    Supplier.cn_name.ilike(pattern),
                    Supplier.en_name.ilike(pattern),
                    Supplier.country.ilike(pattern),
                    contact_exists,
                )
            )
        if country:
            conditions.append(Supplier.country.ilike(f"%{country}%"))
        if credit_grade:
            credit_exists = (
                select(SupplierCreditProfile.id)
                .where(SupplierCreditProfile.supplier_id == Supplier.id)
                .where(SupplierCreditProfile.credit_grade == credit_grade)
                .exists()
            )
            conditions.append(credit_exists)
        if owner_user_ids is not None:
            conditions.append(Supplier.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(Supplier.created_at.desc(), Supplier.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_supplier(row) for row in rows], int(total or 0)

    async def _scalars(self, statement: Select[tuple[Supplier]]) -> list[Supplier]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_supplier(self, supplier: Supplier) -> SupplierRow:
        return SupplierRow(
            id=supplier.id,
            code=supplier.code,
            cn_name=supplier.cn_name,
            en_name=supplier.en_name,
            country=supplier.country,
            address=supplier.address,
            website=supplier.website,
            status=supplier.status,
            owner_user_id=supplier.owner_user_id,
            created_at=supplier.created_at,
        )

    def _map_contact(self, contact: SupplierContact) -> SupplierContactRow:
        return SupplierContactRow(
            id=contact.id,
            supplier_id=contact.supplier_id,
            name=contact.name,
            title=contact.title,
            email=contact.email,
            phone=contact.phone,
            is_primary=contact.is_primary,
            created_at=contact.created_at,
        )

    def _map_credit_profile(
        self,
        profile: SupplierCreditProfile,
    ) -> SupplierCreditProfileRow:
        return SupplierCreditProfileRow(
            id=profile.id,
            supplier_id=profile.supplier_id,
            credit_grade=profile.credit_grade,
            credit_limit=profile.credit_limit,
            currency=profile.currency,
            payment_terms=profile.payment_terms,
            risk_note=profile.risk_note,
            updated_at=profile.updated_at,
        )
