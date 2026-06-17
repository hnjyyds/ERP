from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_bearer_token
from app.api.v1.finance.common import current_user, raise_permission_denied
from app.modules.finance.reports.providers import get_finance_reports_service
from app.modules.finance.reports.schemas import (
    BankReceiptSummaryResponse,
    CustomsReceiptCollectionResponse,
    FeePaymentQueryResponse,
    GoodsPaymentQueryResponse,
    ReceiptUsageDetailResponse,
    TaxRefundStatisticsResponse,
)
from app.modules.finance.reports.services import PermissionDeniedError, ReportsService
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.get(
    "/reports/receipt-usage",
    response_model=ApiResponse[ReceiptUsageDetailResponse],
)
async def get_receipt_usage_report(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    receipt_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[ReceiptUsageDetailResponse]:
    user = await current_user(token, auth_service)
    try:
        report = await service.get_receipt_usage(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_no=receipt_no,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied()


@router.get(
    "/reports/bank-receipt-summary",
    response_model=ApiResponse[BankReceiptSummaryResponse],
)
async def get_bank_receipt_summary_report(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    receipt_type: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[BankReceiptSummaryResponse]:
    user = await current_user(token, auth_service)
    try:
        report = await service.get_bank_receipt_summary(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_type=receipt_type,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied()


@router.get(
    "/reports/goods-payment",
    response_model=ApiResponse[GoodsPaymentQueryResponse],
)
async def get_goods_payment_report(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    supplier_name: Annotated[str | None, Query(max_length=240)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[GoodsPaymentQueryResponse]:
    user = await current_user(token, auth_service)
    try:
        report = await service.get_goods_payment(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            supplier_name=supplier_name,
            status=status_filter,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied()


@router.get(
    "/reports/fee-payment",
    response_model=ApiResponse[FeePaymentQueryResponse],
)
async def get_fee_payment_report(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    partner_name: Annotated[str | None, Query(max_length=240)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[FeePaymentQueryResponse]:
    user = await current_user(token, auth_service)
    try:
        report = await service.get_fee_payment(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            partner_name=partner_name,
            fee_type=fee_type,
            sales_user_id=sales_user_id,
            status=status_filter,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied()


@router.get(
    "/reports/customs-receipt-collection",
    response_model=ApiResponse[CustomsReceiptCollectionResponse],
)
async def get_customs_receipt_collection_report(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    owner_user_id: Annotated[str | None, Query(max_length=64)] = None,
    reminder_status: Annotated[str | None, Query(max_length=40)] = None,
    include_registered: Annotated[bool, Query()] = False,
) -> ApiResponse[CustomsReceiptCollectionResponse]:
    user = await current_user(token, auth_service)
    try:
        report = await service.get_customs_receipt_collection(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            owner_user_id=owner_user_id,
            reminder_status=reminder_status,
            include_registered=include_registered,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied()


@router.get(
    "/reports/tax-refund-statistics",
    response_model=ApiResponse[TaxRefundStatisticsResponse],
)
async def get_tax_refund_statistics_report(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[TaxRefundStatisticsResponse]:
    user = await current_user(token, auth_service)
    try:
        report = await service.get_tax_refund_statistics(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            status=status_filter,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied()
