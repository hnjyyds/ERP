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
from app.core.messages import localize_message
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

PageLimit = Annotated[
    int,
    Field(
        ge=1,
        le=200,
        description="Maximum number of records per page, from 1 to 200.",
        examples=[50],
    ),
]
PageOffset = Annotated[
    int,
    Field(
        ge=0,
        description="Pagination offset; start with 0 and add limit for the next page.",
        examples=[0],
    ),
]
ProductSearchQuery = Annotated[
    str | None,
    Field(
        description=(
            "Product search term; matches product code, Chinese name, English name, "
            "and customs code."
        ),
        examples=["BAG-40"],
    ),
]
CustomerSearchQuery = Annotated[
    str | None,
    Field(
        description="Customer search term; matches customer code, Chinese name, and English name.",
        examples=["Example Handel"],
    ),
]
ExportOrderSearchQuery = Annotated[
    str | None,
    Field(
        description="Export order search term; matches order number or customer name.",
        examples=["EC-2026-001"],
    ),
]
ProductId = Annotated[
    str,
    Field(
        description="ERP product ID; obtain it from list_products or create_product first.",
        examples=["product-001"],
    ),
]
CustomerId = Annotated[
    str,
    Field(
        description="ERP customer ID; obtain it from list_customers or create_customer first.",
        examples=["customer-001"],
    ),
]
OptionalCustomerId = Annotated[
    str | None,
    Field(
        description=(
            "Filter by ERP customer ID; omit it to include all customers visible "
            "to the current account."
        ),
        examples=["customer-001"],
    ),
]
ExportOrderId = Annotated[
    str,
    Field(
        description="ERP export order ID; obtain it from list_export_orders first.",
        examples=["export-contract-001"],
    ),
]
DeleteConfirmation = Annotated[
    bool,
    Field(
        description=(
            "Deletion confirmation flag. Dangerous operations require an explicit "
            "true value, otherwise they are not executed."
        ),
        examples=[True],
    ),
]
CustomerCountryFilter = Annotated[
    str | None,
    Field(
        description=(
            "Filter by the customer's country or region; the value must match "
            "the customer record's country field."
        ),
        examples=["DE"],
    ),
]
CustomerCreditGradeFilter = Annotated[
    str | None,
    Field(
        description="Filter by the customer's internal credit grade.",
        examples=["A"],
    ),
]
ApprovalStatusFilter = Annotated[
    str | None,
    Field(
        description=(
            "Filter by export order approval status; common values are draft, "
            "submitted, approved, and rejected."
        ),
        examples=["draft"],
    ),
]
ProductCreatePayload = Annotated[
    ProductCreate,
    Field(description="Complete product data to create."),
]
ProductUpdatePayload = Annotated[
    ProductUpdate,
    Field(
        description=(
            "Complete product data after the update; accessories not provided "
            "are unchanged by this tool."
        )
    ),
]
CustomerCreatePayload = Annotated[
    CustomerCreate,
    Field(
        description=(
            "Complete customer data to create, optionally including contacts "
            "and credit information."
        )
    ),
]
CustomerUpdatePayload = Annotated[
    CustomerUpdate,
    Field(description="Updated customer profile and credit information."),
]
ExportOrderPayload = Annotated[
    ExportContractCreate,
    Field(
        description=(
            "Complete export order draft to create or update, "
            "with at least one product line item."
        )
    ),
]


async def _execute[T](operation: Awaitable[T]) -> T:
    try:
        return await operation
    except InvalidTokenError as exc:
        raise ToolError("[AUTHENTICATION_FAILED] access_token is invalid or expired") from exc
    except (
        ProductPermissionDeniedError,
        CustomerPermissionDeniedError,
        ExportOrderPermissionDeniedError,
    ) as exc:
        raise ToolError(
            "[PERMISSION_DENIED] The current account does not have permission "
            "to perform this operation"
        ) from exc
    except (ProductNotFoundError, CustomerNotFoundError, ExportContractNotFoundError) as exc:
        raise ToolError(
            "[NOT_FOUND] The requested record does not exist or is not visible "
            "to the current account"
        ) from exc
    except ConfirmationRequiredError as exc:
        raise ToolError(f"[CONFIRMATION_REQUIRED] {exc}") from exc
    except IntegrityError as exc:
        raise ToolError(
            "[CONFLICT] Duplicate code, or the record is still referenced by "
            "other business documents"
        ) from exc
    except ValueError as exc:
        raise ToolError(f"[INVALID_OPERATION] {localize_message(str(exc), 'en-US')}") from exc


def _authenticated_user_id() -> str:
    credential = get_access_token()
    if credential is None or credential.subject is None:
        raise ToolError("[AUTHENTICATION_FAILED] Missing a valid MCP Bearer token")
    return credential.subject


