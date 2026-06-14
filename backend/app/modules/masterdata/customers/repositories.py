from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.customers.models import (
    Customer,
    CustomerContact,
    CustomerCreditProfile,
)


@dataclass(frozen=True)
class CustomerRow:
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
class CustomerContactRow:
    id: str
    customer_id: str
    name: str
    title: str | None
    email: str | None
    phone: str | None
    is_primary: bool
    created_at: datetime


@dataclass(frozen=True)
class CustomerCreditProfileRow:
    id: str
    customer_id: str
    credit_grade: str
    credit_limit: Decimal
    currency: str
    payment_terms: str
    risk_note: str | None
    updated_at: datetime


class CustomerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_customer(
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
    ) -> CustomerRow:
        customer = Customer(
            code=code,
            cn_name=cn_name,
            en_name=en_name,
            country=country,
            address=address,
            website=website,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(customer)
        await self.session.flush()
        return self._map_customer(customer)

    async def update_customer(
        self,
        *,
        customer_id: str,
        cn_name: str,
        en_name: str,
        country: str,
        address: str | None,
        website: str | None,
        status: str,
    ) -> CustomerRow | None:
        customer = await self.session.scalar(select(Customer).where(Customer.id == customer_id))
        if customer is None:
            return None
        customer.cn_name = cn_name
        customer.en_name = en_name
        customer.country = country
        customer.address = address
        customer.website = website
        customer.status = status
        await self.session.flush()
        return self._map_customer(customer)

    async def add_contact(
        self,
        *,
        customer_id: str,
        name: str,
        title: str | None,
        email: str | None,
        phone: str | None,
        is_primary: bool,
    ) -> CustomerContactRow:
        if is_primary:
            await self.session.execute(
                update(CustomerContact)
                .where(CustomerContact.customer_id == customer_id)
                .values(is_primary=False)
            )
        contact = CustomerContact(
            customer_id=customer_id,
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
        customer_id: str,
        credit_grade: str,
        credit_limit: Decimal | str,
        currency: str,
        payment_terms: str,
        risk_note: str | None,
    ) -> CustomerCreditProfileRow:
        profile = await self.session.scalar(
            select(CustomerCreditProfile).where(CustomerCreditProfile.customer_id == customer_id)
        )
        if profile is None:
            profile = CustomerCreditProfile(
                customer_id=customer_id,
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

    async def get_customer(self, customer_id: str) -> CustomerRow | None:
        customer = await self.session.scalar(select(Customer).where(Customer.id == customer_id))
        if customer is None:
            return None
        return self._map_customer(customer)

    async def list_contacts(self, customer_id: str) -> list[CustomerContactRow]:
        rows = await self.session.scalars(
            select(CustomerContact)
            .where(CustomerContact.customer_id == customer_id)
            .order_by(CustomerContact.is_primary.desc(), CustomerContact.created_at.asc())
        )
        return [self._map_contact(row) for row in rows]

    async def get_credit_profile(self, customer_id: str) -> CustomerCreditProfileRow | None:
        profile = await self.session.scalar(
            select(CustomerCreditProfile).where(CustomerCreditProfile.customer_id == customer_id)
        )
        if profile is None:
            return None
        return self._map_credit_profile(profile)

    async def list_customers(
        self,
        *,
        q: str | None = None,
        country: str | None = None,
        credit_grade: str | None = None,
        owner_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[CustomerRow], int]:
        statement = select(Customer)
        count_statement = select(func.count()).select_from(Customer)
        conditions = []
        if q:
            pattern = f"%{q}%"
            contact_exists = (
                select(CustomerContact.id)
                .where(CustomerContact.customer_id == Customer.id)
                .where(
                    or_(
                        CustomerContact.name.ilike(pattern),
                        CustomerContact.email.ilike(pattern),
                        CustomerContact.phone.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    Customer.code.ilike(pattern),
                    Customer.cn_name.ilike(pattern),
                    Customer.en_name.ilike(pattern),
                    Customer.country.ilike(pattern),
                    contact_exists,
                )
            )
        if country:
            conditions.append(Customer.country.ilike(f"%{country}%"))
        if credit_grade:
            credit_exists = (
                select(CustomerCreditProfile.id)
                .where(CustomerCreditProfile.customer_id == Customer.id)
                .where(CustomerCreditProfile.credit_grade == credit_grade)
                .exists()
            )
            conditions.append(credit_exists)
        if owner_user_id:
            conditions.append(Customer.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(Customer.created_at.desc(), Customer.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_customer(row) for row in rows], int(total or 0)

    async def _scalars(self, statement: Select[tuple[Customer]]) -> list[Customer]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_customer(self, customer: Customer) -> CustomerRow:
        return CustomerRow(
            id=customer.id,
            code=customer.code,
            cn_name=customer.cn_name,
            en_name=customer.en_name,
            country=customer.country,
            address=customer.address,
            website=customer.website,
            status=customer.status,
            owner_user_id=customer.owner_user_id,
            created_at=customer.created_at,
        )

    def _map_contact(self, contact: CustomerContact) -> CustomerContactRow:
        return CustomerContactRow(
            id=contact.id,
            customer_id=contact.customer_id,
            name=contact.name,
            title=contact.title,
            email=contact.email,
            phone=contact.phone,
            is_primary=contact.is_primary,
            created_at=contact.created_at,
        )

    def _map_credit_profile(
        self,
        profile: CustomerCreditProfile,
    ) -> CustomerCreditProfileRow:
        return CustomerCreditProfileRow(
            id=profile.id,
            customer_id=profile.customer_id,
            credit_grade=profile.credit_grade,
            credit_limit=profile.credit_limit,
            currency=profile.currency,
            payment_terms=profile.payment_terms,
            risk_note=profile.risk_note,
            updated_at=profile.updated_at,
        )
