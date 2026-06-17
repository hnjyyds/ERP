from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import Select, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.document_parties.models import DocumentParty


@dataclass(frozen=True)
class DocumentPartyRow:
    id: str
    code: str
    party_type: str
    display_name: str
    customer_id: str | None
    customer_name: str | None
    country: str
    address: str | None
    contact_person: str | None
    email: str | None
    phone: str | None
    bank_name: str | None
    swift_code: str | None
    account_no: str | None
    tax_id: str | None
    remarks: str | None
    is_default: bool
    status: str
    owner_user_id: str
    created_at: datetime


class DocumentPartyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_party(
        self,
        *,
        code: str,
        party_type: str,
        display_name: str,
        customer_id: str | None,
        customer_name: str | None,
        country: str,
        address: str | None,
        contact_person: str | None,
        email: str | None,
        phone: str | None,
        bank_name: str | None,
        swift_code: str | None,
        account_no: str | None,
        tax_id: str | None,
        remarks: str | None,
        is_default: bool,
        status: str,
        owner_user_id: str,
    ) -> DocumentPartyRow:
        if is_default:
            await self.clear_default(
                party_type=party_type,
                customer_id=customer_id,
                owner_user_id=owner_user_id,
            )
        party = DocumentParty(
            code=code,
            party_type=party_type,
            display_name=display_name,
            customer_id=customer_id,
            customer_name=customer_name,
            country=country,
            address=address,
            contact_person=contact_person,
            email=email,
            phone=phone,
            bank_name=bank_name,
            swift_code=swift_code,
            account_no=account_no,
            tax_id=tax_id,
            remarks=remarks,
            is_default=is_default,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(party)
        await self.session.flush()
        return self._map_party(party)

    async def update_party(
        self,
        *,
        party_id: str,
        party_type: str,
        display_name: str,
        customer_id: str | None,
        customer_name: str | None,
        country: str,
        address: str | None,
        contact_person: str | None,
        email: str | None,
        phone: str | None,
        bank_name: str | None,
        swift_code: str | None,
        account_no: str | None,
        tax_id: str | None,
        remarks: str | None,
        is_default: bool,
        status: str,
        owner_user_id: str,
    ) -> DocumentPartyRow | None:
        party = await self.session.scalar(
            select(DocumentParty).where(DocumentParty.id == party_id)
        )
        if party is None:
            return None
        if is_default:
            await self.clear_default(
                party_type=party_type,
                customer_id=customer_id,
                owner_user_id=owner_user_id,
                exclude_party_id=party_id,
            )
        party.party_type = party_type
        party.display_name = display_name
        party.customer_id = customer_id
        party.customer_name = customer_name
        party.country = country
        party.address = address
        party.contact_person = contact_person
        party.email = email
        party.phone = phone
        party.bank_name = bank_name
        party.swift_code = swift_code
        party.account_no = account_no
        party.tax_id = tax_id
        party.remarks = remarks
        party.is_default = is_default
        party.status = status
        await self.session.flush()
        return self._map_party(party)

    async def clear_default(
        self,
        *,
        party_type: str,
        customer_id: str | None,
        owner_user_id: str,
        exclude_party_id: str | None = None,
    ) -> None:
        statement = (
            update(DocumentParty)
            .where(DocumentParty.party_type == party_type)
            .where(DocumentParty.owner_user_id == owner_user_id)
            .values(is_default=False)
        )
        if customer_id is None:
            statement = statement.where(DocumentParty.customer_id.is_(None))
        else:
            statement = statement.where(DocumentParty.customer_id == customer_id)
        if exclude_party_id is not None:
            statement = statement.where(DocumentParty.id != exclude_party_id)
        await self.session.execute(statement)

    async def get_party(self, party_id: str) -> DocumentPartyRow | None:
        party = await self.session.scalar(select(DocumentParty).where(DocumentParty.id == party_id))
        if party is None:
            return None
        return self._map_party(party)

    async def set_party_status(self, *, party_id: str, status: str) -> DocumentPartyRow | None:
        party = await self.session.scalar(select(DocumentParty).where(DocumentParty.id == party_id))
        if party is None:
            return None
        party.status = status
        if status != "active":
            party.is_default = False
        await self.session.flush()
        return self._map_party(party)

    async def list_parties(
        self,
        *,
        q: str | None = None,
        party_type: str | None = None,
        customer_id: str | None = None,
        owner_user_ids: list[str] | None = None,
        active_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[DocumentPartyRow], int]:
        statement = select(DocumentParty)
        count_statement = select(func.count()).select_from(DocumentParty)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    DocumentParty.code.ilike(pattern),
                    DocumentParty.display_name.ilike(pattern),
                    DocumentParty.customer_name.ilike(pattern),
                    DocumentParty.country.ilike(pattern),
                    DocumentParty.address.ilike(pattern),
                    DocumentParty.contact_person.ilike(pattern),
                    DocumentParty.email.ilike(pattern),
                    DocumentParty.phone.ilike(pattern),
                    DocumentParty.bank_name.ilike(pattern),
                    DocumentParty.swift_code.ilike(pattern),
                )
            )
        if party_type:
            conditions.append(DocumentParty.party_type == party_type)
        if customer_id:
            conditions.append(DocumentParty.customer_id == customer_id)
        if owner_user_ids is not None:
            conditions.append(DocumentParty.owner_user_id.in_(owner_user_ids))
        if active_only:
            conditions.append(DocumentParty.status == "active")
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(
                DocumentParty.is_default.desc(),
                DocumentParty.created_at.desc(),
                DocumentParty.code.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_party(row) for row in rows], int(total or 0)

    async def _scalars(self, statement: Select[tuple[DocumentParty]]) -> list[DocumentParty]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_party(self, party: DocumentParty) -> DocumentPartyRow:
        return DocumentPartyRow(
            id=party.id,
            code=party.code,
            party_type=party.party_type,
            display_name=party.display_name,
            customer_id=party.customer_id,
            customer_name=party.customer_name,
            country=party.country,
            address=party.address,
            contact_person=party.contact_person,
            email=party.email,
            phone=party.phone,
            bank_name=party.bank_name,
            swift_code=party.swift_code,
            account_no=party.account_no,
            tax_id=party.tax_id,
            remarks=party.remarks,
            is_default=party.is_default,
            status=party.status,
            owner_user_id=party.owner_user_id,
            created_at=party.created_at,
        )
