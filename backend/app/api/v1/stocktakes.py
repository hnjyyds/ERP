from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.warehouse.stocktakes.providers import get_stocktake_service
from app.modules.warehouse.stocktakes.schemas import (
    StocktakeApprove,
    StocktakeCreate,
    StocktakeOrderListResponse,
    StocktakeOrderResponse,
    StocktakeSubmit,
)
from app.modules.warehouse.stocktakes.services import StocktakeService
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/warehouse/stocktakes", tags=["warehouse-stocktakes"])


@router.get("", response_model=ApiResponse[StocktakeOrderListResponse])
async def list_stocktakes(
    user: CurrentUserDep,
    service: Annotated[StocktakeService, Depends(get_stocktake_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    warehouse_id: Annotated[str | None, Query(max_length=36)] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ApiResponse[StocktakeOrderListResponse]:
    stocktakes = await service.list_stocktakes(
        current_user=user,
        q=q,
        status=status_filter,
        warehouse_id=warehouse_id,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(data=stocktakes)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[StocktakeOrderResponse],
)
async def create_stocktake(
    payload: StocktakeCreate,
    user: CurrentUserDep,
    service: Annotated[StocktakeService, Depends(get_stocktake_service)],
) -> ApiResponse[StocktakeOrderResponse]:
    stocktake = await service.create_stocktake(current_user=user, payload=payload)
    return ApiResponse(data=stocktake)


@router.get("/{order_id}", response_model=ApiResponse[StocktakeOrderResponse])
async def get_stocktake(
    order_id: str,
    user: CurrentUserDep,
    service: Annotated[StocktakeService, Depends(get_stocktake_service)],
) -> ApiResponse[StocktakeOrderResponse]:
    stocktake = await service.get_stocktake(current_user=user, order_id=order_id)
    return ApiResponse(data=stocktake)


@router.post("/{order_id}/submit", response_model=ApiResponse[StocktakeOrderResponse])
async def submit_stocktake(
    order_id: str,
    payload: StocktakeSubmit,
    user: CurrentUserDep,
    service: Annotated[StocktakeService, Depends(get_stocktake_service)],
) -> ApiResponse[StocktakeOrderResponse]:
    stocktake = await service.submit_stocktake(
        current_user=user,
        order_id=order_id,
        payload=payload,
    )
    return ApiResponse(data=stocktake)


@router.post("/{order_id}/approve", response_model=ApiResponse[StocktakeOrderResponse])
async def approve_stocktake(
    order_id: str,
    payload: StocktakeApprove,
    user: CurrentUserDep,
    service: Annotated[StocktakeService, Depends(get_stocktake_service)],
) -> ApiResponse[StocktakeOrderResponse]:
    stocktake = await service.approve_stocktake(
        current_user=user,
        order_id=order_id,
        payload=payload,
    )
    return ApiResponse(data=stocktake)
