from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import (
    AuthSessionResponse,
    CurrentUserSessionResponse,
    LoginRequest,
)
from app.modules.system.auth.services import AuthService, InvalidCredentialsError, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=ApiResponse[AuthSessionResponse])
async def login(
    payload: LoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthSessionResponse]:
    try:
        session = await service.login(username=payload.username, password=payload.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        ) from None
    return ApiResponse(data=session)


@router.get("/me", response_model=ApiResponse[CurrentUserSessionResponse])
async def get_me(
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[CurrentUserSessionResponse]:
    try:
        current = await service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已失效",
        ) from None
    return ApiResponse(data=current)
