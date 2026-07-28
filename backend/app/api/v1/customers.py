from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.masterdata.customers.providers import get_customer_service
from app.modules.masterdata.customers.schemas import (
    CustomerContactCreate,
    CustomerContactResponse,
    CustomerContactUpdate,
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerTransactionListResponse,
    CustomerUpdate,
)
from app.modules.masterdata.customers.services import (
    CustomerService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/customers", tags=["customers"])


@router.get("", response_model=ApiResponse[CustomerListResponse])
async def list_customers(
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    country: Annotated[str | None, Query(max_length=120)] = None,
    credit_grade: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[CustomerListResponse]:
    customers = await service.list_customers(
        current_user=user,
        q=q,
        country=country,
        credit_grade=credit_grade,
    )
    return ApiResponse(data=customers)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[CustomerResponse])
async def create_customer(
    payload: CustomerCreate,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerResponse]:
    customer = await service.create_customer(current_user=user, payload=payload)
    return ApiResponse(data=customer)


@router.get("/{customer_id}", response_model=ApiResponse[CustomerResponse])
async def get_customer(
    customer_id: str,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerResponse]:
    customer = await service.get_customer(current_user=user, customer_id=customer_id)
    return ApiResponse(data=customer)


@router.put("/{customer_id}", response_model=ApiResponse[CustomerResponse])
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerResponse]:
    customer = await service.update_customer(
        current_user=user,
        customer_id=customer_id,
        payload=payload,
    )
    return ApiResponse(data=customer)


@router.delete("/{customer_id}", response_model=ApiResponse[CustomerResponse])
async def delete_customer(
    customer_id: str,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerResponse]:
    customer = await service.deactivate_customer(
        current_user=user,
        customer_id=customer_id,
    )
    return ApiResponse(data=customer)


@router.post(
    "/{customer_id}/contacts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[CustomerContactResponse],
)
async def add_customer_contact(
    customer_id: str,
    payload: CustomerContactCreate,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerContactResponse]:
    contact = await service.add_contact(
        current_user=user,
        customer_id=customer_id,
        payload=payload,
    )
    return ApiResponse(data=contact)


@router.put(
    "/{customer_id}/contacts/{contact_id}",
    response_model=ApiResponse[CustomerContactResponse],
)
async def update_customer_contact(
    customer_id: str,
    contact_id: str,
    payload: CustomerContactUpdate,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerContactResponse]:
    contact = await service.update_contact(
        current_user=user,
        customer_id=customer_id,
        contact_id=contact_id,
        payload=payload,
    )
    return ApiResponse(data=contact)


@router.delete(
    "/{customer_id}/contacts/{contact_id}",
    response_model=ApiResponse[CustomerContactResponse],
)
async def delete_customer_contact(
    customer_id: str,
    contact_id: str,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerContactResponse]:
    contact = await service.delete_contact(
        current_user=user,
        customer_id=customer_id,
        contact_id=contact_id,
    )
    return ApiResponse(data=contact)


@router.get(
    "/{customer_id}/transactions",
    response_model=ApiResponse[CustomerTransactionListResponse],
)
async def list_customer_transactions(
    customer_id: str,
    user: CurrentUserDep,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> ApiResponse[CustomerTransactionListResponse]:
    transactions = await service.list_transactions(
        current_user=user,
        customer_id=customer_id,
    )
    return ApiResponse(data=transactions)
