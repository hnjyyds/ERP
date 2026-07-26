from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied, raise_unprocessable
from app.modules.finance.reports.providers import get_finance_reports_service
from app.modules.finance.reports.schemas import (
    BankReceiptSummaryResponse,
    CustomsReceiptCollectionResponse,
    FeePaymentQueryResponse,
    FinanceReportDrilldownResponse,
    FinanceReportExplanationResponse,
    FinanceReportExportResponse,
    GoodsPaymentQueryResponse,
    ReceiptUsageDetailResponse,
    TaxRefundStatisticsResponse,
)
from app.modules.finance.reports.services import PermissionDeniedError, ReportsService
from app.schemas.responses import ApiResponse

router = APIRouter()


def reject_unsupported_query_params(
    request: Request,
    unsupported_params: set[str],
) -> None:
    if unsupported_params.intersection(request.query_params.keys()):
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/receipt-usage",
    response_model=ApiResponse[ReceiptUsageDetailResponse],
)
async def get_receipt_usage_report(
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    receipt_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[ReceiptUsageDetailResponse]:
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
        raise_permission_denied("缺少财务管理权限")


@router.get(
    "/reports/receipt-usage/export",
    response_model=ApiResponse[FinanceReportExportResponse],
)
async def export_receipt_usage_report(
    request: Request,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    receipt_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FinanceReportExportResponse]:
    reject_unsupported_query_params(request, {"format"})
    try:
        report = await service.export_receipt_usage(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_no=receipt_no,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/bank-receipt-summary",
    response_model=ApiResponse[BankReceiptSummaryResponse],
)
async def get_bank_receipt_summary_report(
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    receipt_type: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[BankReceiptSummaryResponse]:
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
        raise_permission_denied("缺少财务管理权限")


@router.get(
    "/reports/bank-receipt-summary/export",
    response_model=ApiResponse[FinanceReportExportResponse],
)
async def export_bank_receipt_summary_report(
    request: Request,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    receipt_type: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[FinanceReportExportResponse]:
    reject_unsupported_query_params(request, {"format"})
    try:
        report = await service.export_bank_receipt_summary(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_type=receipt_type,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/goods-payment",
    response_model=ApiResponse[GoodsPaymentQueryResponse],
)
async def get_goods_payment_report(
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    supplier_name: Annotated[str | None, Query(max_length=240)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[GoodsPaymentQueryResponse]:
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
        raise_permission_denied("缺少财务管理权限")


@router.get(
    "/reports/goods-payment/export",
    response_model=ApiResponse[FinanceReportExportResponse],
)
async def export_goods_payment_report(
    request: Request,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    supplier_name: Annotated[str | None, Query(max_length=240)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[FinanceReportExportResponse]:
    reject_unsupported_query_params(request, {"format"})
    try:
        report = await service.export_goods_payment(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            supplier_name=supplier_name,
            status=status_filter,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/fee-payment",
    response_model=ApiResponse[FeePaymentQueryResponse],
)
async def get_fee_payment_report(
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    partner_name: Annotated[str | None, Query(max_length=240)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[FeePaymentQueryResponse]:
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
        raise_permission_denied("缺少财务管理权限")


@router.get(
    "/reports/fee-payment/export",
    response_model=ApiResponse[FinanceReportExportResponse],
)
async def export_fee_payment_report(
    request: Request,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    partner_name: Annotated[str | None, Query(max_length=240)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[FinanceReportExportResponse]:
    reject_unsupported_query_params(request, {"format"})
    try:
        report = await service.export_fee_payment(
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
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/customs-receipt-collection",
    response_model=ApiResponse[CustomsReceiptCollectionResponse],
)
async def get_customs_receipt_collection_report(
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    owner_user_id: Annotated[str | None, Query(max_length=64)] = None,
    reminder_status: Annotated[str | None, Query(max_length=40)] = None,
    include_registered: Annotated[bool, Query()] = False,
) -> ApiResponse[CustomsReceiptCollectionResponse]:
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
        raise_permission_denied("缺少财务管理权限")


@router.get(
    "/reports/customs-receipt-collection/export",
    response_model=ApiResponse[FinanceReportExportResponse],
)
async def export_customs_receipt_collection_report(
    request: Request,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    owner_user_id: Annotated[str | None, Query(max_length=64)] = None,
    reminder_status: Annotated[str | None, Query(max_length=40)] = None,
    include_registered: Annotated[bool, Query()] = False,
) -> ApiResponse[FinanceReportExportResponse]:
    reject_unsupported_query_params(request, {"format"})
    try:
        report = await service.export_customs_receipt_collection(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            owner_user_id=owner_user_id,
            reminder_status=reminder_status,
            include_registered=include_registered,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/tax-refund-statistics",
    response_model=ApiResponse[TaxRefundStatisticsResponse],
)
async def get_tax_refund_statistics_report(
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[TaxRefundStatisticsResponse]:
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
        raise_permission_denied("缺少财务管理权限")


@router.get(
    "/reports/tax-refund-statistics/export",
    response_model=ApiResponse[FinanceReportExportResponse],
)
async def export_tax_refund_statistics_report(
    request: Request,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    currency: Annotated[str | None, Query(max_length=10)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[FinanceReportExportResponse]:
    reject_unsupported_query_params(request, {"format"})
    try:
        report = await service.export_tax_refund_statistics(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            status=status_filter,
        )
        return ApiResponse(data=report)
    except PermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/{report_key}/explain",
    response_model=ApiResponse[FinanceReportExplanationResponse],
)
async def explain_finance_report(
    report_key: str,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
) -> ApiResponse[FinanceReportExplanationResponse]:
    try:
        explanation = await service.explain_report(
            current_user=user,
            report_key=report_key,
        )
        return ApiResponse(data=explanation)
    except PermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")


@router.get(
    "/reports/{report_key}/drilldown",
    response_model=ApiResponse[FinanceReportDrilldownResponse],
)
async def drilldown_finance_report(
    report_key: str,
    request: Request,
    user: CurrentUserDep,
    service: Annotated[ReportsService, Depends(get_finance_reports_service)],
    source_no: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[FinanceReportDrilldownResponse]:
    reject_unsupported_query_params(
        request,
        {"receipt_no", "request_no", "document_no"},
    )
    if source_no is None:
        raise_unprocessable("财务报表参数无效")
    try:
        drilldown = await service.drilldown_report(
            current_user=user,
            report_key=report_key,
            source_no=source_no,
        )
        return ApiResponse(data=drilldown)
    except PermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError:
        raise_unprocessable("财务报表参数无效")
