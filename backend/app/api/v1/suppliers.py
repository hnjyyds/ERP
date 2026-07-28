from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.masterdata.suppliers.providers import get_supplier_service
from app.modules.masterdata.suppliers.schemas import (
    SupplierContactCreate,
    SupplierContactResponse,
    SupplierContactUpdate,
    SupplierCreate,
    SupplierListResponse,
    SupplierResponse,
    SupplierTransactionListResponse,
    SupplierUpdate,
)
from app.modules.masterdata.suppliers.services import (
    SupplierService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/suppliers", tags=["suppliers"])


@router.get("", response_model=ApiResponse[SupplierListResponse])
async def list_suppliers(
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    country: Annotated[str | None, Query(max_length=120)] = None,
    credit_grade: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[SupplierListResponse]:
    suppliers = await service.list_suppliers(
        current_user=user,
        q=q,
        country=country,
        credit_grade=credit_grade,
    )
    return ApiResponse(data=suppliers)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[SupplierResponse])
async def create_supplier(
    payload: SupplierCreate,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    supplier = await service.create_supplier(current_user=user, payload=payload)
    return ApiResponse(data=supplier)


@router.get("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
async def get_supplier(
    supplier_id: str,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    supplier = await service.get_supplier(current_user=user, supplier_id=supplier_id)
    return ApiResponse(data=supplier)


@router.put("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
async def update_supplier(
    supplier_id: str,
    payload: SupplierUpdate,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    supplier = await service.update_supplier(
        current_user=user,
        supplier_id=supplier_id,
        payload=payload,
    )
    return ApiResponse(data=supplier)


@router.delete("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
async def delete_supplier(
    supplier_id: str,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierResponse]:
    supplier = await service.deactivate_supplier(
        current_user=user,
        supplier_id=supplier_id,
    )
    return ApiResponse(data=supplier)


@router.post(
    "/{supplier_id}/contacts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SupplierContactResponse],
)
async def add_supplier_contact(
    supplier_id: str,
    payload: SupplierContactCreate,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierContactResponse]:
    contact = await service.add_contact(
        current_user=user,
        supplier_id=supplier_id,
        payload=payload,
    )
    return ApiResponse(data=contact)


@router.put(
    "/{supplier_id}/contacts/{contact_id}",
    response_model=ApiResponse[SupplierContactResponse],
)
async def update_supplier_contact(
    supplier_id: str,
    contact_id: str,
    payload: SupplierContactUpdate,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierContactResponse]:
    contact = await service.update_contact(
        current_user=user,
        supplier_id=supplier_id,
        contact_id=contact_id,
        payload=payload,
    )
    return ApiResponse(data=contact)


@router.delete(
    "/{supplier_id}/contacts/{contact_id}",
    response_model=ApiResponse[SupplierContactResponse],
)
async def delete_supplier_contact(
    supplier_id: str,
    contact_id: str,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierContactResponse]:
    contact = await service.delete_contact(
        current_user=user,
        supplier_id=supplier_id,
        contact_id=contact_id,
    )
    return ApiResponse(data=contact)


@router.get(
    "/{supplier_id}/transactions",
    response_model=ApiResponse[SupplierTransactionListResponse],
)
async def list_supplier_transactions(
    supplier_id: str,
    user: CurrentUserDep,
    service: Annotated[SupplierService, Depends(get_supplier_service)],
) -> ApiResponse[SupplierTransactionListResponse]:
    transactions = await service.list_transactions(
        current_user=user,
        supplier_id=supplier_id,
    )
    return ApiResponse(data=transactions)
