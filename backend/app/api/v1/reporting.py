from datetime import date
from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
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
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/reporting", tags=["reporting"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少经理查询权限")


def _raise_unprocessable(message: str) -> NoReturn:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=message)


@router.get("/approvals", response_model=ApiResponse[ApprovalQueryResponse])
async def list_approval_documents(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ApprovalQueryService, Depends(get_approval_query_service)],
    document_type: Annotated[str | None, Query(max_length=40)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    applicant_user_id: Annotated[str | None, Query(max_length=64)] = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> ApiResponse[ApprovalQueryResponse]:
    user = await _current_user(token, auth_service)
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
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))


@router.get("/statistics", response_model=ApiResponse[ReportingStatisticsResponse])
async def get_reporting_statistics(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReportingStatisticsService, Depends(get_reporting_statistics_service)],
    date_from: date | None = None,
    date_to: date | None = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[ReportingStatisticsResponse]:
    user = await _current_user(token, auth_service)
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
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
