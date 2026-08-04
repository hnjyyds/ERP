from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.auth_dependencies import CurrentUserDep, CurrentUserSessionDep
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
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=ApiResponse[AuthSessionResponse])
async def login(
    payload: LoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthSessionResponse]:
    session = await service.login(username=payload.username, password=payload.password)
    return ApiResponse(data=session)


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
    current = await service.update_current_user_avatar(
        user_id=current_user.id,
        payload=payload,
    )
    return ApiResponse(data=current)


@router.get("/users", response_model=ApiResponse[AssignableUserListResponse])
async def list_assignable_users(
    _current_user: CurrentUserDep,
    service: Annotated[AuthService, Depends(get_auth_service)],
    required_permission: Annotated[
        str | None,
        Query(max_length=160, description="只返回拥有该权限的在职员工。"),
    ] = None,
) -> ApiResponse[AssignableUserListResponse]:
    users = await service.list_assignable_users(required_permission)
    return ApiResponse(data=users)
