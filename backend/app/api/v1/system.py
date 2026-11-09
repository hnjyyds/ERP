from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.auth_dependencies import CurrentUserDep, CurrentUserSessionDep
from app.api.permission_dependencies import require_permissions
from app.core.i18n_config import I18N_CONFIG
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
from app.modules.system.auth.schemas import MenuListResponse
from app.modules.system.mcp_settings.providers import get_mcp_settings_service
from app.modules.system.mcp_settings.schemas import (
    McpCredentialResponse,
    McpSettingsResponse,
    McpSettingsUpdate,
)
from app.modules.system.mcp_settings.services import (
    McpSettingsPermissionDeniedError,
    McpSettingsService,
)
from app.schemas.i18n import I18nConfigResponse
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/system", tags=["system"])

_MCP_ADMIN = Depends(
    require_permissions(
        SUPER_ADMIN_PERMISSION,
        error=McpSettingsPermissionDeniedError,
    )
)


@router.get("/i18n", response_model=ApiResponse[I18nConfigResponse])
async def get_i18n_config() -> ApiResponse[I18nConfigResponse]:
    return ApiResponse(data=I18nConfigResponse.model_validate(I18N_CONFIG))


@router.get("/menus", response_model=ApiResponse[MenuListResponse])
async def list_current_user_menus(
    session: CurrentUserSessionDep,
) -> ApiResponse[MenuListResponse]:
    return ApiResponse(data=MenuListResponse(menus=session.menus))


@router.get(
    "/mcp",
    response_model=ApiResponse[McpSettingsResponse],
    dependencies=[_MCP_ADMIN],
)
async def get_mcp_settings(
    current_user: CurrentUserDep,
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpSettingsResponse]:
    return ApiResponse(data=await service.get_settings(current_user=current_user))


@router.patch(
    "/mcp",
    response_model=ApiResponse[McpSettingsResponse],
    dependencies=[_MCP_ADMIN],
)
async def update_mcp_settings(
    payload: McpSettingsUpdate,
    current_user: CurrentUserDep,
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpSettingsResponse]:
    updated = await service.update_settings(current_user=current_user, payload=payload)
    return ApiResponse(data=updated)


@router.post(
    "/mcp/credentials",
    response_model=ApiResponse[McpCredentialResponse],
    dependencies=[_MCP_ADMIN],
)
async def issue_mcp_credential(
    current_user: CurrentUserDep,
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpCredentialResponse]:
    credential = await service.issue_credential(current_user=current_user)
    return ApiResponse(data=credential)
