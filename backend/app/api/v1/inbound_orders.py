from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.modules.warehouse.inbound_orders.providers import get_inbound_order_service
from app.modules.warehouse.inbound_orders.schemas import (
    InboundOrderApprove,
    InboundOrderGenerateFromPlan,
    InboundOrderListResponse,
    InboundOrderResponse,
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


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少货物入库权限")


def _raise_invalid_order() -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="货物入库数据无效",
    )


def _raise_order_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="入库单不存在")


def _raise_plan_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="入库计划不存在")


@router.get("", response_model=ApiResponse[InboundOrderListResponse])
async def list_inbound_orders(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    inbound_mode: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InboundOrderListResponse]:
    user = await _current_user(token, auth_service)
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
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_order()


@router.post(
    "/from-plan",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[InboundOrderResponse],
)
async def generate_inbound_order_from_plan(
    payload: InboundOrderGenerateFromPlan,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.generate_from_plan(current_user=user, payload=payload)
        return ApiResponse(data=order)
    except PermissionDeniedError:
        _raise_permission_denied()
    except InboundOrderPlanNotFoundError:
        _raise_plan_not_found()
    except ValueError:
        _raise_invalid_order()


@router.get("/inventory-balances", response_model=ApiResponse[InventoryBalanceListResponse])
async def list_inventory_balances(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    warehouse_id: Annotated[str | None, Query(max_length=36)] = None,
    location_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InventoryBalanceListResponse]:
    user = await _current_user(token, auth_service)
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
        _raise_permission_denied()


@router.get("/inventory-ledgers", response_model=ApiResponse[InventoryLedgerListResponse])
async def list_inventory_ledgers(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    source_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InventoryLedgerListResponse]:
    user = await _current_user(token, auth_service)
    try:
        ledgers = await service.list_inventory_ledgers(
            current_user=user,
            q=q,
            source_id=source_id,
            product_id=product_id,
        )
        return ApiResponse(data=ledgers)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/{order_id}", response_model=ApiResponse[InboundOrderResponse])
async def get_inbound_order(
    order_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.get_order(current_user=user, order_id=order_id)
        return ApiResponse(data=order)
    except PermissionDeniedError:
        _raise_permission_denied()
    except InboundOrderNotFoundError:
        _raise_order_not_found()


@router.post("/{order_id}/submit", response_model=ApiResponse[InboundOrderResponse])
async def submit_inbound_order(
    order_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.submit_order(current_user=user, order_id=order_id)
        return ApiResponse(data=order)
    except PermissionDeniedError:
        _raise_permission_denied()
    except InboundOrderNotFoundError:
        _raise_order_not_found()
    except ValueError:
        _raise_invalid_order()


@router.post("/{order_id}/approve", response_model=ApiResponse[InboundOrderResponse])
async def approve_inbound_order(
    order_id: str,
    payload: InboundOrderApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundOrderService, Depends(get_inbound_order_service)],
) -> ApiResponse[InboundOrderResponse]:
    user = await _current_user(token, auth_service)
    try:
        order = await service.approve_order(current_user=user, order_id=order_id, payload=payload)
        return ApiResponse(data=order)
    except PermissionDeniedError:
        _raise_permission_denied()
    except InboundOrderNotFoundError:
        _raise_order_not_found()
    except InboundOrderPlanNotFoundError:
        _raise_plan_not_found()
    except ValueError:
        _raise_invalid_order()
