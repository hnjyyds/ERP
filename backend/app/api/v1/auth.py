from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.auth_dependencies import CurrentUserDep, CurrentUserSessionDep
from app.api.http_exceptions import raise_unauthorized, raise_unprocessable
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import (
    AssignableUserListResponse,
    AuthSessionResponse,
    CurrentUserAvatarUpdate,
    CurrentUserSessionResponse,
    LoginRequest,
)
from app.modules.system.auth.services import (
    AuthService,
    InvalidAvatarError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=ApiResponse[AuthSessionResponse])
async def login(
    payload: LoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthSessionResponse]:
    try:
        session = await service.login(username=payload.username, password=payload.password)
        return ApiResponse(data=session)
    except InvalidCredentialsError:
        raise_unauthorized("用户名或密码错误")


@router.get("/me", response_model=ApiResponse[CurrentUserSessionResponse])
async def get_me(
    session: CurrentUserSessionDep,
) -> ApiResponse[CurrentUserSessionResponse]:
    return ApiResponse(data=session)


@router.patch("/me/avatar", response_model=ApiResponse[CurrentUserSessionResponse])
async def update_me_avatar(
    payload: CurrentUserAvatarUpdate,
    current_user: CurrentUserDep,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[CurrentUserSessionResponse]:
    try:
        current = await service.update_current_user_avatar(
            user_id=current_user.id,
            payload=payload,
        )
        return ApiResponse(data=current)
    except InvalidTokenError:
        raise_unauthorized()
    except InvalidAvatarError:
        raise_unprocessable("头像配置无效")


@router.get("/users", response_model=ApiResponse[AssignableUserListResponse])
async def list_assignable_users(
    _current_user: CurrentUserDep,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AssignableUserListResponse]:
    users = await service.list_assignable_users()
    return ApiResponse(data=users)
