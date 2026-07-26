from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.auth_dependencies import CurrentUserDep, CurrentUserSessionDep
from app.api.http_exceptions import raise_conflict, raise_permission_denied
from app.core.i18n_config import I18N_CONFIG
from app.modules.system.auth.schemas import MenuListResponse
from app.modules.system.mcp_settings.providers import get_mcp_settings_service
from app.modules.system.mcp_settings.schemas import (
    McpCredentialResponse,
    McpSettingsResponse,
    McpSettingsUpdate,
)
from app.modules.system.mcp_settings.services import (
    McpDisabledError,
    McpSettingsPermissionDeniedError,
    McpSettingsService,
)
from app.schemas.i18n import I18nConfigResponse
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/i18n", response_model=ApiResponse[I18nConfigResponse])
async def get_i18n_config() -> ApiResponse[I18nConfigResponse]:
    return ApiResponse(data=I18nConfigResponse.model_validate(I18N_CONFIG))


@router.get("/menus", response_model=ApiResponse[MenuListResponse])
async def list_current_user_menus(
    session: CurrentUserSessionDep,
) -> ApiResponse[MenuListResponse]:
    return ApiResponse(data=MenuListResponse(menus=session.menus))


@router.get("/mcp", response_model=ApiResponse[McpSettingsResponse])
async def get_mcp_settings(
    current_user: CurrentUserDep,
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpSettingsResponse]:
    try:
        return ApiResponse(data=await service.get_settings(current_user=current_user))
    except McpSettingsPermissionDeniedError:
        raise_permission_denied("缺少系统管理权限")


@router.patch("/mcp", response_model=ApiResponse[McpSettingsResponse])
async def update_mcp_settings(
    payload: McpSettingsUpdate,
    current_user: CurrentUserDep,
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpSettingsResponse]:
    try:
        updated = await service.update_settings(current_user=current_user, payload=payload)
        return ApiResponse(data=updated)
    except McpSettingsPermissionDeniedError:
        raise_permission_denied("缺少系统管理权限")


@router.post("/mcp/credentials", response_model=ApiResponse[McpCredentialResponse])
async def issue_mcp_credential(
    current_user: CurrentUserDep,
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpCredentialResponse]:
    try:
        credential = await service.issue_credential(current_user=current_user)
        return ApiResponse(data=credential)
    except McpSettingsPermissionDeniedError:
        raise_permission_denied("缺少系统管理权限")
    except McpDisabledError:
        raise_conflict("请先启用 MCP 服务")
