from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.modules.warehouse.outbound_plans.providers import get_outbound_plan_service
from app.modules.warehouse.outbound_plans.schemas import (
    OutboundPlanGenerateFromShipment,
    OutboundPlanListResponse,
    OutboundPlanResponse,
    OutboundPlanSchedule,
)
from app.modules.warehouse.outbound_plans.services import (
    OutboundPlanNotFoundError,
    OutboundPlanService,
    OutboundPlanShipmentNotFoundError,
    PermissionDeniedError,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/warehouse/outbound-plans", tags=["warehouse-outbound-plans"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少出库计划权限")


def _raise_invalid_plan() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="出库计划数据无效",
    )


def _raise_plan_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="出库计划不存在")


def _raise_shipment_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="出货明细不存在")


@router.get("", response_model=ApiResponse[OutboundPlanListResponse])
async def list_outbound_plans(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    outbound_type: Annotated[str | None, Query(max_length=40)] = None,
    source_type: Annotated[str | None, Query(max_length=60)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    source_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[OutboundPlanListResponse]:
    user = await _current_user(token, auth_service)
    try:
        plans = await service.list_plans(
            current_user=user,
            q=q,
            status=status,
            outbound_type=outbound_type,
            source_type=source_type,
            customer_id=customer_id,
            source_id=source_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_plan()
    return ApiResponse(data=plans)


@router.post(
    "/from-shipment",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OutboundPlanResponse],
)
async def generate_outbound_plan_from_shipment(
    payload: OutboundPlanGenerateFromShipment,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
) -> ApiResponse[OutboundPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.generate_from_shipment(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except OutboundPlanShipmentNotFoundError:
        _raise_shipment_not_found()
    except ValueError:
        _raise_invalid_plan()
    return ApiResponse(data=plan)


@router.get("/{plan_id}", response_model=ApiResponse[OutboundPlanResponse])
async def get_outbound_plan(
    plan_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
) -> ApiResponse[OutboundPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.get_plan(current_user=user, plan_id=plan_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except OutboundPlanNotFoundError:
        _raise_plan_not_found()
    return ApiResponse(data=plan)


@router.post("/{plan_id}/schedule", response_model=ApiResponse[OutboundPlanResponse])
async def schedule_outbound_plan(
    plan_id: str,
    payload: OutboundPlanSchedule,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
) -> ApiResponse[OutboundPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.schedule_plan(current_user=user, plan_id=plan_id, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except OutboundPlanNotFoundError:
        _raise_plan_not_found()
    except ValueError:
        _raise_invalid_plan()
    return ApiResponse(data=plan)
