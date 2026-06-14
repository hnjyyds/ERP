from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.sample.requests.providers import get_sample_request_service
from app.modules.sample.requests.schemas import (
    SampleFeeCreate,
    SampleFeeResponse,
    SampleProgressCreate,
    SampleProgressResponse,
    SampleRequestCreate,
    SampleRequestListResponse,
    SampleRequestResponse,
)
from app.modules.sample.requests.services import (
    PermissionDeniedError,
    SampleFeeNotFoundError,
    SampleRequestNotFoundError,
    SampleRequestService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sample/requests", tags=["sample-requests"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少打样管理权限")


def _raise_invalid_sample_request() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="打样数据无效",
    )


@router.get("", response_model=ApiResponse[SampleRequestListResponse])
async def list_sample_requests(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SampleRequestListResponse]:
    user = await _current_user(token, auth_service)
    try:
        requests = await service.list_requests(
            current_user=user,
            q=q,
            status=status_filter,
            customer_id=customer_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_sample_request()
    return ApiResponse(data=requests)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleRequestResponse],
)
async def create_sample_request(
    payload: SampleRequestCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleRequestResponse]:
    user = await _current_user(token, auth_service)
    try:
        sample_request = await service.create_request(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_sample_request()
    return ApiResponse(data=sample_request)


@router.get("/{request_id}", response_model=ApiResponse[SampleRequestResponse])
async def get_sample_request(
    request_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleRequestResponse]:
    user = await _current_user(token, auth_service)
    try:
        sample_request = await service.get_request(current_user=user, request_id=request_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleRequestNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打样单不存在") from None
    return ApiResponse(data=sample_request)


@router.post(
    "/{request_id}/progress",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleProgressResponse],
)
async def add_sample_progress(
    request_id: str,
    payload: SampleProgressCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleProgressResponse]:
    user = await _current_user(token, auth_service)
    try:
        progress = await service.add_progress(
            current_user=user,
            request_id=request_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleRequestNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打样单不存在") from None
    except ValueError:
        _raise_invalid_sample_request()
    return ApiResponse(data=progress)


@router.post(
    "/{request_id}/fees",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleFeeResponse],
)
async def add_sample_fee(
    request_id: str,
    payload: SampleFeeCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleFeeResponse]:
    user = await _current_user(token, auth_service)
    try:
        fee = await service.add_fee(
            current_user=user,
            request_id=request_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleRequestNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打样单不存在") from None
    return ApiResponse(data=fee)


@router.post(
    "/{request_id}/fees/{fee_id}/payment-request",
    response_model=ApiResponse[SampleFeeResponse],
)
async def request_sample_fee_payment(
    request_id: str,
    fee_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleFeeResponse]:
    user = await _current_user(token, auth_service)
    try:
        fee = await service.request_fee_payment(
            current_user=user,
            request_id=request_id,
            fee_id=fee_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
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
    return ApiResponse(data=fee)
