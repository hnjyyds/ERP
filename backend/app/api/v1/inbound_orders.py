from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.warehouse.inbound_orders.providers import get_inbound_order_service
from app.modules.warehouse.inbound_orders.schemas import (
    InboundOrderApprove,
    InboundOrderGenerateFromPlan,
    InboundOrderListResponse,
    InboundOrderResponse,
    InboundOrderSubmit,
    InventoryBalanceListResponse,
    InventoryLedgerListResponse,
)
from app.modules.warehouse.inbound_orders.services import (
    InboundOrderService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/warehouse/inbound-orders", tags=["warehouse-inbound-orders"])


@router.get("", response_model=ApiResponse[InboundOrderListResponse])
async def list_inbound_orders(
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    inbound_mode: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InboundOrderListResponse]:
    orders = await service.list_orders(
        current_user=user,
        q=q,
        status=status,
        inbound_mode=inbound_mode,
        supplier_id=supplier_id,
        purchase_contract_id=purchase_contract_id,
    )
    return ApiResponse(data=orders)


@router.post(
    "/from-plan",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[InboundOrderResponse],
)
async def generate_inbound_order_from_plan(
    payload: InboundOrderGenerateFromPlan,
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    order = await service.generate_from_plan(current_user=user, payload=payload)
    return ApiResponse(data=order)


@router.get("/inventory-balances", response_model=ApiResponse[InventoryBalanceListResponse])
async def list_inventory_balances(
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    warehouse_id: Annotated[str | None, Query(max_length=36)] = None,
    location_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InventoryBalanceListResponse]:
    balances = await service.list_inventory_balances(
        current_user=user,
        q=q,
        warehouse_id=warehouse_id,
        location_id=location_id,
        product_id=product_id,
    )
    return ApiResponse(data=balances)


@router.get("/inventory-ledgers", response_model=ApiResponse[InventoryLedgerListResponse])
async def list_inventory_ledgers(
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    source_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InventoryLedgerListResponse]:
    ledgers = await service.list_inventory_ledgers(
        current_user=user,
        q=q,
        source_id=source_id,
        product_id=product_id,
    )
    return ApiResponse(data=ledgers)


@router.get("/{order_id}", response_model=ApiResponse[InboundOrderResponse])
async def get_inbound_order(
    order_id: str,
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    order = await service.get_order(current_user=user, order_id=order_id)
    return ApiResponse(data=order)


@router.post("/{order_id}/submit", response_model=ApiResponse[InboundOrderResponse])
async def submit_inbound_order(
    order_id: str,
    payload: InboundOrderSubmit,
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    order = await service.submit_order(
        current_user=user,
        order_id=order_id,
        payload=payload,
    )
    return ApiResponse(data=order)


@router.post("/{order_id}/approve", response_model=ApiResponse[InboundOrderResponse])
async def approve_inbound_order(
    order_id: str,
    payload: InboundOrderApprove,
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    order = await service.approve_order(current_user=user, order_id=order_id, payload=payload)
    return ApiResponse(data=order)
