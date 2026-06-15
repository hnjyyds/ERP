from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.organization_services import (
    OrganizationPermissionDeniedError,
    OrganizationReferenceNotFoundError,
    OrganizationSelfDeactivateError,
    OrganizationSelfDemoteError,
    OrganizationService,
    OrganizationUsernameTakenError,
    OrganizationUserNotFoundError,
)
from app.modules.system.auth.providers import get_auth_service, get_organization_service
from app.modules.system.auth.schemas import (
    CurrentUserResponse,
    OrganizationOptionsResponse,
    OrganizationPasswordResetResponse,
    OrganizationRolePermissionUpdate,
    OrganizationRoleResponse,
    OrganizationUserCreate,
    OrganizationUserCreateResponse,
    OrganizationUserListResponse,
    OrganizationUserResponse,
    OrganizationUserUpdate,
)
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/organization", tags=["organization"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已失效",
        ) from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少组织管理权限")


def _raise_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")


@router.get("/options", response_model=ApiResponse[OrganizationOptionsResponse])
async def get_organization_options(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationOptionsResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        options = await service.list_options(current_user=current_user)
        return ApiResponse(data=options)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()


@router.get("/users", response_model=ApiResponse[OrganizationUserListResponse])
async def list_organization_users(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserListResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        users = await service.list_users(current_user=current_user)
        return ApiResponse(data=users)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()


@router.post(
    "/users",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationUserCreateResponse],
)
async def create_organization_user(
    payload: OrganizationUserCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserCreateResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        created = await service.create_user(current_user=current_user, payload=payload)
        return ApiResponse(data=created)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationUsernameTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在") from None
    except OrganizationReferenceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="部门或角色不存在",
        ) from None


@router.patch("/users/{user_id}", response_model=ApiResponse[OrganizationUserResponse])
async def update_organization_user(
    user_id: str,
    payload: OrganizationUserUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        updated = await service.update_user(
            current_user=current_user,
            user_id=user_id,
            payload=payload,
        )
        return ApiResponse(data=updated)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationUserNotFoundError:
        _raise_not_found()
    except OrganizationSelfDeactivateError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="不能停用当前登录账号",
        ) from None
    except OrganizationReferenceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="部门或角色不存在",
        ) from None


@router.delete("/users/{user_id}", response_model=ApiResponse[OrganizationUserResponse])
async def delete_organization_user(
    user_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        user = await service.deactivate_user(current_user=current_user, user_id=user_id)
        return ApiResponse(data=user)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationUserNotFoundError:
        _raise_not_found()
    except OrganizationSelfDeactivateError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="不能删除当前登录账号",
        ) from None


@router.post(
    "/users/{user_id}/reset-password",
    response_model=ApiResponse[OrganizationPasswordResetResponse],
)
async def reset_organization_user_password(
    user_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationPasswordResetResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        reset = await service.reset_password(current_user=current_user, user_id=user_id)
        return ApiResponse(data=reset)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationUserNotFoundError:
        _raise_not_found()


@router.patch(
    "/roles/{role_id}/permissions",
    response_model=ApiResponse[OrganizationRoleResponse],
)
async def update_organization_role_permissions(
    role_id: str,
    payload: OrganizationRolePermissionUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        role = await service.update_role_permissions(
            current_user=current_user,
            role_id=role_id,
            payload=payload,
        )
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationReferenceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="角色或权限不存在",
        ) from None
    except OrganizationSelfDemoteError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="不能移除当前超级管理员角色的超级管理员权限",
        ) from None
