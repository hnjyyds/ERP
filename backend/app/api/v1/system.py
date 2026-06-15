from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.core.i18n_config import I18N_CONFIG
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import MenuListResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.i18n import I18nConfigResponse
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/system", tags=["system"])


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
