from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.core.i18n_config import I18N_CONFIG
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse, MenuListResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
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


async def _current_user(token: str, service: AuthService) -> CurrentUserResponse:
    try:
        return (await service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已失效",
        ) from None


@router.get("/i18n", response_model=ApiResponse[I18nConfigResponse])
async def get_i18n_config() -> ApiResponse[I18nConfigResponse]:
    return ApiResponse(data=I18nConfigResponse.model_validate(I18N_CONFIG))


@router.get("/menus", response_model=ApiResponse[MenuListResponse])
async def list_current_user_menus(
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[MenuListResponse]:
    try:
        menus = await service.get_menus(token)
        return ApiResponse(data=menus)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


@router.get("/mcp", response_model=ApiResponse[McpSettingsResponse])
async def get_mcp_settings(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpSettingsResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        return ApiResponse(data=await service.get_settings(current_user=current_user))
    except McpSettingsPermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="缺少系统管理权限",
        ) from None


@router.patch("/mcp", response_model=ApiResponse[McpSettingsResponse])
async def update_mcp_settings(
    payload: McpSettingsUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpSettingsResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        updated = await service.update_settings(current_user=current_user, payload=payload)
        return ApiResponse(data=updated)
    except McpSettingsPermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="缺少系统管理权限",
        ) from None


@router.post("/mcp/credentials", response_model=ApiResponse[McpCredentialResponse])
async def issue_mcp_credential(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[McpSettingsService, Depends(get_mcp_settings_service)],
) -> ApiResponse[McpCredentialResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        credential = await service.issue_credential(current_user=current_user)
        return ApiResponse(data=credential)
    except McpSettingsPermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="缺少系统管理权限",
        ) from None
    except McpDisabledError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="请先启用 MCP 服务",
        ) from None
