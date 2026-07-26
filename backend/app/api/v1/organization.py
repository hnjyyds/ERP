from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied
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
from app.modules.system.auth.providers import get_organization_service
from app.modules.system.auth.schemas import (
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
from app.modules.system.company.providers import get_company_service
from app.modules.system.company.schemas import CompanyInfoResponse, CompanyInfoUpdate
from app.modules.system.company.services import CompanyPermissionDeniedError, CompanyService
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/organization", tags=["organization"])


@router.get("/options", response_model=ApiResponse[OrganizationOptionsResponse])
async def get_organization_options(
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationOptionsResponse]:
    try:
        options = await service.list_options(current_user=current_user)
        return ApiResponse(data=options)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")


@router.post(
    "/departments",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationDepartmentResponse],
)
async def create_organization_department(
    payload: OrganizationDepartmentCreate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    try:
        department = await service.create_department(current_user=current_user, payload=payload)
        return ApiResponse(data=department)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
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
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    try:
        department = await service.update_department(
            current_user=current_user,
            department_id=department_id,
            payload=payload,
        )
        return ApiResponse(data=department)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
    except OrganizationDepartmentNotFoundError:
        raise_not_found("部门不存在")
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
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    try:
        department = await service.delete_department(
            current_user=current_user,
            department_id=department_id,
        )
        return ApiResponse(data=department)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
    except OrganizationDepartmentNotFoundError:
        raise_not_found("部门不存在")
    except OrganizationDepartmentInUseError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="部门下已有用户，不能删除",
        ) from None


@router.get("/users", response_model=ApiResponse[OrganizationUserListResponse])
async def list_organization_users(
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserListResponse]:
    try:
        users = await service.list_users(current_user=current_user)
        return ApiResponse(data=users)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")


@router.post(
    "/users",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationUserCreateResponse],
)
async def create_organization_user(
    payload: OrganizationUserCreate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserCreateResponse]:
    try:
        created = await service.create_user(current_user=current_user, payload=payload)
        return ApiResponse(data=created)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
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
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserResponse]:
    try:
        updated = await service.update_user(
            current_user=current_user,
            user_id=user_id,
            payload=payload,
        )
        return ApiResponse(data=updated)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
    except OrganizationUserNotFoundError:
        raise_not_found("用户不存在")
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
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserResponse]:
    try:
        user = await service.deactivate_user(current_user=current_user, user_id=user_id)
        return ApiResponse(data=user)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
    except OrganizationUserNotFoundError:
        raise_not_found("用户不存在")
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
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationPasswordResetResponse]:
    try:
        reset = await service.reset_password(current_user=current_user, user_id=user_id)
        return ApiResponse(data=reset)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
    except OrganizationUserNotFoundError:
        raise_not_found("用户不存在")


@router.post(
    "/roles",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationRoleResponse],
)
async def create_organization_role(
    payload: OrganizationRoleCreate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    try:
        role = await service.create_role(current_user=current_user, payload=payload)
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
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
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    try:
        role = await service.update_role(
            current_user=current_user,
            role_id=role_id,
            payload=payload,
        )
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
    except OrganizationRoleNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="角色不存在") from None
    except OrganizationRoleCodeTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="角色编码已存在") from None


@router.delete("/roles/{role_id}", response_model=ApiResponse[OrganizationRoleResponse])
async def delete_organization_role(
    role_id: str,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    try:
        role = await service.delete_role(current_user=current_user, role_id=role_id)
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
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
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    try:
        role = await service.update_role_permissions(
            current_user=current_user,
            role_id=role_id,
            payload=payload,
        )
        return ApiResponse(data=role)
    except OrganizationPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
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
    current_user: CurrentUserDep,
    service: Annotated[CompanyService, Depends(get_company_service)],
) -> ApiResponse[CompanyInfoResponse]:
    company = await service.get_company_info(current_user=current_user)
    return ApiResponse(data=company)


@router.patch("/company", response_model=ApiResponse[CompanyInfoResponse])
async def update_company_info(
    payload: CompanyInfoUpdate,
    current_user: CurrentUserDep,
    service: Annotated[CompanyService, Depends(get_company_service)],
) -> ApiResponse[CompanyInfoResponse]:
    try:
        company = await service.update_company_info(current_user=current_user, payload=payload)
        return ApiResponse(data=company)
    except CompanyPermissionDeniedError:
        raise_permission_denied("缺少组织管理权限")
