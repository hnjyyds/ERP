from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.sample.deliveries.providers import get_sample_delivery_service
from app.modules.sample.deliveries.schemas import (
    SampleDeliveryApprove,
    SampleDeliveryCreate,
    SampleDeliveryFeeStatisticsResponse,
    SampleDeliveryListResponse,
    SampleDeliveryResponse,
    SampleDeliveryTrackingUpdate,
)
from app.modules.sample.deliveries.services import (
    PermissionDeniedError,
    SampleDeliveryNotFoundError,
    SampleDeliveryService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sample/deliveries", tags=["sample-deliveries"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少寄样管理权限")


def _raise_invalid_sample_delivery() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="寄样数据无效",
    )


@router.get("", response_model=ApiResponse[SampleDeliveryListResponse])
async def list_sample_deliveries(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    express_company: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[SampleDeliveryListResponse]:
    user = await _current_user(token, auth_service)
    try:
        deliveries = await service.list_deliveries(
            current_user=user,
            q=q,
            status=status_filter,
            customer_id=customer_id,
            express_company=express_company,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_sample_delivery()
    return ApiResponse(data=deliveries)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleDeliveryResponse],
)
async def create_sample_delivery(
    payload: SampleDeliveryCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    user = await _current_user(token, auth_service)
    try:
        delivery = await service.create_delivery(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_sample_delivery()
    return ApiResponse(data=delivery)


@router.put("/{delivery_id}", response_model=ApiResponse[SampleDeliveryResponse])
async def update_sample_delivery(
    delivery_id: str,
    payload: SampleDeliveryCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    user = await _current_user(token, auth_service)
    try:
        delivery = await service.update_delivery(
            current_user=user,
            delivery_id=delivery_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleDeliveryNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="寄样单不存在") from None
    except ValueError:
        _raise_invalid_sample_delivery()
    return ApiResponse(data=delivery)


@router.get("/fee-statistics", response_model=ApiResponse[SampleDeliveryFeeStatisticsResponse])
async def get_sample_delivery_fee_statistics(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    date_from: date | None = None,
    date_to: date | None = None,
    express_company: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[SampleDeliveryFeeStatisticsResponse]:
    user = await _current_user(token, auth_service)
    try:
        statistics = await service.get_fee_statistics(
            current_user=user,
            customer_id=customer_id,
            date_from=date_from,
            date_to=date_to,
            express_company=express_company,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=statistics)


@router.get(
    "/history/sample/{sample_record_id}",
    response_model=ApiResponse[SampleDeliveryListResponse],
)
async def get_sample_delivery_history(
    sample_record_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryListResponse]:
    user = await _current_user(token, auth_service)
    try:
        history = await service.get_sample_history(
            current_user=user,
            sample_record_id=sample_record_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=history)


@router.get("/quote-history", response_model=ApiResponse[SampleDeliveryListResponse])
async def get_sample_delivery_quote_history(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SampleDeliveryListResponse]:
    user = await _current_user(token, auth_service)
    try:
        history = await service.get_quote_history(
            current_user=user,
            customer_id=customer_id,
            product_id=product_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=history)


@router.get("/{delivery_id}", response_model=ApiResponse[SampleDeliveryResponse])
async def get_sample_delivery(
    delivery_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    user = await _current_user(token, auth_service)
    try:
        delivery = await service.get_delivery(current_user=user, delivery_id=delivery_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleDeliveryNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="寄样单不存在") from None
    return ApiResponse(data=delivery)


@router.post("/{delivery_id}/submit", response_model=ApiResponse[SampleDeliveryResponse])
async def submit_sample_delivery(
    delivery_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    user = await _current_user(token, auth_service)
    try:
        delivery = await service.submit_delivery(current_user=user, delivery_id=delivery_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleDeliveryNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="寄样单不存在") from None
    except ValueError:
        _raise_invalid_sample_delivery()
    return ApiResponse(data=delivery)


@router.post("/{delivery_id}/approve", response_model=ApiResponse[SampleDeliveryResponse])
async def approve_sample_delivery(
    delivery_id: str,
    payload: SampleDeliveryApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    user = await _current_user(token, auth_service)
    try:
        delivery = await service.approve_delivery(
            current_user=user,
            delivery_id=delivery_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleDeliveryNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="寄样单不存在") from None
    except ValueError:
        _raise_invalid_sample_delivery()
    return ApiResponse(data=delivery)


@router.post("/{delivery_id}/tracking", response_model=ApiResponse[SampleDeliveryResponse])
async def update_sample_delivery_tracking(
    delivery_id: str,
    payload: SampleDeliveryTrackingUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    user = await _current_user(token, auth_service)
    try:
        delivery = await service.update_tracking(
            current_user=user,
            delivery_id=delivery_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except SampleDeliveryNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="寄样单不存在") from None
    except ValueError:
        _raise_invalid_sample_delivery()
    return ApiResponse(data=delivery)
