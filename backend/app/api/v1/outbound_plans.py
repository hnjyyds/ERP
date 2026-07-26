from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
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


@router.get("", response_model=ApiResponse[OutboundPlanListResponse])
async def list_outbound_plans(
    user: CurrentUserDep,
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    outbound_type: Annotated[str | None, Query(max_length=40)] = None,
    source_type: Annotated[str | None, Query(max_length=60)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    source_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[OutboundPlanListResponse]:
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
        return ApiResponse(data=plans)
    except PermissionDeniedError:
        raise_permission_denied("缺少出库计划权限")
    except ValueError:
        raise_unprocessable("出库计划数据无效")


@router.post(
    "/from-shipment",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OutboundPlanResponse],
)
async def generate_outbound_plan_from_shipment(
    payload: OutboundPlanGenerateFromShipment,
    user: CurrentUserDep,
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
) -> ApiResponse[OutboundPlanResponse]:
    try:
        plan = await service.generate_from_shipment(current_user=user, payload=payload)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少出库计划权限")
    except OutboundPlanShipmentNotFoundError:
        raise_not_found("出货明细不存在")
    except ValueError:
        raise_unprocessable("出库计划数据无效")


@router.get("/{plan_id}", response_model=ApiResponse[OutboundPlanResponse])
async def get_outbound_plan(
    plan_id: str,
    user: CurrentUserDep,
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
) -> ApiResponse[OutboundPlanResponse]:
    try:
        plan = await service.get_plan(current_user=user, plan_id=plan_id)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少出库计划权限")
    except OutboundPlanNotFoundError:
        raise_not_found("出库计划不存在")


@router.post("/{plan_id}/schedule", response_model=ApiResponse[OutboundPlanResponse])
async def schedule_outbound_plan(
    plan_id: str,
    payload: OutboundPlanSchedule,
    user: CurrentUserDep,
    service: Annotated[OutboundPlanService, Depends(get_outbound_plan_service)],
) -> ApiResponse[OutboundPlanResponse]:
    try:
        plan = await service.schedule_plan(current_user=user, plan_id=plan_id, payload=payload)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少出库计划权限")
    except OutboundPlanNotFoundError:
        raise_not_found("出库计划不存在")
    except ValueError:
        raise_unprocessable("出库计划数据无效")
