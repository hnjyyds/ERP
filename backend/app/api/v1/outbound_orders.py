from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.warehouse.outbound_orders.providers import get_outbound_order_service
from app.modules.warehouse.outbound_orders.schemas import (
    OutboundOrderApprove,
    OutboundOrderGenerateFromPlan,
    OutboundOrderListResponse,
    OutboundOrderResponse,
    OutboundOrderSubmit,
)
from app.modules.warehouse.outbound_orders.services import (
    OutboundOrderService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/warehouse/outbound-orders", tags=["warehouse-outbound-orders"])


@router.get("", response_model=ApiResponse[OutboundOrderListResponse])
async def list_outbound_orders(
    user: CurrentUserDep,
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    outbound_mode: Annotated[str | None, Query(max_length=40)] = None,
    outbound_type: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    source_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[OutboundOrderListResponse]:
    orders = await service.list_orders(
        current_user=user,
        q=q,
        status=status,
        outbound_mode=outbound_mode,
        outbound_type=outbound_type,
        customer_id=customer_id,
        source_id=source_id,
    )
    return ApiResponse(data=orders)


@router.post(
    "/from-plan",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OutboundOrderResponse],
)
async def generate_outbound_order_from_plan(
    payload: OutboundOrderGenerateFromPlan,
    user: CurrentUserDep,
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    order = await service.generate_from_plan(current_user=user, payload=payload)
    return ApiResponse(data=order)


@router.get("/{order_id}", response_model=ApiResponse[OutboundOrderResponse])
async def get_outbound_order(
    order_id: str,
    user: CurrentUserDep,
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    order = await service.get_order(current_user=user, order_id=order_id)
    return ApiResponse(data=order)


@router.post("/{order_id}/submit", response_model=ApiResponse[OutboundOrderResponse])
async def submit_outbound_order(
    order_id: str,
    payload: OutboundOrderSubmit,
    user: CurrentUserDep,
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    order = await service.submit_order(
        current_user=user,
        order_id=order_id,
        payload=payload,
    )
    return ApiResponse(data=order)


@router.post("/{order_id}/approve", response_model=ApiResponse[OutboundOrderResponse])
async def approve_outbound_order(
    order_id: str,
    payload: OutboundOrderApprove,
    user: CurrentUserDep,
    service: Annotated[OutboundOrderService, Depends(get_outbound_order_service)],
) -> ApiResponse[OutboundOrderResponse]:
    order = await service.approve_order(current_user=user, order_id=order_id, payload=payload)
    return ApiResponse(data=order)
