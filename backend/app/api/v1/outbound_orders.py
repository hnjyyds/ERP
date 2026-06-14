from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.modules.warehouse.outbound_orders.providers import get_outbound_order_service
from app.modules.warehouse.outbound_orders.schemas import (
    OutboundOrderApprove,
    OutboundOrderGenerateFromPlan,
    OutboundOrderListResponse,
    OutboundOrderResponse,
)
from app.modules.warehouse.outbound_orders.services import (
    OutboundOrderNotFoundError,
    OutboundOrderPlanNotFoundError,
    OutboundOrderService,
    PermissionDeniedError,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/warehouse/outbound-orders", tags=["warehouse-outbound-orders"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少货物出库权限")


def _raise_invalid_order() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="货物出库数据无效",
    )


def _raise_order_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="出库单不存在")


def _raise_plan_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="出库计划不存在")


@router.get("", response_model=ApiResponse[OutboundOrderListResponse])
async def list_outbound_orders(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    outbound_mode: Annotated[str | None, Query(max_length=40)] = None,
    outbound_type: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    source_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[OutboundOrderListResponse]:
    user = await _current_user(token, auth_service)
    try:
        orders = await service.list_orders(
            current_user=user,
            q=q,
            status=status,
            outbound_mode=outbound_mode,
            outbound_type=outbound_type,
            customer_id=customer_id,
            source_id=source_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_order()
    return ApiResponse(data=orders)


@router.post(
    "/from-plan",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OutboundOrderResponse],
)
async def generate_outbound_order_from_plan(
    payload: OutboundOrderGenerateFromPlan,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.generate_from_plan(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except OutboundOrderPlanNotFoundError:
        _raise_plan_not_found()
    except ValueError:
        _raise_invalid_order()
    return ApiResponse(data=order)


@router.get("/{order_id}", response_model=ApiResponse[OutboundOrderResponse])
async def get_outbound_order(
    order_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.get_order(current_user=user, order_id=order_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except OutboundOrderNotFoundError:
        _raise_order_not_found()
    return ApiResponse(data=order)


@router.post("/{order_id}/submit", response_model=ApiResponse[OutboundOrderResponse])
async def submit_outbound_order(
    order_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.submit_order(current_user=user, order_id=order_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except OutboundOrderNotFoundError:
        _raise_order_not_found()
    except ValueError:
        _raise_invalid_order()
    return ApiResponse(data=order)


@router.post("/{order_id}/approve", response_model=ApiResponse[OutboundOrderResponse])
async def approve_outbound_order(
    order_id: str,
    payload: OutboundOrderApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.approve_order(current_user=user, order_id=order_id, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except OutboundOrderNotFoundError:
        _raise_order_not_found()
    except OutboundOrderPlanNotFoundError:
        _raise_plan_not_found()
    except ValueError:
        _raise_invalid_order()
    return ApiResponse(data=order)
