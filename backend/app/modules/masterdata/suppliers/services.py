from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.masterdata.suppliers.repositories import (
    SupplierContactRow,
    SupplierCreditProfileRow,
    SupplierRepository,
    SupplierRow,
)
from app.modules.masterdata.suppliers.schemas import (
    SupplierContactCreate,
    SupplierContactResponse,
    SupplierCreate,
    SupplierCreditProfileInput,
    SupplierCreditProfileResponse,
    SupplierListResponse,
    SupplierResponse,
    SupplierTransactionListResponse,
    SupplierUpdate,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class SupplierNotFoundError(Exception):
    pass


class SupplierService:
    def __init__(self, repository: SupplierRepository) -> None:
        self._repository = repository

    async def create_supplier(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: SupplierCreate,
    ) -> SupplierResponse:
        self._require(current_user, "masterdata:supplier:edit")
        self._require_credit_edit_if_needed(current_user, payload.credit_profile)
        async with UnitOfWork(self._repository.session):
            supplier = await self._repository.create_supplier(
                code=payload.code,
                cn_name=payload.cn_name,
                en_name=payload.en_name,
                country=payload.country,
                address=payload.address,
                website=payload.website,
                status=payload.status,
                owner_user_id=current_user.id,
            )
            for contact in payload.contacts:
                await self._repository.add_contact(
                    supplier_id=supplier.id,
                    name=contact.name,
                    title=contact.title,
                    email=contact.email,
                    phone=contact.phone,
                    is_primary=contact.is_primary,
                )
            if payload.credit_profile is not None:
                await self._upsert_credit_profile(supplier.id, payload.credit_profile)
        return await self._supplier_response(
            supplier,
            can_view_credit_limit=self._can_view_credit_limit(current_user),
        )

    async def update_supplier(
        self,
        *,
        current_user: CurrentUserResponse,
        supplier_id: str,
        payload: SupplierUpdate,
    ) -> SupplierResponse:
        self._require(current_user, "masterdata:supplier:edit")
        self._require_credit_edit_if_needed(current_user, payload.credit_profile)
        await self._get_accessible_supplier(current_user=current_user, supplier_id=supplier_id)
        async with UnitOfWork(self._repository.session):
            supplier = await self._repository.update_supplier(
                supplier_id=supplier_id,
                cn_name=payload.cn_name,
                en_name=payload.en_name,
                country=payload.country,
                address=payload.address,
                website=payload.website,
                status=payload.status,
            )
            if supplier is None:
                raise SupplierNotFoundError
            if payload.credit_profile is not None:
                await self._upsert_credit_profile(supplier_id, payload.credit_profile)
        return await self._supplier_response(
            supplier,
            can_view_credit_limit=self._can_view_credit_limit(current_user),
        )

    async def add_contact(
        self,
        *,
        current_user: CurrentUserResponse,
        supplier_id: str,
        payload: SupplierContactCreate,
    ) -> SupplierContactResponse:
        self._require(current_user, "masterdata:supplier:edit")
        await self._get_accessible_supplier(current_user=current_user, supplier_id=supplier_id)
        async with UnitOfWork(self._repository.session):
            contact = await self._repository.add_contact(
                supplier_id=supplier_id,
                name=payload.name,
                title=payload.title,
                email=payload.email,
                phone=payload.phone,
                is_primary=payload.is_primary,
            )
        return self._contact_response(contact)

    async def get_supplier(
        self,
        *,
        current_user: CurrentUserResponse,
        supplier_id: str,
    ) -> SupplierResponse:
        supplier = await self._get_accessible_supplier(
            current_user=current_user,
            supplier_id=supplier_id,
        )
        return await self._supplier_response(
            supplier,
            can_view_credit_limit=self._can_view_credit_limit(current_user),
        )

    async def list_suppliers(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        country: str | None,
        credit_grade: str | None,
    ) -> SupplierListResponse:
        self._require(current_user, "masterdata:supplier:view")
        owner_user_id = None
        if "masterdata:supplier:view_all" not in current_user.permissions:
            owner_user_id = current_user.id
        suppliers, total = await self._repository.list_suppliers(
            q=q,
            country=country,
            credit_grade=credit_grade,
            owner_user_id=owner_user_id,
        )
        items = [
            await self._supplier_response(
                supplier,
                can_view_credit_limit=self._can_view_credit_limit(current_user),
            )
            for supplier in suppliers
        ]
        return SupplierListResponse(items=items, total=total)

    async def list_transactions(
        self,
        *,
        current_user: CurrentUserResponse,
        supplier_id: str,
    ) -> SupplierTransactionListResponse:
        await self._get_accessible_supplier(current_user=current_user, supplier_id=supplier_id)
        return SupplierTransactionListResponse(items=[], total=0)

    async def _get_accessible_supplier(
        self,
        *,
        current_user: CurrentUserResponse,
        supplier_id: str,
    ) -> SupplierRow:
        self._require(current_user, "masterdata:supplier:view")
        supplier = await self._repository.get_supplier(supplier_id)
        if supplier is None:
            raise SupplierNotFoundError
        if (
            "masterdata:supplier:view_all" not in current_user.permissions
            and supplier.owner_user_id != current_user.id
        ):
            raise SupplierNotFoundError
        return supplier

    async def _upsert_credit_profile(
        self,
        supplier_id: str,
        payload: SupplierCreditProfileInput,
    ) -> SupplierCreditProfileRow:
        return await self._repository.upsert_credit_profile(
            supplier_id=supplier_id,
            credit_grade=payload.credit_grade,
            credit_limit=payload.credit_limit,
            currency=payload.currency,
            payment_terms=payload.payment_terms,
            risk_note=payload.risk_note,
        )

    def _require_credit_edit_if_needed(
        self,
        current_user: CurrentUserResponse,
        credit_profile: SupplierCreditProfileInput | None,
    ) -> None:
        if credit_profile is not None:
            self._require(current_user, "masterdata:supplier:credit:edit")

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _can_view_credit_limit(self, current_user: CurrentUserResponse) -> bool:
        return "masterdata:supplier:credit:view" in current_user.permissions

    async def _supplier_response(
        self,
        supplier: SupplierRow,
        *,
        can_view_credit_limit: bool,
    ) -> SupplierResponse:
        contacts = await self._repository.list_contacts(supplier.id)
        credit_profile = await self._repository.get_credit_profile(supplier.id)
        contact_responses = [self._contact_response(contact) for contact in contacts]
        primary_contact = next(
            (contact for contact in contact_responses if contact.is_primary),
            None,
        )
        return SupplierResponse(
            id=supplier.id,
            code=supplier.code,
            cn_name=supplier.cn_name,
            en_name=supplier.en_name,
            country=supplier.country,
            address=supplier.address,
            website=supplier.website,
            status=supplier.status,
            owner_user_id=supplier.owner_user_id,
            contacts=contact_responses,
            primary_contact=primary_contact,
            credit_profile=self._credit_profile_response(
                credit_profile,
                can_view_credit_limit=can_view_credit_limit,
            ),
        )

    def _contact_response(self, contact: SupplierContactRow) -> SupplierContactResponse:
        return SupplierContactResponse(
            id=contact.id,
            supplier_id=contact.supplier_id,
            name=contact.name,
            title=contact.title,
            email=contact.email,
            phone=contact.phone,
            is_primary=contact.is_primary,
        )

    def _credit_profile_response(
        self,
        profile: SupplierCreditProfileRow | None,
        *,
        can_view_credit_limit: bool,
    ) -> SupplierCreditProfileResponse | None:
        if profile is None:
            return None
        credit_limit = self._money(profile.credit_limit) if can_view_credit_limit else None
        return SupplierCreditProfileResponse(
            credit_grade=profile.credit_grade,
            credit_limit=credit_limit,
            currency=profile.currency,
            payment_terms=profile.payment_terms,
            risk_note=profile.risk_note,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"
