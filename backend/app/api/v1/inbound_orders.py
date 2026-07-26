from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
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
    InboundOrderNotFoundError,
    InboundOrderPlanNotFoundError,
    InboundOrderService,
    PermissionDeniedError,
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
    try:
        orders = await service.list_orders(
            current_user=user,
            q=q,
            status=status,
            inbound_mode=inbound_mode,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=orders)
    except PermissionDeniedError:
        raise_permission_denied("缺少货物入库权限")
    except ValueError:
        raise_unprocessable("货物入库数据无效")


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
    try:
        order = await service.generate_from_plan(current_user=user, payload=payload)
        return ApiResponse(data=order)
    except PermissionDeniedError:
        raise_permission_denied("缺少货物入库权限")
    except InboundOrderPlanNotFoundError:
        raise_not_found("入库计划不存在")
    except ValueError:
        raise_unprocessable("货物入库数据无效")


@router.get("/inventory-balances", response_model=ApiResponse[InventoryBalanceListResponse])
async def list_inventory_balances(
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    warehouse_id: Annotated[str | None, Query(max_length=36)] = None,
    location_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InventoryBalanceListResponse]:
    try:
        balances = await service.list_inventory_balances(
            current_user=user,
            q=q,
            warehouse_id=warehouse_id,
            location_id=location_id,
            product_id=product_id,
        )
        return ApiResponse(data=balances)
    except PermissionDeniedError:
        raise_permission_denied("缺少货物入库权限")


@router.get("/inventory-ledgers", response_model=ApiResponse[InventoryLedgerListResponse])
async def list_inventory_ledgers(
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    source_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InventoryLedgerListResponse]:
    try:
        ledgers = await service.list_inventory_ledgers(
            current_user=user,
            q=q,
            source_id=source_id,
            product_id=product_id,
        )
        return ApiResponse(data=ledgers)
    except PermissionDeniedError:
        raise_permission_denied("缺少货物入库权限")


@router.get("/{order_id}", response_model=ApiResponse[InboundOrderResponse])
async def get_inbound_order(
    order_id: str,
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    try:
        order = await service.get_order(current_user=user, order_id=order_id)
        return ApiResponse(data=order)
    except PermissionDeniedError:
        raise_permission_denied("缺少货物入库权限")
    except InboundOrderNotFoundError:
        raise_not_found("入库单不存在")


@router.post("/{order_id}/submit", response_model=ApiResponse[InboundOrderResponse])
async def submit_inbound_order(
    order_id: str,
    payload: InboundOrderSubmit,
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    try:
        order = await service.submit_order(
            current_user=user,
            order_id=order_id,
            payload=payload,
        )
        return ApiResponse(data=order)
    except PermissionDeniedError:
        raise_permission_denied("缺少货物入库权限")
    except InboundOrderNotFoundError:
        raise_not_found("入库单不存在")
    except ValueError:
        raise_unprocessable("货物入库数据无效")


@router.post("/{order_id}/approve", response_model=ApiResponse[InboundOrderResponse])
async def approve_inbound_order(
    order_id: str,
    payload: InboundOrderApprove,
    user: CurrentUserDep,
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    try:
        order = await service.approve_order(current_user=user, order_id=order_id, payload=payload)
        return ApiResponse(data=order)
    except PermissionDeniedError:
        raise_permission_denied("缺少货物入库权限")
    except InboundOrderNotFoundError:
        raise_not_found("入库单不存在")
    except InboundOrderPlanNotFoundError:
        raise_not_found("入库计划不存在")
    except ValueError:
        raise_unprocessable("货物入库数据无效")
