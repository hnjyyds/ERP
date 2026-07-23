from datetime import UTC, datetime, timedelta

from app.db.uow import UnitOfWork
from app.mcp.credentials import McpCredentialTokenService
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.mcp_settings.repositories import McpSettingsRepository, McpSettingsRow
from app.modules.system.mcp_settings.schemas import (
    McpCredentialResponse,
    McpResourceResponse,
    McpSettingsResponse,
    McpSettingsUpdate,
)

_RESOURCE_TOOLS = (
    McpResourceResponse(
        key="products",
        label="商品",
        tools=[
            "list_products",
            "get_product",
            "create_product",
            "update_product",
            "delete_product",
        ],
    ),
    McpResourceResponse(
        key="customers",
        label="客户",
        tools=[
            "list_customers",
            "get_customer",
            "create_customer",
            "update_customer",
            "delete_customer",
        ],
    ),
    McpResourceResponse(
        key="export_orders",
        label="出口订单",
        tools=[
            "list_export_orders",
            "get_export_order",
            "create_export_order",
            "update_export_order",
            "delete_export_order",
        ],
    ),
)


class McpSettingsPermissionDeniedError(Exception):
    pass


class McpDisabledError(Exception):
    pass


class McpSettingsService:
    def __init__(
        self,
        repository: McpSettingsRepository,
        credential_token_service: McpCredentialTokenService,
    ) -> None:
        self._repository = repository
        self._credential_token_service = credential_token_service

    async def get_settings(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> McpSettingsResponse:
        self._require_super_admin(current_user)
        return self._response(await self._repository.get())

    async def update_settings(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: McpSettingsUpdate,
    ) -> McpSettingsResponse:
        self._require_super_admin(current_user)
        async with UnitOfWork(self._repository.session):
            row = await self._repository.upsert(
                enabled=payload.enabled,
                updated_by=current_user.id,
            )
        return self._response(row)

    async def issue_credential(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> McpCredentialResponse:
        self._require_super_admin(current_user)
        async with UnitOfWork(self._repository.session):
            row = await self._repository.rotate_credential(updated_by=current_user.id)
            if row is None:
                raise McpDisabledError
        token, claims = self._credential_token_service.create(
            user_id=current_user.id,
            version=row.credential_version,
        )
        return McpCredentialResponse(
            access_token=token,
            token_type="Bearer",
            expires_at=datetime.fromtimestamp(claims.expires_at, UTC),
        )

    @staticmethod
    def _require_super_admin(current_user: CurrentUserResponse) -> None:
        if SUPER_ADMIN_PERMISSION not in current_user.permissions:
            raise McpSettingsPermissionDeniedError

    def _response(self, row: McpSettingsRow | None) -> McpSettingsResponse:
        credential_issued_at = self._utc(row.credential_issued_at) if row is not None else None
        credential_expires_at = (
            credential_issued_at
            + timedelta(seconds=self._credential_token_service.ttl_seconds)
            if credential_issued_at is not None
            else None
        )
        credential_available = bool(
            row is not None
            and row.enabled
            and credential_expires_at is not None
            and credential_expires_at > datetime.now(UTC)
        )
        return McpSettingsResponse(
            enabled=row.enabled if row is not None else False,
            server_name="Yuanjing Trade ERP",
            transport="streamable_http",
            endpoint_path="/mcp",
            token_parameter="Authorization",
            token_prefix_required=True,
            credential_available=credential_available,
            credential_issued_at=credential_issued_at,
            credential_expires_at=credential_expires_at if credential_available else None,
            tool_count=sum(len(resource.tools) for resource in _RESOURCE_TOOLS),
            resources=list(_RESOURCE_TOOLS),
            updated_by=row.updated_by if row is not None else None,
            updated_at=row.updated_at if row is not None else None,
        )

    @staticmethod
    def _utc(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
