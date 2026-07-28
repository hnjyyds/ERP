from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.finance.payments.providers import get_payment_service
from app.modules.finance.payments.schemas import (
    PayableListResponse,
    PaymentRequestApprove,
    PaymentRequestCreate,
    PaymentRequestListResponse,
    PaymentRequestResponse,
    SupplierInvoiceCreate,
    SupplierInvoiceListResponse,
    SupplierInvoiceResponse,
)
from app.modules.finance.payments.services import PaymentService
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.post(
    "/supplier-invoices",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SupplierInvoiceResponse],
)
async def create_supplier_invoice(
    payload: SupplierInvoiceCreate,
    user: CurrentUserDep,
    service: Annotated[PaymentService, Depends(get_payment_service)],
) -> ApiResponse[SupplierInvoiceResponse]:
    invoice = await service.create_supplier_invoice(current_user=user, payload=payload)
    return ApiResponse(data=invoice)


@router.get("/supplier-invoices", response_model=ApiResponse[SupplierInvoiceListResponse])
async def list_supplier_invoices(
    user: CurrentUserDep,
    service: Annotated[PaymentService, Depends(get_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[SupplierInvoiceListResponse]:
    invoices = await service.list_supplier_invoices(
        current_user=user,
        q=q,
        status=status_filter,
        supplier_id=supplier_id,
        purchase_contract_no=purchase_contract_no,
    )
    return ApiResponse(data=invoices)


@router.post(
    "/payment-requests",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PaymentRequestResponse],
)
async def create_payment_request(
    payload: PaymentRequestCreate,
    user: CurrentUserDep,
    service: Annotated[PaymentService, Depends(get_payment_service)],
) -> ApiResponse[PaymentRequestResponse]:
    payment_request = await service.create_payment_request(
        current_user=user,
        payload=payload,
    )
    return ApiResponse(data=payment_request)


@router.get("/payment-requests", response_model=ApiResponse[PaymentRequestListResponse])
async def list_payment_requests(
    user: CurrentUserDep,
    service: Annotated[PaymentService, Depends(get_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    payment_type: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PaymentRequestListResponse]:
    payment_requests = await service.list_payment_requests(
        current_user=user,
        q=q,
        status=status_filter,
        payment_type=payment_type,
        supplier_id=supplier_id,
    )
    return ApiResponse(data=payment_requests)


@router.post(
    "/payment-requests/{payment_request_id}/approve",
    response_model=ApiResponse[PaymentRequestResponse],
)
async def approve_payment_request(
    payment_request_id: str,
    payload: PaymentRequestApprove,
    user: CurrentUserDep,
    service: Annotated[PaymentService, Depends(get_payment_service)],
) -> ApiResponse[PaymentRequestResponse]:
    payment_request = await service.approve_payment_request(
        current_user=user,
        payment_request_id=payment_request_id,
        payload=payload,
    )
    return ApiResponse(data=payment_request)


@router.get("/payables", response_model=ApiResponse[PayableListResponse])
async def list_payables(
    user: CurrentUserDep,
    service: Annotated[PaymentService, Depends(get_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[PayableListResponse]:
    payables = await service.list_payables(
        current_user=user,
        q=q,
        status=status_filter,
        supplier_id=supplier_id,
        purchase_contract_no=purchase_contract_no,
    )
    return ApiResponse(data=payables)
