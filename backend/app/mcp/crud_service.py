from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.customers.repositories import CustomerRepository
from app.modules.masterdata.customers.schemas import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.modules.masterdata.customers.services import CustomerService
from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.masterdata.products.schemas import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)
from app.modules.masterdata.products.services import ProductService
from app.modules.sales.contracts.references import ExportContractReferenceRepository
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.contracts.schemas import (
    ExportContractCreate,
    ExportContractListResponse,
    ExportContractResponse,
)
from app.modules.sales.contracts.services import ExportContractService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, TokenService


class ConfirmationRequiredError(Exception):
    """Raised when an MCP delete call omits explicit confirmation."""


class ErpMcpCrudService:
    """Authenticated MCP application facade over existing ERP domain services."""

    def __init__(
        self,
        *,
        session_factory: async_sessionmaker[AsyncSession],
        token_service: TokenService,
    ) -> None:
        self._session_factory = session_factory
        self._token_service = token_service

    async def list_products(
        self,
        *,
        user_id: str,
        q: str | None,
        limit: int,
        offset: int,
    ) -> ProductListResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await ProductService(ProductRepository(session)).list_products(
                current_user=current_user,
                q=q,
                limit=limit,
                offset=offset,
            )

    async def get_product(self, *, user_id: str, product_id: str) -> ProductResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await ProductService(ProductRepository(session)).get_product(
                current_user=current_user,
                product_id=product_id,
            )

    async def create_product(
        self,
        *,
        user_id: str,
        payload: ProductCreate,
    ) -> ProductResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await ProductService(ProductRepository(session)).create_product(
                current_user=current_user,
                payload=payload,
            )

    async def update_product(
        self,
        *,
        user_id: str,
        product_id: str,
        payload: ProductUpdate,
    ) -> ProductResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await ProductService(ProductRepository(session)).update_product(
                current_user=current_user,
                product_id=product_id,
                payload=payload,
            )

    async def delete_product(
        self,
        *,
        user_id: str,
        product_id: str,
        confirm: bool,
    ) -> ProductResponse:
        self._require_confirmation(confirm)
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await ProductService(ProductRepository(session)).deactivate_product(
                current_user=current_user,
                product_id=product_id,
            )

    async def list_customers(
        self,
        *,
        user_id: str,
        q: str | None,
        country: str | None,
        credit_grade: str | None,
        limit: int,
        offset: int,
    ) -> CustomerListResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._customer_service(session).list_customers(
                current_user=current_user,
                q=q,
                country=country,
                credit_grade=credit_grade,
                limit=limit,
                offset=offset,
            )

    async def get_customer(self, *, user_id: str, customer_id: str) -> CustomerResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._customer_service(session).get_customer(
                current_user=current_user,
                customer_id=customer_id,
            )

    async def create_customer(
        self,
        *,
        user_id: str,
        payload: CustomerCreate,
    ) -> CustomerResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._customer_service(session).create_customer(
                current_user=current_user,
                payload=payload,
            )

    async def update_customer(
        self,
        *,
        user_id: str,
        customer_id: str,
        payload: CustomerUpdate,
    ) -> CustomerResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._customer_service(session).update_customer(
                current_user=current_user,
                customer_id=customer_id,
                payload=payload,
            )

    async def delete_customer(
        self,
        *,
        user_id: str,
        customer_id: str,
        confirm: bool,
    ) -> CustomerResponse:
        self._require_confirmation(confirm)
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._customer_service(session).deactivate_customer(
                current_user=current_user,
                customer_id=customer_id,
            )

    async def list_export_orders(
        self,
        *,
        user_id: str,
        q: str | None,
        approval_status: str | None,
        customer_id: str | None,
        limit: int,
        offset: int,
    ) -> ExportContractListResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._export_order_service(session).list_contracts(
                current_user=current_user,
                q=q,
                approval_status=approval_status,
                customer_id=customer_id,
                limit=limit,
                offset=offset,
            )

    async def get_export_order(
        self,
        *,
        user_id: str,
        order_id: str,
    ) -> ExportContractResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._export_order_service(session).get_contract(
                current_user=current_user,
                contract_id=order_id,
            )

    async def create_export_order(
        self,
        *,
        user_id: str,
        payload: ExportContractCreate,
    ) -> ExportContractResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._export_order_service(session).create_contract(
                current_user=current_user,
                payload=payload,
            )

    async def update_export_order(
        self,
        *,
        user_id: str,
        order_id: str,
        payload: ExportContractCreate,
    ) -> ExportContractResponse:
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._export_order_service(session).update_contract(
                current_user=current_user,
                contract_id=order_id,
                payload=payload,
            )

    async def delete_export_order(
        self,
        *,
        user_id: str,
        order_id: str,
        confirm: bool,
    ) -> ExportContractResponse:
        self._require_confirmation(confirm)
        async with self._session_factory() as session:
            current_user = await self._current_user(session, user_id)
            return await self._export_order_service(session).delete_contract(
                current_user=current_user,
                contract_id=order_id,
            )

    async def _current_user(
        self,
        session: AsyncSession,
        user_id: str,
    ) -> CurrentUserResponse:
        auth = AuthService(AuthRepository(session), self._token_service)
        return await auth.get_current_user_by_id(user_id)

    @staticmethod
    def _require_confirmation(confirm: bool) -> None:
        if not confirm:
            raise ConfirmationRequiredError("删除操作必须显式传入 confirm=true")

    @staticmethod
    def _customer_service(session: AsyncSession) -> CustomerService:
        auth_repository = AuthRepository(session)
        return CustomerService(
            CustomerRepository(session),
            data_scope_resolver=DataScopeResolver(auth_repository),
        )

    @staticmethod
    def _export_order_service(session: AsyncSession) -> ExportContractService:
        auth_repository = AuthRepository(session)
        return ExportContractService(
            ExportContractRepository(session),
            data_scope_resolver=DataScopeResolver(auth_repository),
            reference_repository=ExportContractReferenceRepository(session),
        )
