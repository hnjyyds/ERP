from collections.abc import Awaitable
from typing import Annotated

from mcp.server.auth.middleware.auth_context import AuthContextMiddleware, get_access_token
from mcp.server.auth.middleware.bearer_auth import BearerAuthBackend, RequireAuthMiddleware
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError
from pydantic import Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.types import ASGIApp

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.mcp.credentials import MCP_SCOPE, McpCredentialTokenService, McpCredentialVerifier
from app.mcp.crud_service import ConfirmationRequiredError, ErpMcpCrudService
from app.modules.masterdata.customers.schemas import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.modules.masterdata.customers.services import (
    CustomerNotFoundError,
)
from app.modules.masterdata.customers.services import (
    PermissionDeniedError as CustomerPermissionDeniedError,
)
from app.modules.masterdata.products.schemas import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)
from app.modules.masterdata.products.services import (
    PermissionDeniedError as ProductPermissionDeniedError,
)
from app.modules.masterdata.products.services import (
    ProductNotFoundError,
)
from app.modules.sales.contracts.schemas import (
    ExportContractCreate,
    ExportContractListResponse,
    ExportContractResponse,
)
from app.modules.sales.contracts.services import (
    ExportContractNotFoundError,
)
from app.modules.sales.contracts.services import (
    PermissionDeniedError as ExportOrderPermissionDeniedError,
)
from app.modules.system.auth.services import InvalidTokenError, TokenService

PageLimit = Annotated[int, Field(ge=1, le=200)]
PageOffset = Annotated[int, Field(ge=0)]


async def _execute[T](operation: Awaitable[T]) -> T:
    try:
        return await operation
    except InvalidTokenError as exc:
        raise ToolError("[AUTHENTICATION_FAILED] access_token 无效或已过期") from exc
    except (
        ProductPermissionDeniedError,
        CustomerPermissionDeniedError,
        ExportOrderPermissionDeniedError,
    ) as exc:
        raise ToolError("[PERMISSION_DENIED] 当前账号没有执行该操作的权限") from exc
    except (ProductNotFoundError, CustomerNotFoundError, ExportContractNotFoundError) as exc:
        raise ToolError("[NOT_FOUND] 指定的数据不存在或当前账号不可见") from exc
    except ConfirmationRequiredError as exc:
        raise ToolError(f"[CONFIRMATION_REQUIRED] {exc}") from exc
    except IntegrityError as exc:
        raise ToolError("[CONFLICT] 编码重复或数据仍被其他业务单据引用") from exc
    except ValueError as exc:
        raise ToolError(f"[INVALID_OPERATION] {exc}") from exc


def _authenticated_user_id() -> str:
    credential = get_access_token()
    if credential is None or credential.subject is None:
        raise ToolError("[AUTHENTICATION_FAILED] 缺少有效的 MCP Bearer 令牌")
    return credential.subject


