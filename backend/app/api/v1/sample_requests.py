from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied, raise_unprocessable
from app.modules.sample.records.schemas import SampleRecordResponse
from app.modules.sample.requests.providers import get_sample_request_service
from app.modules.sample.requests.schemas import (
    SampleFeeCreate,
    SampleFeeResponse,
    SampleProgressCreate,
    SampleProgressResponse,
    SampleRequestCreate,
    SampleRequestListResponse,
    SampleRequestResponse,
    SampleRequestToRecordCreate,
)
from app.modules.sample.requests.services import (
    PermissionDeniedError,
    SampleFeeNotFoundError,
    SampleRecordAlreadyCreatedError,
    SampleRequestNotFoundError,
    SampleRequestService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sample/requests", tags=["sample-requests"])


@router.get("", response_model=ApiResponse[SampleRequestListResponse])
async def list_sample_requests(
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> ApiResponse[SampleRequestListResponse]:
    try:
        requests = await service.list_requests(
            current_user=user,
            q=q,
            status=status_filter,
            customer_id=customer_id,
            date_from=date_from,
            date_to=date_to,
        )
        return ApiResponse(data=requests)
    except PermissionDeniedError:
        raise_permission_denied("缺少打样管理权限")
    except ValueError:
        raise_unprocessable("打样数据无效")


@router.post(
    "/{request_id}/sample-record",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleRecordResponse],
)
async def create_sample_record_from_request(
    request_id: str,
    payload: SampleRequestToRecordCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleRecordResponse]:
    try:
        record = await service.create_sample_record_from_request(
            current_user=user,
            request_id=request_id,
            payload=payload,
        )
        return ApiResponse(data=record)
    except PermissionDeniedError:
        raise_permission_denied("缺少打样管理权限")
    except SampleRequestNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打样单不存在") from None
    except SampleRecordAlreadyCreatedError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="该打样单已转为样品登记",
        ) from None
    except ValueError:
        raise_unprocessable("打样数据无效")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleRequestResponse],
)
async def create_sample_request(
    payload: SampleRequestCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleRequestResponse]:
    try:
        sample_request = await service.create_request(current_user=user, payload=payload)
        return ApiResponse(data=sample_request)
    except PermissionDeniedError:
        raise_permission_denied("缺少打样管理权限")
    except ValueError:
        raise_unprocessable("打样数据无效")


@router.get("/{request_id}", response_model=ApiResponse[SampleRequestResponse])
async def get_sample_request(
    request_id: str,
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleRequestResponse]:
    try:
        sample_request = await service.get_request(current_user=user, request_id=request_id)
        return ApiResponse(data=sample_request)
    except PermissionDeniedError:
        raise_permission_denied("缺少打样管理权限")
    except SampleRequestNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打样单不存在") from None


@router.post(
    "/{request_id}/progress",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleProgressResponse],
)
async def add_sample_progress(
    request_id: str,
    payload: SampleProgressCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleProgressResponse]:
    try:
        progress = await service.add_progress(
            current_user=user,
            request_id=request_id,
            payload=payload,
        )
        return ApiResponse(data=progress)
    except PermissionDeniedError:
        raise_permission_denied("缺少打样管理权限")
    except SampleRequestNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打样单不存在") from None
    except ValueError:
        raise_unprocessable("打样数据无效")


@router.post(
    "/{request_id}/fees",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleFeeResponse],
)
async def add_sample_fee(
    request_id: str,
    payload: SampleFeeCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleFeeResponse]:
    try:
        fee = await service.add_fee(
            current_user=user,
            request_id=request_id,
            payload=payload,
        )
        return ApiResponse(data=fee)
    except PermissionDeniedError:
        raise_permission_denied("缺少打样管理权限")
    except SampleRequestNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打样单不存在") from None


@router.post(
    "/{request_id}/fees/{fee_id}/payment-request",
    response_model=ApiResponse[SampleFeeResponse],
)
async def request_sample_fee_payment(
    request_id: str,
    fee_id: str,
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleFeeResponse]:
    try:
        fee = await service.request_fee_payment(
            current_user=user,
            request_id=request_id,
            fee_id=fee_id,
        )
        return ApiResponse(data=fee)
    except PermissionDeniedError:
        raise_permission_denied("缺少打样管理权限")
    except SampleRequestNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="打样单不存在",
        ) from None
    except SampleFeeNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="打样费用不存在",
        ) from None
