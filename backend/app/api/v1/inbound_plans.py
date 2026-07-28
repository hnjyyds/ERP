from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.warehouse.inbound_plans.providers import get_inbound_plan_service
from app.modules.warehouse.inbound_plans.schemas import (
    InboundPlanGenerateFromPurchaseContract,
    InboundPlanListResponse,
    InboundPlanResponse,
    InboundPlanSchedule,
)
from app.modules.warehouse.inbound_plans.services import (
    InboundPlanService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/warehouse/inbound-plans", tags=["warehouse-inbound-plans"])


@router.get("", response_model=ApiResponse[InboundPlanListResponse])
async def list_inbound_plans(
    user: CurrentUserDep,
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    inbound_type: Annotated[str | None, Query(max_length=40)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InboundPlanListResponse]:
    plans = await service.list_plans(
        current_user=user,
        q=q,
        inbound_type=inbound_type,
        status=status,
        supplier_id=supplier_id,
        purchase_contract_id=purchase_contract_id,
    )
    return ApiResponse(data=plans)


@router.post(
    "/from-purchase-contract",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[InboundPlanResponse],
)
async def generate_inbound_plan_from_purchase_contract(
    payload: InboundPlanGenerateFromPurchaseContract,
    user: CurrentUserDep,
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    plan = await service.generate_from_purchase_contract(current_user=user, payload=payload)
    return ApiResponse(data=plan)


@router.get("/{plan_id}", response_model=ApiResponse[InboundPlanResponse])
async def get_inbound_plan(
    plan_id: str,
    user: CurrentUserDep,
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    plan = await service.get_plan(current_user=user, plan_id=plan_id)
    return ApiResponse(data=plan)


@router.post("/{plan_id}/schedule", response_model=ApiResponse[InboundPlanResponse])
async def schedule_inbound_plan(
    plan_id: str,
    payload: InboundPlanSchedule,
    user: CurrentUserDep,
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    plan = await service.schedule_plan(current_user=user, plan_id=plan_id, payload=payload)
    return ApiResponse(data=plan)