def create_mcp_server(service: ErpMcpCrudService) -> FastMCP:
    server = FastMCP(
        "Yuanjing Trade ERP",
        instructions=(
            "用于查询和维护远景外贸 ERP 的商品、客户和出口订单。"
            "连接时必须通过 Authorization Bearer 传入 MCP 专用令牌；"
            "删除工具必须显式传 confirm=true。"
        ),
        streamable_http_path="/mcp",
        stateless_http=True,
        json_response=True,
    )

    @server.tool()
    async def list_products(
        q: str | None = None,
        limit: PageLimit = 50,
        offset: PageOffset = 0,
    ) -> ProductListResponse:
        """分页查询商品；q 可匹配商品编码、中英文名和海关编码。"""
        return await _execute(
            service.list_products(
                user_id=_authenticated_user_id(),
                q=q,
                limit=limit,
                offset=offset,
            )
        )

    @server.tool()
    async def get_product(product_id: str) -> ProductResponse:
        """按 ERP 商品 ID 查询商品详情。"""
        return await _execute(
            service.get_product(user_id=_authenticated_user_id(), product_id=product_id)
        )

    @server.tool()
    async def create_product(
        payload: ProductCreate,
    ) -> ProductResponse:
        """创建一个商品；payload 使用 ERP 商品字段。"""
        return await _execute(
            service.create_product(user_id=_authenticated_user_id(), payload=payload)
        )

    @server.tool()
    async def update_product(
        product_id: str,
        payload: ProductUpdate,
    ) -> ProductResponse:
        """按商品 ID 更新商品。"""
        return await _execute(
            service.update_product(
                user_id=_authenticated_user_id(),
                product_id=product_id,
                payload=payload,
            )
        )

    @server.tool()
    async def delete_product(
        product_id: str,
        confirm: bool = False,
    ) -> ProductResponse:
        """停用商品（软删除）；必须显式传 confirm=true。"""
        return await _execute(
            service.delete_product(
                user_id=_authenticated_user_id(),
                product_id=product_id,
                confirm=confirm,
            )
        )

    @server.tool()
    async def list_customers(
        q: str | None = None,
        country: str | None = None,
        credit_grade: str | None = None,
        limit: PageLimit = 50,
        offset: PageOffset = 0,
    ) -> CustomerListResponse:
        """分页查询客户，自动应用当前账号的数据权限。"""
        return await _execute(
            service.list_customers(
                user_id=_authenticated_user_id(),
                q=q,
                country=country,
                credit_grade=credit_grade,
                limit=limit,
                offset=offset,
            )
        )

    @server.tool()
    async def get_customer(customer_id: str) -> CustomerResponse:
        """按 ERP 客户 ID 查询客户详情。"""
        return await _execute(
            service.get_customer(user_id=_authenticated_user_id(), customer_id=customer_id)
        )

    @server.tool()
    async def create_customer(
        payload: CustomerCreate,
    ) -> CustomerResponse:
        """创建客户，可同时写入联系人和信用资料。"""
        return await _execute(
            service.create_customer(user_id=_authenticated_user_id(), payload=payload)
        )

    @server.tool()
    async def update_customer(
        customer_id: str,
        payload: CustomerUpdate,
    ) -> CustomerResponse:
        """按客户 ID 更新客户。"""
        return await _execute(
            service.update_customer(
                user_id=_authenticated_user_id(),
                customer_id=customer_id,
                payload=payload,
            )
        )

    @server.tool()
    async def delete_customer(
        customer_id: str,
        confirm: bool = False,
    ) -> CustomerResponse:
        """停用客户（软删除）；必须显式传 confirm=true。"""
        return await _execute(
            service.delete_customer(
                user_id=_authenticated_user_id(),
                customer_id=customer_id,
                confirm=confirm,
            )
        )

    @server.tool()
    async def list_export_orders(
        q: str | None = None,
        approval_status: str | None = None,
        customer_id: str | None = None,
        limit: PageLimit = 50,
        offset: PageOffset = 0,
    ) -> ExportContractListResponse:
        """分页查询出口订单（ERP 出口合同），自动应用当前账号的数据权限。"""
        return await _execute(
            service.list_export_orders(
                user_id=_authenticated_user_id(),
                q=q,
                approval_status=approval_status,
                customer_id=customer_id,
                limit=limit,
                offset=offset,
            )
        )

    @server.tool()
    async def get_export_order(
        order_id: str,
    ) -> ExportContractResponse:
        """按 ERP 出口订单 ID 查询订单及明细。"""
        return await _execute(
            service.get_export_order(user_id=_authenticated_user_id(), order_id=order_id)
        )

    @server.tool()
    async def create_export_order(
        payload: ExportContractCreate,
    ) -> ExportContractResponse:
        """创建草稿出口订单，至少需要一条商品明细。"""
        return await _execute(
            service.create_export_order(user_id=_authenticated_user_id(), payload=payload)
        )

    @server.tool()
    async def update_export_order(
        order_id: str,
        payload: ExportContractCreate,
    ) -> ExportContractResponse:
        """更新草稿出口订单；已提交或已审批订单不可编辑。"""
        return await _execute(
            service.update_export_order(
                user_id=_authenticated_user_id(),
                order_id=order_id,
                payload=payload,
            )
        )

    @server.tool()
    async def delete_export_order(
        order_id: str,
        confirm: bool = False,
    ) -> ExportContractResponse:
        """删除草稿出口订单；必须显式传 confirm=true，非草稿不可删除。"""
        return await _execute(
            service.delete_export_order(
                user_id=_authenticated_user_id(),
                order_id=order_id,
                confirm=confirm,
            )
        )

    return server


settings = get_settings()
crud_service = ErpMcpCrudService(
    session_factory=SessionLocal,
    token_service=TokenService(secret_key=settings.auth_secret_key),
)
mcp = create_mcp_server(crud_service)
mcp_http_app = mcp.streamable_http_app()


def create_authenticated_mcp_app(
    session_factory: async_sessionmaker[AsyncSession],
) -> ASGIApp:
    token_service = McpCredentialTokenService(
        secret_key=settings.auth_secret_key,
        ttl_seconds=settings.mcp_credential_ttl_seconds,
    )
    verifier = McpCredentialVerifier(
        session_factory=session_factory,
        token_service=token_service,
    )
    protected_app = RequireAuthMiddleware(mcp_http_app, required_scopes=[MCP_SCOPE])
    auth_context_app = AuthContextMiddleware(protected_app)
    return AuthenticationMiddleware(
        auth_context_app,
        backend=BearerAuthBackend(verifier),
    )
