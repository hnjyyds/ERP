from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.masterdata.customers.providers import get_customer_service
from app.modules.masterdata.customers.schemas import (
    CustomerContactCreate,
    CustomerContactResponse,
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerTransactionListResponse,
    CustomerUpdate,
)
from app.modules.masterdata.customers.services import (
    CustomerNotFoundError,
    CustomerService,
    PermissionDeniedError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/customers", tags=["customers"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少客户资料权限")


@router.get("", response_model=ApiResponse[CustomerListResponse])
async def list_customers(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CustomerService, Depends(get_customer_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    country: Annotated[str | None, Query(max_length=120)] = None,
    credit_grade: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[CustomerListResponse]:
    user = await _current_user(token, auth_service)
    try:
        customers = await service.list_customers(
            current_user=user,
            q=q,
            country=country,
            credit_grade=credit_grade,
        )
        return ApiResponse(data=customers)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[CustomerResponse])
async def create_customer(
    payload: CustomerCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerResponse]:
    user = await _current_user(token, auth_service)
    try:
        customer = await service.create_customer(current_user=user, payload=payload)
        return ApiResponse(data=customer)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/{customer_id}", response_model=ApiResponse[CustomerResponse])
async def get_customer(
    customer_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerResponse]:
    user = await _current_user(token, auth_service)
    try:
        customer = await service.get_customer(current_user=user, customer_id=customer_id)
        return ApiResponse(data=customer)
    except PermissionDeniedError:
        _raise_permission_denied()
    except CustomerNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客户不存在") from None


@router.put("/{customer_id}", response_model=ApiResponse[CustomerResponse])
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerResponse]:
    user = await _current_user(token, auth_service)
    try:
        customer = await service.update_customer(
            current_user=user,
            customer_id=customer_id,
            payload=payload,
        )
        return ApiResponse(data=customer)
    except PermissionDeniedError:
        _raise_permission_denied()
    except CustomerNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客户不存在") from None


@router.post(
    "/{customer_id}/contacts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[CustomerContactResponse],
)
async def add_customer_contact(
    customer_id: str,
    payload: CustomerContactCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerContactResponse]:
    user = await _current_user(token, auth_service)
    try:
        contact = await service.add_contact(
            current_user=user,
            customer_id=customer_id,
            payload=payload,
        )
        return ApiResponse(data=contact)
    except PermissionDeniedError:
        _raise_permission_denied()
    except CustomerNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客户不存在") from None


@router.get(
    "/{customer_id}/transactions",
    response_model=ApiResponse[CustomerTransactionListResponse],
)
async def list_customer_transactions(
    customer_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerTransactionListResponse]:
    user = await _current_user(token, auth_service)
    try:
        transactions = await service.list_transactions(
            current_user=user,
            customer_id=customer_id,
        )
        return ApiResponse(data=transactions)
    except PermissionDeniedError:
        _raise_permission_denied()
    except CustomerNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客户不存在") from None
