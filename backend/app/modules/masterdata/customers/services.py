from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.masterdata.customers.repositories import (
    CustomerContactRow,
    CustomerCreditProfileRow,
    CustomerRepository,
    CustomerRow,
)
from app.modules.masterdata.customers.schemas import (
    CustomerContactCreate,
    CustomerContactResponse,
    CustomerContactUpdate,
    CustomerCreate,
    CustomerCreditProfileInput,
    CustomerCreditProfileResponse,
    CustomerListResponse,
    CustomerResponse,
    CustomerTransactionListResponse,
    CustomerTransactionResponse,
    CustomerUpdate,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class CustomerNotFoundError(Exception):
    pass


class CustomerContactNotFoundError(Exception):
    pass


class CustomerService:
    def __init__(
        self,
        repository: CustomerRepository,
        *,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._data_scope_resolver = data_scope_resolver

    async def create_customer(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: CustomerCreate,
    ) -> CustomerResponse:
        self._require(current_user, "masterdata:customer:edit")
        self._require_credit_edit_if_needed(current_user, payload.credit_profile)
        async with UnitOfWork(self._repository.session):
            customer = await self._repository.create_customer(
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
                    customer_id=customer.id,
                    name=contact.name,
                    title=contact.title,
                    email=contact.email,
                    phone=contact.phone,
                    is_primary=contact.is_primary,
                )
            if payload.credit_profile is not None:
                await self._upsert_credit_profile(customer.id, payload.credit_profile)
        return await self._customer_response(
            customer,
            can_view_credit_limit=self._can_view_credit_limit(current_user),
        )

    async def update_customer(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str,
        payload: CustomerUpdate,
    ) -> CustomerResponse:
        self._require(current_user, "masterdata:customer:edit")
        self._require_credit_edit_if_needed(current_user, payload.credit_profile)
        await self._get_accessible_customer(current_user=current_user, customer_id=customer_id)
        async with UnitOfWork(self._repository.session):
            customer = await self._repository.update_customer(
                customer_id=customer_id,
                cn_name=payload.cn_name,
                en_name=payload.en_name,
                country=payload.country,
                address=payload.address,
                website=payload.website,
                status=payload.status,
            )
            if customer is None:
                raise CustomerNotFoundError
            if payload.credit_profile is not None:
                await self._upsert_credit_profile(customer_id, payload.credit_profile)
        return await self._customer_response(
            customer,
            can_view_credit_limit=self._can_view_credit_limit(current_user),
        )

    async def add_contact(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str,
        payload: CustomerContactCreate,
    ) -> CustomerContactResponse:
        self._require(current_user, "masterdata:customer:edit")
        await self._get_accessible_customer(current_user=current_user, customer_id=customer_id)
        async with UnitOfWork(self._repository.session):
            contact = await self._repository.add_contact(
                customer_id=customer_id,
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
        customer_id: str,
        contact_id: str,
        payload: CustomerContactUpdate,
    ) -> CustomerContactResponse:
        self._require(current_user, "masterdata:customer:edit")
        await self._get_accessible_customer(current_user=current_user, customer_id=customer_id)
        async with UnitOfWork(self._repository.session):
            contact = await self._repository.update_contact(
                customer_id=customer_id,
                contact_id=contact_id,
                name=payload.name,
                title=payload.title,
                email=payload.email,
                phone=payload.phone,
                is_primary=payload.is_primary,
            )
            if contact is None:
                raise CustomerContactNotFoundError
        return self._contact_response(contact)

    async def delete_contact(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str,
        contact_id: str,
    ) -> CustomerContactResponse:
        self._require(current_user, "masterdata:customer:edit")
        await self._get_accessible_customer(current_user=current_user, customer_id=customer_id)
        async with UnitOfWork(self._repository.session):
            contact = await self._repository.delete_contact(
                customer_id=customer_id,
                contact_id=contact_id,
            )
            if contact is None:
                raise CustomerContactNotFoundError
        return self._contact_response(contact)

    async def get_customer(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str,
    ) -> CustomerResponse:
        customer = await self._get_accessible_customer(
            current_user=current_user,
            customer_id=customer_id,
        )
        return await self._customer_response(
            customer,
            can_view_credit_limit=self._can_view_credit_limit(current_user),
        )

    async def list_customers(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        country: str | None,
        credit_grade: str | None,
    ) -> CustomerListResponse:
        self._require(current_user, "masterdata:customer:view")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        customers, total = await self._repository.list_customers(
            q=q,
            country=country,
            credit_grade=credit_grade,
            owner_user_ids=owner_user_ids,
        )
        items = [
            await self._customer_response(
                customer,
                can_view_credit_limit=self._can_view_credit_limit(current_user),
            )
            for customer in customers
        ]
        return CustomerListResponse(items=items, total=total)

    async def list_transactions(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str,
    ) -> CustomerTransactionListResponse:
        await self._get_accessible_customer(current_user=current_user, customer_id=customer_id)
        rows = await self._repository.list_transactions(customer_id=customer_id)
        items = [
            CustomerTransactionResponse(
                source_type=row.source_type,
                source_code=row.source_code,
                occurred_at=row.occurred_at,
                amount=str(row.amount) if row.amount is not None else None,
                summary=row.summary,
            )
            for row in rows
        ]
        return CustomerTransactionListResponse(items=items, total=len(items))

    async def deactivate_customer(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str,
    ) -> CustomerResponse:
        self._require(current_user, "masterdata:customer:edit")
        await self._get_accessible_customer(current_user=current_user, customer_id=customer_id)
        async with UnitOfWork(self._repository.session):
            customer = await self._repository.set_customer_status(
                customer_id=customer_id,
                status="inactive",
            )
            if customer is None:
                raise CustomerNotFoundError
        return await self._customer_response(
            customer,
            can_view_credit_limit=self._can_view_credit_limit(current_user),
        )

    async def _get_accessible_customer(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str,
    ) -> CustomerRow:
        self._require(current_user, "masterdata:customer:view")
        customer = await self._repository.get_customer(customer_id)
        if customer is None:
            raise CustomerNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and customer.owner_user_id not in allowed_user_ids:
            raise CustomerNotFoundError
        return customer

    async def _upsert_credit_profile(
        self,
        customer_id: str,
        payload: CustomerCreditProfileInput,
    ) -> CustomerCreditProfileRow:
        return await self._repository.upsert_credit_profile(
            customer_id=customer_id,
            credit_grade=payload.credit_grade,
            credit_limit=payload.credit_limit,
            currency=payload.currency,
            payment_terms=payload.payment_terms,
            risk_note=payload.risk_note,
        )

    def _require_credit_edit_if_needed(
        self,
        current_user: CurrentUserResponse,
        credit_profile: CustomerCreditProfileInput | None,
    ) -> None:
        if credit_profile is not None:
            self._require(current_user, "masterdata:customer:credit:edit")

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _can_view_credit_limit(self, current_user: CurrentUserResponse) -> bool:
        return "masterdata:customer:credit:view" in current_user.permissions

    async def _customer_response(
        self,
        customer: CustomerRow,
        *,
        can_view_credit_limit: bool,
    ) -> CustomerResponse:
        contacts = await self._repository.list_contacts(customer.id)
        credit_profile = await self._repository.get_credit_profile(customer.id)
        contact_responses = [self._contact_response(contact) for contact in contacts]
        primary_contact = next(
            (contact for contact in contact_responses if contact.is_primary),
            None,
        )
        return CustomerResponse(
            id=customer.id,
            code=customer.code,
            cn_name=customer.cn_name,
            en_name=customer.en_name,
            country=customer.country,
            address=customer.address,
            website=customer.website,
            status=customer.status,
            owner_user_id=customer.owner_user_id,
            contacts=contact_responses,
            primary_contact=primary_contact,
            credit_profile=self._credit_profile_response(
                credit_profile,
                can_view_credit_limit=can_view_credit_limit,
            ),
        )

    def _contact_response(self, contact: CustomerContactRow) -> CustomerContactResponse:
        return CustomerContactResponse(
            id=contact.id,
            customer_id=contact.customer_id,
            name=contact.name,
            title=contact.title,
            email=contact.email,
            phone=contact.phone,
            is_primary=contact.is_primary,
        )

    def _credit_profile_response(
        self,
        profile: CustomerCreditProfileRow | None,
        *,
        can_view_credit_limit: bool,
    ) -> CustomerCreditProfileResponse | None:
        if profile is None:
            return None
        credit_limit = self._money(profile.credit_limit) if can_view_credit_limit else None
        return CustomerCreditProfileResponse(
            credit_grade=profile.credit_grade,
            credit_limit=credit_limit,
            currency=profile.currency,
            payment_terms=profile.payment_terms,
            risk_note=profile.risk_note,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"