def create_mcp_server(service: ErpMcpCrudService) -> FastMCP:
    server = FastMCP(
        "Xinpei Trade ERP",
        instructions=(
            "Query and maintain products, customers, and export orders in the "
            "Xinpei Trade ERP. Pass the dedicated MCP token via Authorization "
            "Bearer when connecting; delete tools require an explicit confirm=true."
        ),
        streamable_http_path="/mcp",
        stateless_http=True,
        json_response=True,
    )

    @server.tool()
    async def list_products(
        q: ProductSearchQuery = None,
        limit: PageLimit = 50,
        offset: PageOffset = 0,
    ) -> ProductListResponse:
        """List products with pagination; q matches code, names, and customs code."""
        return await _execute(
            service.list_products(
                user_id=_authenticated_user_id(),
                q=q,
                limit=limit,
                offset=offset,
            )
        )

    @server.tool()
    async def get_product(product_id: ProductId) -> ProductResponse:
        """Get product details by ERP product ID."""
        return await _execute(
            service.get_product(user_id=_authenticated_user_id(), product_id=product_id)
        )

    @server.tool()
    async def create_product(
        payload: ProductCreatePayload,
    ) -> ProductResponse:
        """Create a product; payload uses ERP product fields."""
        return await _execute(
            service.create_product(user_id=_authenticated_user_id(), payload=payload)
        )

    @server.tool()
    async def update_product(
        product_id: ProductId,
        payload: ProductUpdatePayload,
    ) -> ProductResponse:
        """Update a product by product ID."""
        return await _execute(
            service.update_product(
                user_id=_authenticated_user_id(),
                product_id=product_id,
                payload=payload,
            )
        )

    @server.tool()
    async def delete_product(
        product_id: ProductId,
        confirm: DeleteConfirmation = False,
    ) -> ProductResponse:
        """Deactivate a product (soft delete); an explicit confirm=true is required."""
        return await _execute(
            service.delete_product(
                user_id=_authenticated_user_id(),
                product_id=product_id,
                confirm=confirm,
            )
        )

    @server.tool()
    async def list_customers(
        q: CustomerSearchQuery = None,
        country: CustomerCountryFilter = None,
        credit_grade: CustomerCreditGradeFilter = None,
        limit: PageLimit = 50,
        offset: PageOffset = 0,
    ) -> CustomerListResponse:
        """List customers with pagination, scoped by the current account's data permissions."""
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
    async def get_customer(customer_id: CustomerId) -> CustomerResponse:
        """Get customer details by ERP customer ID."""
        return await _execute(
            service.get_customer(user_id=_authenticated_user_id(), customer_id=customer_id)
        )

    @server.tool()
    async def create_customer(
        payload: CustomerCreatePayload,
    ) -> CustomerResponse:
        """Create a customer, optionally with contacts and credit information."""
        return await _execute(
            service.create_customer(user_id=_authenticated_user_id(), payload=payload)
        )

    @server.tool()
    async def update_customer(
        customer_id: CustomerId,
        payload: CustomerUpdatePayload,
    ) -> CustomerResponse:
        """Update a customer by customer ID."""
        return await _execute(
            service.update_customer(
                user_id=_authenticated_user_id(),
                customer_id=customer_id,
                payload=payload,
            )
        )

    @server.tool()
    async def delete_customer(
        customer_id: CustomerId,
        confirm: DeleteConfirmation = False,
    ) -> CustomerResponse:
        """Deactivate a customer (soft delete); an explicit confirm=true is required."""
        return await _execute(
            service.delete_customer(
                user_id=_authenticated_user_id(),
                customer_id=customer_id,
                confirm=confirm,
            )
        )

    @server.tool()
    async def list_export_orders(
        q: ExportOrderSearchQuery = None,
        approval_status: ApprovalStatusFilter = None,
        customer_id: OptionalCustomerId = None,
        limit: PageLimit = 50,
        offset: PageOffset = 0,
    ) -> ExportContractListResponse:
        """List export orders (ERP export contracts) with pagination and data permissions."""
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
        order_id: ExportOrderId,
    ) -> ExportContractResponse:
        """Get an export order and its line items by ERP export order ID."""
        return await _execute(
            service.get_export_order(user_id=_authenticated_user_id(), order_id=order_id)
        )

    @server.tool()
    async def create_export_order(
        payload: ExportOrderPayload,
    ) -> ExportContractResponse:
        """Create a draft export order with at least one product line item."""
        return await _execute(
            service.create_export_order(user_id=_authenticated_user_id(), payload=payload)
        )

    @server.tool()
    async def update_export_order(
        order_id: ExportOrderId,
        payload: ExportOrderPayload,
    ) -> ExportContractResponse:
        """Update a draft export order; submitted or approved orders cannot be edited."""
        return await _execute(
            service.update_export_order(
                user_id=_authenticated_user_id(),
                order_id=order_id,
                payload=payload,
            )
        )

    @server.tool()
    async def delete_export_order(
        order_id: ExportOrderId,
        confirm: DeleteConfirmation = False,
    ) -> ExportContractResponse:
        """Delete a draft export order; confirm=true is required and non-drafts are rejected."""
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
