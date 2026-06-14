from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.sample.records.providers import get_sample_record_service
from app.modules.sample.records.schemas import (
    SampleImageCreate,
    SampleImageResponse,
    SampleRecordCreate,
    SampleRecordListResponse,
    SampleRecordResponse,
    SampleStockEventCreate,
    SampleStockEventResponse,
)
from app.modules.sample.records.services import (
    PermissionDeniedError,
    SampleRecordNotFoundError,
    SampleRecordService,
    SampleStockError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sample/records", tags=["sample-records"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少样品登记权限")


def _raise_invalid_sample_record() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="样品登记数据无效",
    )


@router.get("", response_model=ApiResponse[SampleRecordListResponse])
async def list_sample_records(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    sample_type: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SampleRecordListResponse]:
    user = await _current_user(token, auth_service)
    try:
        records = await service.list_records(
            current_user=user,
            q=q,
            sample_type=sample_type,
            customer_id=customer_id,
            purchase_contract_id=purchase_contract_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_sample_record()
    return ApiResponse(data=records)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleRecordResponse],
)
async def create_sample_record(
    payload: SampleRecordCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleRecordResponse]:
    user = await _current_user(token, auth_service)
    try:
        record = await service.create_record(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_sample_record()
    return ApiResponse(data=record)


@router.get("/{record_id}", response_model=ApiResponse[SampleRecordResponse])
async def get_sample_record(
    record_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleRecordResponse]:
    user = await _current_user(token, auth_service)
    try:
        record = await service.get_record(current_user=user, record_id=record_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="样品不存在") from None
    return ApiResponse(data=record)


@router.post(
    "/{record_id}/images",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleImageResponse],
)
async def add_sample_image(
    record_id: str,
    payload: SampleImageCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleImageResponse]:
    user = await _current_user(token, auth_service)
    try:
        image = await service.add_image(current_user=user, record_id=record_id, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="样品不存在") from None
    return ApiResponse(data=image)


@router.post(
    "/{record_id}/stock-events",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleStockEventResponse],
)
async def add_sample_stock_event(
    record_id: str,
    payload: SampleStockEventCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleStockEventResponse]:
    user = await _current_user(token, auth_service)
    try:
        stock_event = await service.add_stock_event(
            current_user=user,
            record_id=record_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="样品不存在") from None
    except (SampleStockError, ValueError):
        _raise_invalid_sample_record()
    return ApiResponse(data=stock_event)
