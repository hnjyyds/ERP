from app.db.uow import UnitOfWork
from app.modules.masterdata.document_parties.repositories import (
    DocumentPartyRepository,
    DocumentPartyRow,
)
from app.modules.masterdata.document_parties.schemas import (
    VALID_DOCUMENT_PARTY_TYPES,
    DocumentPartyCreate,
    DocumentPartyListResponse,
    DocumentPartyResponse,
    DocumentPartyUpdate,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class DocumentPartyNotFoundError(Exception):
    pass


class DocumentPartyService:
    def __init__(self, repository: DocumentPartyRepository) -> None:
        self._repository = repository

    async def create_party(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: DocumentPartyCreate,
    ) -> DocumentPartyResponse:
        self._require(current_user, "masterdata:document_party:edit")
        self._validate_party_type(payload.party_type)
        async with UnitOfWork(self._repository.session):
            party = await self._repository.create_party(
                code=payload.code,
                party_type=payload.party_type,
                display_name=payload.display_name,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                country=payload.country,
                address=payload.address,
                contact_person=payload.contact_person,
                email=payload.email,
                phone=payload.phone,
                bank_name=payload.bank_name,
                swift_code=payload.swift_code,
                account_no=payload.account_no,
                tax_id=payload.tax_id,
                remarks=payload.remarks,
                is_default=payload.is_default,
                status=payload.status,
                owner_user_id=current_user.id,
            )
        return self._party_response(party)

    async def update_party(
        self,
        *,
        current_user: CurrentUserResponse,
        party_id: str,
        payload: DocumentPartyUpdate,
    ) -> DocumentPartyResponse:
        self._require(current_user, "masterdata:document_party:edit")
        self._validate_party_type(payload.party_type)
        await self._get_accessible_party(current_user=current_user, party_id=party_id)
        async with UnitOfWork(self._repository.session):
            party = await self._repository.update_party(
                party_id=party_id,
                party_type=payload.party_type,
                display_name=payload.display_name,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                country=payload.country,
                address=payload.address,
                contact_person=payload.contact_person,
                email=payload.email,
                phone=payload.phone,
                bank_name=payload.bank_name,
                swift_code=payload.swift_code,
                account_no=payload.account_no,
                tax_id=payload.tax_id,
                remarks=payload.remarks,
                is_default=payload.is_default,
                status=payload.status,
                owner_user_id=current_user.id,
            )
            if party is None:
                raise DocumentPartyNotFoundError
        return self._party_response(party)

    async def get_party(
        self,
        *,
        current_user: CurrentUserResponse,
        party_id: str,
    ) -> DocumentPartyResponse:
        party = await self._get_accessible_party(
            current_user=current_user,
            party_id=party_id,
        )
        return self._party_response(party)

    async def list_parties(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        party_type: str | None,
        customer_id: str | None,
    ) -> DocumentPartyListResponse:
        self._require(current_user, "masterdata:document_party:view")
        if party_type is not None:
            self._validate_party_type(party_type)
        owner_user_id = self._owner_filter(current_user)
        parties, total = await self._repository.list_parties(
            q=q,
            party_type=party_type,
            customer_id=customer_id,
            owner_user_id=owner_user_id,
        )
        return DocumentPartyListResponse(
            items=[self._party_response(party) for party in parties],
            total=total,
        )

    async def lookup_parties(
        self,
        *,
        current_user: CurrentUserResponse,
        party_type: str,
        customer_id: str | None,
    ) -> DocumentPartyListResponse:
        self._require(current_user, "masterdata:document_party:view")
        self._validate_party_type(party_type)
        owner_user_id = self._owner_filter(current_user)
        parties, total = await self._repository.list_parties(
            party_type=party_type,
            customer_id=customer_id,
            owner_user_id=owner_user_id,
            active_only=True,
        )
        return DocumentPartyListResponse(
            items=[self._party_response(party) for party in parties],
            total=total,
        )

    async def _get_accessible_party(
        self,
        *,
        current_user: CurrentUserResponse,
        party_id: str,
    ) -> DocumentPartyRow:
        self._require(current_user, "masterdata:document_party:view")
        party = await self._repository.get_party(party_id)
        if party is None:
            raise DocumentPartyNotFoundError
        if (
            "masterdata:document_party:view_all" not in current_user.permissions
            and party.owner_user_id != current_user.id
        ):
            raise DocumentPartyNotFoundError
        return party

    def _owner_filter(self, current_user: CurrentUserResponse) -> str | None:
        if "masterdata:document_party:view_all" in current_user.permissions:
            return None
        return current_user.id

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_party_type(self, party_type: str) -> None:
        if party_type not in VALID_DOCUMENT_PARTY_TYPES:
            raise ValueError("单证资料类型无效")

    def _party_response(self, party: DocumentPartyRow) -> DocumentPartyResponse:
        return DocumentPartyResponse(
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
        )
