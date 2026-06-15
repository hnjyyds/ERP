from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.api.v1.finance.common import current_user, raise_permission_denied, raise_unprocessable
from app.modules.finance.fee_payments.providers import get_fee_payment_service
from app.modules.finance.fee_payments.schemas import (
    FeePayableListResponse,
    FeePaymentRequestApprove,
    FeePaymentRequestCreate,
    FeePaymentRequestListResponse,
    FeePaymentRequestResponse,
    PartnerFeeInvoiceCreate,
    PartnerFeeInvoiceListResponse,
    PartnerFeeInvoiceResponse,
)
from app.modules.finance.fee_payments.services import FeePaymentNotFoundError, FeePaymentService
from app.modules.finance.fee_payments.services import (
    PermissionDeniedError as FeePaymentPermissionDeniedError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService
from app.schemas.responses import ApiResponse

router = APIRouter()

@router.post(
    "/partner-fee-invoices",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PartnerFeeInvoiceResponse],
)
async def create_partner_fee_invoice(
    payload: PartnerFeeInvoiceCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
) -> ApiResponse[PartnerFeeInvoiceResponse]:
    user = await current_user(token, auth_service)
    try:
        invoice = await service.create_partner_fee_invoice(current_user=user, payload=payload)
        return ApiResponse(data=invoice)
    except FeePaymentPermissionDeniedError:
        raise_permission_denied()
    except FeePaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴费用发票不存在",
        ) from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/partner-fee-invoices",
    response_model=ApiResponse[PartnerFeeInvoiceListResponse],
)
async def list_partner_fee_invoices(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    partner_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[PartnerFeeInvoiceListResponse]:
    user = await current_user(token, auth_service)
    try:
        invoices = await service.list_partner_fee_invoices(
            current_user=user,
            q=q,
            status=status_filter,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        return ApiResponse(data=invoices)
    except FeePaymentPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/fee-payment-requests",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FeePaymentRequestResponse],
)
async def create_fee_payment_request(
    payload: FeePaymentRequestCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
) -> ApiResponse[FeePaymentRequestResponse]:
    user = await current_user(token, auth_service)
    try:
        fee_payment_request = await service.create_fee_payment_request(
            current_user=user,
            payload=payload,
        )
        return ApiResponse(data=fee_payment_request)
    except FeePaymentPermissionDeniedError:
        raise_permission_denied()
    except FeePaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="付费申请不存在",
        ) from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/fee-payment-requests",
    response_model=ApiResponse[FeePaymentRequestListResponse],
)
async def list_fee_payment_requests(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    partner_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FeePaymentRequestListResponse]:
    user = await current_user(token, auth_service)
    try:
        fee_payment_requests = await service.list_fee_payment_requests(
            current_user=user,
            q=q,
            status=status_filter,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        return ApiResponse(data=fee_payment_requests)
    except FeePaymentPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/fee-payment-requests/{fee_payment_request_id}/approve",
    response_model=ApiResponse[FeePaymentRequestResponse],
)
async def approve_fee_payment_request(
    fee_payment_request_id: str,
    payload: FeePaymentRequestApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
) -> ApiResponse[FeePaymentRequestResponse]:
    user = await current_user(token, auth_service)
    try:
        fee_payment_request = await service.approve_fee_payment_request(
            current_user=user,
            fee_payment_request_id=fee_payment_request_id,
            payload=payload,
        )
        return ApiResponse(data=fee_payment_request)
    except FeePaymentPermissionDeniedError:
        raise_permission_denied()
    except FeePaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="付费申请不存在",
        ) from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get("/fee-payables", response_model=ApiResponse[FeePayableListResponse])
async def list_fee_payables(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    partner_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FeePayableListResponse]:
    user = await current_user(token, auth_service)
    try:
        payables = await service.list_fee_payables(
            current_user=user,
            q=q,
            status=status_filter,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        return ApiResponse(data=payables)
    except FeePaymentPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))
