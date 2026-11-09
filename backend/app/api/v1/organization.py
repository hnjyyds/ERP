from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.permission_dependencies import require_permissions
from app.modules.system.auth.organization_services import (
    OrganizationPermissionDeniedError,
    OrganizationService,
)
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
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

# 组织管理全部写接口与用户/角色查询均要求超级管理员；service 层保留同样校验。
_ORGANIZATION_ADMIN = Depends(
    require_permissions(
        SUPER_ADMIN_PERMISSION,
        error=OrganizationPermissionDeniedError,
    )
)


@router.get(
    "/options",
    response_model=ApiResponse[OrganizationOptionsResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def get_organization_options(
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationOptionsResponse]:
    options = await service.list_options(current_user=current_user)
    return ApiResponse(data=options)


@router.post(
    "/departments",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationDepartmentResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def create_organization_department(
    payload: OrganizationDepartmentCreate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    department = await service.create_department(current_user=current_user, payload=payload)
    return ApiResponse(data=department)


@router.patch(
    "/departments/{department_id}",
    response_model=ApiResponse[OrganizationDepartmentResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def update_organization_department(
    department_id: str,
    payload: OrganizationDepartmentUpdate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    department = await service.update_department(
        current_user=current_user,
        department_id=department_id,
        payload=payload,
    )
    return ApiResponse(data=department)


@router.delete(
    "/departments/{department_id}",
    response_model=ApiResponse[OrganizationDepartmentResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def delete_organization_department(
    department_id: str,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationDepartmentResponse]:
    department = await service.delete_department(
        current_user=current_user,
        department_id=department_id,
    )
    return ApiResponse(data=department)


@router.get(
    "/users",
    response_model=ApiResponse[OrganizationUserListResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def list_organization_users(
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserListResponse]:
    users = await service.list_users(current_user=current_user)
    return ApiResponse(data=users)


@router.post(
    "/users",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationUserCreateResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def create_organization_user(
    payload: OrganizationUserCreate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserCreateResponse]:
    created = await service.create_user(current_user=current_user, payload=payload)
    return ApiResponse(data=created)


@router.patch(
    "/users/{user_id}",
    response_model=ApiResponse[OrganizationUserResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def update_organization_user(
    user_id: str,
    payload: OrganizationUserUpdate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserResponse]:
    updated = await service.update_user(
        current_user=current_user,
        user_id=user_id,
        payload=payload,
    )
    return ApiResponse(data=updated)


@router.delete(
    "/users/{user_id}",
    response_model=ApiResponse[OrganizationUserResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def delete_organization_user(
    user_id: str,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationUserResponse]:
    user = await service.deactivate_user(current_user=current_user, user_id=user_id)
    return ApiResponse(data=user)


@router.post(
    "/users/{user_id}/reset-password",
    response_model=ApiResponse[OrganizationPasswordResetResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def reset_organization_user_password(
    user_id: str,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationPasswordResetResponse]:
    reset = await service.reset_password(current_user=current_user, user_id=user_id)
    return ApiResponse(data=reset)


@router.post(
    "/roles",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrganizationRoleResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def create_organization_role(
    payload: OrganizationRoleCreate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    role = await service.create_role(current_user=current_user, payload=payload)
    return ApiResponse(data=role)


@router.patch(
    "/roles/{role_id}",
    response_model=ApiResponse[OrganizationRoleResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def update_organization_role(
    role_id: str,
    payload: OrganizationRoleUpdate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    role = await service.update_role(
        current_user=current_user,
        role_id=role_id,
        payload=payload,
    )
    return ApiResponse(data=role)


@router.delete(
    "/roles/{role_id}",
    response_model=ApiResponse[OrganizationRoleResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def delete_organization_role(
    role_id: str,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    role = await service.delete_role(current_user=current_user, role_id=role_id)
    return ApiResponse(data=role)


@router.patch(
    "/roles/{role_id}/permissions",
    response_model=ApiResponse[OrganizationRoleResponse],
    dependencies=[_ORGANIZATION_ADMIN],
)
async def update_organization_role_permissions(
    role_id: str,
    payload: OrganizationRolePermissionUpdate,
    current_user: CurrentUserDep,
    service: Annotated[OrganizationService, Depends(get_organization_service)],
) -> ApiResponse[OrganizationRoleResponse]:
    role = await service.update_role_permissions(
        current_user=current_user,
        role_id=role_id,
        payload=payload,
    )
    return ApiResponse(data=role)


@router.get("/company", response_model=ApiResponse[CompanyInfoResponse])
async def get_company_info(
    current_user: CurrentUserDep,
    service: Annotated[CompanyService, Depends(get_company_service)],
) -> ApiResponse[CompanyInfoResponse]:
    company = await service.get_company_info(current_user=current_user)
    return ApiResponse(data=company)


@router.patch(
    "/company",
    response_model=ApiResponse[CompanyInfoResponse],
    dependencies=[
        Depends(
            require_permissions(
                SUPER_ADMIN_PERMISSION,
                error=CompanyPermissionDeniedError,
            )
        )
    ],
)
async def update_company_info(
    payload: CompanyInfoUpdate,
    current_user: CurrentUserDep,
    service: Annotated[CompanyService, Depends(get_company_service)],
) -> ApiResponse[CompanyInfoResponse]:
    company = await service.update_company_info(current_user=current_user, payload=payload)
    return ApiResponse(data=company)
