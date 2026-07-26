from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied, raise_unprocessable
from app.modules.reporting.approvals.providers import get_approval_query_service
from app.modules.reporting.approvals.schemas import ApprovalQueryResponse
from app.modules.reporting.approvals.services import (
    ApprovalQueryService,
    PermissionDeniedError,
)
from app.modules.reporting.statistics.providers import get_reporting_statistics_service
from app.modules.reporting.statistics.schemas import ReportingStatisticsResponse
from app.modules.reporting.statistics.services import (
    PermissionDeniedError as StatisticsPermissionDeniedError,
)
from app.modules.reporting.statistics.services import ReportingStatisticsService
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/reporting", tags=["reporting"])


@router.get("/approvals", response_model=ApiResponse[ApprovalQueryResponse])
async def list_approval_documents(
    user: CurrentUserDep,
    service: Annotated[ApprovalQueryService, Depends(get_approval_query_service)],
    document_type: Annotated[str | None, Query(max_length=40)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    applicant_user_id: Annotated[str | None, Query(max_length=64)] = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> ApiResponse[ApprovalQueryResponse]:
    try:
        approvals = await service.list_approvals(
            current_user=user,
            document_type=document_type,
            status=status_filter,
            applicant_user_id=applicant_user_id,
            date_from=date_from,
            date_to=date_to,
        )
        return ApiResponse(data=approvals)
    except PermissionDeniedError:
        raise_permission_denied("缺少经理查询权限")
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get("/statistics", response_model=ApiResponse[ReportingStatisticsResponse])
async def get_reporting_statistics(
    user: CurrentUserDep,
    service: Annotated[ReportingStatisticsService, Depends(get_reporting_statistics_service)],
    date_from: date | None = None,
    date_to: date | None = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[ReportingStatisticsResponse]:
    try:
        statistics = await service.get_statistics(
            current_user=user,
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            supplier_id=supplier_id,
            sales_user_id=sales_user_id,
            approval_status=approval_status,
        )
        return ApiResponse(data=statistics)
    except StatisticsPermissionDeniedError:
        raise_permission_denied("缺少经理查询权限")
    except ValueError as exc:
        raise_unprocessable(str(exc))
