from app.db.uow import UnitOfWork
from app.modules.masterdata.partners.repositories import (
    PartnerContactRow,
    PartnerRepository,
    PartnerRow,
)
from app.modules.masterdata.partners.schemas import (
    VALID_PARTNER_TYPES,
    PartnerContactCreate,
    PartnerContactResponse,
    PartnerContactUpdate,
    PartnerCreate,
    PartnerFeeRecordListResponse,
    PartnerFeeRecordResponse,
    PartnerListResponse,
    PartnerResponse,
    PartnerUpdate,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class PartnerNotFoundError(Exception):
    pass


class PartnerContactNotFoundError(Exception):
    pass


class PartnerService:
    def __init__(
        self,
        repository: PartnerRepository,
        *,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._data_scope_resolver = data_scope_resolver

    async def create_partner(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PartnerCreate,
    ) -> PartnerResponse:
        self._require(current_user, "masterdata:partner:edit")
        self._validate_partner_type(payload.partner_type)
        async with UnitOfWork(self._repository.session):
            partner = await self._repository.create_partner(
                code=payload.code,
                cn_name=payload.cn_name,
                en_name=payload.en_name,
                partner_type=payload.partner_type,
                country=payload.country,
                address=payload.address,
                website=payload.website,
                status=payload.status,
                owner_user_id=current_user.id,
            )
            for contact in payload.contacts:
                await self._repository.add_contact(
                    partner_id=partner.id,
                    name=contact.name,
                    title=contact.title,
                    email=contact.email,
                    phone=contact.phone,
                    is_primary=contact.is_primary,
                )
        return await self._partner_response(partner)

    async def update_partner(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
        payload: PartnerUpdate,
    ) -> PartnerResponse:
        self._require(current_user, "masterdata:partner:edit")
        self._validate_partner_type(payload.partner_type)
        await self._get_accessible_partner(current_user=current_user, partner_id=partner_id)
        async with UnitOfWork(self._repository.session):
            partner = await self._repository.update_partner(
                partner_id=partner_id,
                cn_name=payload.cn_name,
                en_name=payload.en_name,
                partner_type=payload.partner_type,
                country=payload.country,
                address=payload.address,
                website=payload.website,
                status=payload.status,
            )
            if partner is None:
                raise PartnerNotFoundError
        return await self._partner_response(partner)

    async def add_contact(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
        payload: PartnerContactCreate,
    ) -> PartnerContactResponse:
        self._require(current_user, "masterdata:partner:edit")
        await self._get_accessible_partner(current_user=current_user, partner_id=partner_id)
        async with UnitOfWork(self._repository.session):
            contact = await self._repository.add_contact(
                partner_id=partner_id,
                name=payload.name,
                title=payload.title,
                email=payload.email,
                phone=payload.phone,
                is_primary=payload.is_primary,
            )
        return self._contact_response(contact)

    async def update_contact(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
        contact_id: str,
        payload: PartnerContactUpdate,
    ) -> PartnerContactResponse:
        self._require(current_user, "masterdata:partner:edit")
        await self._get_accessible_partner(current_user=current_user, partner_id=partner_id)
        async with UnitOfWork(self._repository.session):
            contact = await self._repository.update_contact(
                partner_id=partner_id,
                contact_id=contact_id,
                name=payload.name,
                title=payload.title,
                email=payload.email,
                phone=payload.phone,
                is_primary=payload.is_primary,
            )
            if contact is None:
                raise PartnerContactNotFoundError
        return self._contact_response(contact)

    async def delete_contact(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
        contact_id: str,
    ) -> PartnerContactResponse:
        self._require(current_user, "masterdata:partner:edit")
        await self._get_accessible_partner(current_user=current_user, partner_id=partner_id)
        async with UnitOfWork(self._repository.session):
            contact = await self._repository.delete_contact(
                partner_id=partner_id,
                contact_id=contact_id,
            )
            if contact is None:
                raise PartnerContactNotFoundError
        return self._contact_response(contact)

    async def get_partner(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
    ) -> PartnerResponse:
        partner = await self._get_accessible_partner(
            current_user=current_user,
            partner_id=partner_id,
        )
        return await self._partner_response(partner)

    async def list_partners(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        partner_type: str | None,
    ) -> PartnerListResponse:
        self._require(current_user, "masterdata:partner:view")
        if partner_type is not None:
            self._validate_partner_type(partner_type)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        partners, total = await self._repository.list_partners(
            q=q,
            partner_type=partner_type,
            owner_user_ids=owner_user_ids,
        )
        items = [await self._partner_response(partner) for partner in partners]
        return PartnerListResponse(items=items, total=total)

    async def list_fee_records(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
    ) -> PartnerFeeRecordListResponse:
        await self._get_accessible_partner(current_user=current_user, partner_id=partner_id)
        rows = await self._repository.list_fee_records(partner_id=partner_id)
        items = [
            PartnerFeeRecordResponse(
                source_type=row.source_type,
                source_code=row.source_code,
                occurred_at=row.occurred_at,
                amount=str(row.amount) if row.amount is not None else None,
                summary=row.summary,
            )
            for row in rows
        ]
        return PartnerFeeRecordListResponse(items=items, total=len(items))

    async def deactivate_partner(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
    ) -> PartnerResponse:
        self._require(current_user, "masterdata:partner:edit")
        await self._get_accessible_partner(current_user=current_user, partner_id=partner_id)
        async with UnitOfWork(self._repository.session):
            partner = await self._repository.set_partner_status(
                partner_id=partner_id,
                status="inactive",
            )
            if partner is None:
                raise PartnerNotFoundError
        return await self._partner_response(partner)

    async def _get_accessible_partner(
        self,
        *,
        current_user: CurrentUserResponse,
        partner_id: str,
    ) -> PartnerRow:
        self._require(current_user, "masterdata:partner:view")
        partner = await self._repository.get_partner(partner_id)
        if partner is None:
            raise PartnerNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and partner.owner_user_id not in allowed_user_ids:
            raise PartnerNotFoundError
        return partner

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_partner_type(self, partner_type: str) -> None:
        if partner_type not in VALID_PARTNER_TYPES:
            raise ValueError("合作伙伴类型无效")

    async def _partner_response(self, partner: PartnerRow) -> PartnerResponse:
        contacts = await self._repository.list_contacts(partner.id)
        contact_responses = [self._contact_response(contact) for contact in contacts]
        primary_contact = next(
            (contact for contact in contact_responses if contact.is_primary),
            None,
        )
        return PartnerResponse(
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
            contacts=contact_responses,
            primary_contact=primary_contact,
        )

    def _contact_response(self, contact: PartnerContactRow) -> PartnerContactResponse:
        return PartnerContactResponse(
            id=contact.id,
            partner_id=contact.partner_id,
            name=contact.name,
            title=contact.title,
            email=contact.email,
            phone=contact.phone,
            is_primary=contact.is_primary,
        )
