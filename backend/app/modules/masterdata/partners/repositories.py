from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.fee_payments.models import FeePaymentRequest, PartnerFeeInvoice
from app.modules.masterdata.partners.models import Partner, PartnerContact


@dataclass(frozen=True)
class PartnerFeeRecordRow:
    source_type: str
    source_code: str
    occurred_at: str
    amount: Decimal | None
    summary: str


@dataclass(frozen=True)
class PartnerRow:
    id: str
    code: str
    cn_name: str
    en_name: str
    partner_type: str
    country: str
    address: str | None
    website: str | None
    status: str
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class PartnerContactRow:
    id: str
    partner_id: str
    name: str
    title: str | None
    email: str | None
    phone: str | None
    is_primary: bool
    created_at: datetime


class PartnerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_partner(
        self,
        *,
        code: str,
        cn_name: str,
        en_name: str,
        partner_type: str,
        country: str,
        address: str | None,
        website: str | None,
        status: str,
        owner_user_id: str,
    ) -> PartnerRow:
        partner = Partner(
            code=code,
            cn_name=cn_name,
            en_name=en_name,
            partner_type=partner_type,
            country=country,
            address=address,
            website=website,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(partner)
        await self.session.flush()
        return self._map_partner(partner)

    async def update_partner(
        self,
        *,
        partner_id: str,
        cn_name: str,
        en_name: str,
        partner_type: str,
        country: str,
        address: str | None,
        website: str | None,
        status: str,
    ) -> PartnerRow | None:
        partner = await self.session.scalar(select(Partner).where(Partner.id == partner_id))
        if partner is None:
            return None
        partner.cn_name = cn_name
        partner.en_name = en_name
        partner.partner_type = partner_type
        partner.country = country
        partner.address = address
        partner.website = website
        partner.status = status
        await self.session.flush()
        return self._map_partner(partner)

    async def set_partner_status(self, *, partner_id: str, status: str) -> PartnerRow | None:
        partner = await self.session.scalar(select(Partner).where(Partner.id == partner_id))
        if partner is None:
            return None
        partner.status = status
        await self.session.flush()
        return self._map_partner(partner)

    async def add_contact(
        self,
        *,
        partner_id: str,
        name: str,
        title: str | None,
        email: str | None,
        phone: str | None,
        is_primary: bool,
    ) -> PartnerContactRow:
        if is_primary:
            await self.session.execute(
                update(PartnerContact)
                .where(PartnerContact.partner_id == partner_id)
                .values(is_primary=False)
            )
        contact = PartnerContact(
            partner_id=partner_id,
            name=name,
            title=title,
            email=email,
            phone=phone,
            is_primary=is_primary,
        )
        self.session.add(contact)
        await self.session.flush()
        return self._map_contact(contact)

    async def update_contact(
        self,
        *,
        partner_id: str,
        contact_id: str,
        name: str,
        title: str | None,
        email: str | None,
        phone: str | None,
        is_primary: bool,
    ) -> PartnerContactRow | None:
        contact = await self.session.scalar(
            select(PartnerContact).where(
                PartnerContact.id == contact_id,
                PartnerContact.partner_id == partner_id,
            )
        )
        if contact is None:
            return None
        if is_primary:
            await self.session.execute(
                update(PartnerContact)
                .where(
                    PartnerContact.partner_id == partner_id,
                    PartnerContact.id != contact_id,
                )
                .values(is_primary=False)
            )
        contact.name = name
        contact.title = title
        contact.email = email
        contact.phone = phone
        contact.is_primary = is_primary
        await self.session.flush()
        return self._map_contact(contact)

    async def delete_contact(
        self,
        *,
        partner_id: str,
        contact_id: str,
    ) -> PartnerContactRow | None:
        contact = await self.session.scalar(
            select(PartnerContact).where(
                PartnerContact.id == contact_id,
                PartnerContact.partner_id == partner_id,
            )
        )
        if contact is None:
            return None
        row = self._map_contact(contact)
        await self.session.delete(contact)
        await self.session.flush()
        return row

    async def get_partner(self, partner_id: str) -> PartnerRow | None:
        partner = await self.session.scalar(select(Partner).where(Partner.id == partner_id))
        if partner is None:
            return None
        return self._map_partner(partner)

    async def list_contacts(self, partner_id: str) -> list[PartnerContactRow]:
        rows = await self.session.scalars(
            select(PartnerContact)
            .where(PartnerContact.partner_id == partner_id)
            .order_by(PartnerContact.is_primary.desc(), PartnerContact.created_at.asc())
        )
        return [self._map_contact(row) for row in rows]

    async def list_partners(
        self,
        *,
        q: str | None = None,
        partner_type: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PartnerRow], int]:
        statement = select(Partner)
        count_statement = select(func.count()).select_from(Partner)
        conditions = []
        if q:
            pattern = f"%{q}%"
            contact_exists = (
                select(PartnerContact.id)
                .where(PartnerContact.partner_id == Partner.id)
                .where(
                    or_(
                        PartnerContact.name.ilike(pattern),
                        PartnerContact.email.ilike(pattern),
                        PartnerContact.phone.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    Partner.code.ilike(pattern),
                    Partner.cn_name.ilike(pattern),
                    Partner.en_name.ilike(pattern),
                    Partner.country.ilike(pattern),
                    contact_exists,
                )
            )
        if partner_type:
            conditions.append(Partner.partner_type == partner_type)
        if owner_user_ids is not None:
            conditions.append(Partner.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(Partner.created_at.desc(), Partner.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_partner(row) for row in rows], int(total or 0)

    async def list_fee_records(
        self,
        *,
        partner_id: str,
        limit: int = 100,
    ) -> list[PartnerFeeRecordRow]:
        """合作伙伴费用记录：聚合费用发票与费用付款申请，按发生日期倒序。"""
        rows: list[PartnerFeeRecordRow] = []

        invoices = await self.session.execute(
            select(
                PartnerFeeInvoice.invoice_no,
                PartnerFeeInvoice.invoice_date,
                PartnerFeeInvoice.total_amount,
                PartnerFeeInvoice.currency,
                PartnerFeeInvoice.fee_type,
            )
            .where(PartnerFeeInvoice.partner_id == partner_id)
            .order_by(PartnerFeeInvoice.invoice_date.desc())
            .limit(limit)
        )
        for invoice_no, invoice_date, amount, currency, fee_type in invoices.all():
            rows.append(
                PartnerFeeRecordRow(
                    source_type="fee_invoice",
                    source_code=invoice_no,
                    occurred_at=invoice_date.isoformat() if invoice_date else "",
                    amount=Decimal(str(amount or 0)),
                    summary=f"费用发票 {invoice_no}（{fee_type} / {currency}）",
                )
            )

        requests = await self.session.execute(
            select(
                FeePaymentRequest.request_no,
                FeePaymentRequest.request_date,
                FeePaymentRequest.requested_amount,
                FeePaymentRequest.currency,
                FeePaymentRequest.fee_type,
            )
            .where(FeePaymentRequest.partner_id == partner_id)
            .order_by(FeePaymentRequest.request_date.desc())
            .limit(limit)
        )
        for request_no, request_date, amount, currency, fee_type in requests.all():
            rows.append(
                PartnerFeeRecordRow(
                    source_type="fee_payment_request",
                    source_code=request_no,
                    occurred_at=request_date.isoformat() if request_date else "",
                    amount=Decimal(str(amount or 0)),
                    summary=f"费用付款申请 {request_no}（{fee_type} / {currency}）",
                )
            )

        rows.sort(key=lambda row: row.occurred_at, reverse=True)
        return rows[:limit]

    async def _scalars(self, statement: Select[tuple[Partner]]) -> list[Partner]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_partner(self, partner: Partner) -> PartnerRow:
        return PartnerRow(
            id=partner.id,
            code=partner.code,
            cn_name=partner.cn_name,
            en_name=partner.en_name,
            partner_type=partner.partner_type,
            country=partner.country,
            address=partner.address,
            website=partner.website,
            status=partner.status,
            owner_user_id=partner.owner_user_id,
            created_at=partner.created_at,
        )

    def _map_contact(self, contact: PartnerContact) -> PartnerContactRow:
        return PartnerContactRow(
            id=contact.id,
            partner_id=contact.partner_id,
            name=contact.name,
            title=contact.title,
            email=contact.email,
            phone=contact.phone,
            is_primary=contact.is_primary,
            created_at=contact.created_at,
        )
