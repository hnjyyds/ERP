from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.masterdata.suppliers.providers import get_supplier_service
from app.modules.masterdata.suppliers.schemas import (
    SupplierContactCreate,
    SupplierContactResponse,
    SupplierCreate,
    SupplierListResponse,
    SupplierResponse,
    SupplierTransactionListResponse,
    SupplierUpdate,
)
from app.modules.masterdata.suppliers.services import (
    PermissionDeniedError,
    SupplierNotFoundError,
    SupplierService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/suppliers", tags=["suppliers"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少供应商资料权限")


@router.get("", response_model=ApiResponse[SupplierListResponse])
async def list_suppliers(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SupplierService, Depends(get_supplier_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    country: Annotated[str | None, Query(max_length=120)] = None,
    credit_grade: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[SupplierListResponse]:
    user = await _current_user(token, auth_service)
    try:
        suppliers = await service.list_suppliers(
            current_user=user,
            q=q,
            country=country,
            credit_grade=credit_grade,
        )
        return ApiResponse(data=suppliers)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[SupplierResponse])
async def create_supplier(
    payload: SupplierCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    user = await _current_user(token, auth_service)
    try:
        supplier = await service.create_supplier(current_user=user, payload=payload)
        return ApiResponse(data=supplier)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
async def get_supplier(
    supplier_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    user = await _current_user(token, auth_service)
    try:
        supplier = await service.get_supplier(current_user=user, supplier_id=supplier_id)
        return ApiResponse(data=supplier)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SupplierNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="供应商不存在") from None


@router.put("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
async def update_supplier(
    supplier_id: str,
    payload: SupplierUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    user = await _current_user(token, auth_service)
    try:
        supplier = await service.update_supplier(
            current_user=user,
            supplier_id=supplier_id,
            payload=payload,
        )
        return ApiResponse(data=supplier)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SupplierNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="供应商不存在") from None


@router.delete("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
async def delete_supplier(
    supplier_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    user = await _current_user(token, auth_service)
    try:
        supplier = await service.deactivate_supplier(
            current_user=user,
            supplier_id=supplier_id,
        )
        return ApiResponse(data=supplier)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SupplierNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="供应商不存在") from None


@router.post(
    "/{supplier_id}/contacts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SupplierContactResponse],
)
async def add_supplier_contact(
    supplier_id: str,
    payload: SupplierContactCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierContactResponse]:
    user = await _current_user(token, auth_service)
    try:
        contact = await service.add_contact(
            current_user=user,
            supplier_id=supplier_id,
            payload=payload,
        )
        return ApiResponse(data=contact)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SupplierNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="供应商不存在") from None


@router.get(
    "/{supplier_id}/transactions",
    response_model=ApiResponse[SupplierTransactionListResponse],
)
async def list_supplier_transactions(
    supplier_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierTransactionListResponse]:
    user = await _current_user(token, auth_service)
    try:
        transactions = await service.list_transactions(
            current_user=user,
            supplier_id=supplier_id,
        )
        return ApiResponse(data=transactions)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SupplierNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="供应商不存在") from None
