from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.organization_services import (
    OrganizationDepartmentInUseError,
    OrganizationDepartmentNameTakenError,
    OrganizationDepartmentNotFoundError,
    OrganizationDepartmentRequiredError,
    OrganizationInvalidAvatarError,
    OrganizationPermissionDeniedError,
    OrganizationReferenceNotFoundError,
    OrganizationRoleCodeTakenError,
    OrganizationRoleInUseError,
    OrganizationRoleNotFoundError,
    OrganizationSelfDeactivateError,
    OrganizationSelfDemoteError,
    OrganizationService,
    OrganizationUsernameTakenError,
    OrganizationUserNotFoundError,
)
from app.modules.system.auth.providers import get_auth_service, get_organization_service
from app.modules.system.auth.schemas import (
    CurrentUserResponse,
    OrganizationDepartmentCreate,
    OrganizationDepartmentResponse,
    OrganizationDepartmentUpdate,
    OrganizationOptionsResponse,
    OrganizationPasswordResetResponse,
    OrganizationRoleCreate,
    OrganizationRolePermissionUpdate,
    OrganizationRoleResponse,
    OrganizationRoleUpdate,
    OrganizationUserCreate,
    OrganizationUserCreateResponse,
    OrganizationUserListResponse,
    OrganizationUserResponse,
    OrganizationUserUpdate,
)
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.modules.system.company.providers import get_company_service
from app.modules.system.company.schemas import CompanyInfoResponse, CompanyInfoUpdate
from app.modules.system.company.services import CompanyPermissionDeniedError, CompanyService
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


def _raise_department_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="部门不存在")


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


@router.post(
    "/departments",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationDepartmentResponse],
)
async def create_organization_department(
    payload: OrganizationDepartmentCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        department = await service.create_department(current_user=current_user, payload=payload)
        return ApiResponse(data=department)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationDepartmentNameTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="部门名称已存在") from None
    except OrganizationReferenceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="上级部门不存在",
        ) from None


@router.patch(
    "/departments/{department_id}",
    response_model=ApiResponse[OrganizationDepartmentResponse],
)
async def update_organization_department(
    department_id: str,
    payload: OrganizationDepartmentUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        department = await service.update_department(
            current_user=current_user,
            department_id=department_id,
            payload=payload,
        )
        return ApiResponse(data=department)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationDepartmentNotFoundError:
        _raise_department_not_found()
    except OrganizationDepartmentNameTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="部门名称已存在") from None
    except OrganizationReferenceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="上级部门不存在",
        ) from None


@router.delete(
    "/departments/{department_id}",
    response_model=ApiResponse[OrganizationDepartmentResponse],
)
async def delete_organization_department(
    department_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        department = await service.delete_department(
            current_user=current_user,
            department_id=department_id,
        )
        return ApiResponse(data=department)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationDepartmentNotFoundError:
        _raise_department_not_found()
    except OrganizationDepartmentInUseError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="部门下已有用户，不能删除",
        ) from None


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
    except OrganizationDepartmentRequiredError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="请先新增部门") from None
    except OrganizationReferenceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="部门或角色不存在",
        ) from None
    except OrganizationInvalidAvatarError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="头像配置无效",
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
    except OrganizationInvalidAvatarError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="头像配置无效",
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


@router.post(
    "/roles",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationRoleResponse],
)
async def create_organization_role(
    payload: OrganizationRoleCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        role = await service.create_role(current_user=current_user, payload=payload)
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationRoleCodeTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="角色编码已存在") from None
    except OrganizationReferenceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="权限不存在",
        ) from None


@router.patch("/roles/{role_id}", response_model=ApiResponse[OrganizationRoleResponse])
async def update_organization_role(
    role_id: str,
    payload: OrganizationRoleUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        role = await service.update_role(
            current_user=current_user,
            role_id=role_id,
            payload=payload,
        )
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationRoleNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="角色不存在") from None
    except OrganizationRoleCodeTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="角色编码已存在") from None


@router.delete("/roles/{role_id}", response_model=ApiResponse[OrganizationRoleResponse])
async def delete_organization_role(
    role_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        role = await service.delete_role(current_user=current_user, role_id=role_id)
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        _raise_permission_denied()
    except OrganizationRoleNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="角色不存在") from None
    except OrganizationRoleInUseError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="角色下已有用户，不能删除",
        ) from None


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


@router.get("/company", response_model=ApiResponse[CompanyInfoResponse])
async def get_company_info(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CompanyService, Depends(get_company_service)],
) -> ApiResponse[CompanyInfoResponse]:
    current_user = await _current_user(token, auth_service)
    company = await service.get_company_info(current_user=current_user)
    return ApiResponse(data=company)


@router.patch("/company", response_model=ApiResponse[CompanyInfoResponse])
async def update_company_info(
    payload: CompanyInfoUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CompanyService, Depends(get_company_service)],
) -> ApiResponse[CompanyInfoResponse]:
    current_user = await _current_user(token, auth_service)
    try:
        company = await service.update_company_info(current_user=current_user, payload=payload)
        return ApiResponse(data=company)
    except CompanyPermissionDeniedError:
        _raise_permission_denied()
