from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
from app.modules.warehouse.inbound_plans.providers import get_inbound_plan_service
from app.modules.warehouse.inbound_plans.schemas import (
    InboundPlanGenerateFromPurchaseContract,
    InboundPlanListResponse,
    InboundPlanResponse,
    InboundPlanSchedule,
)
from app.modules.warehouse.inbound_plans.services import (
    InboundPlanNotFoundError,
    InboundPlanPurchaseContractNotFoundError,
    InboundPlanService,
    PermissionDeniedError,
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
    try:
        plans = await service.list_plans(
            current_user=user,
            q=q,
            inbound_type=inbound_type,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=plans)
    except PermissionDeniedError:
        raise_permission_denied("缺少入库计划权限")
    except ValueError:
        raise_unprocessable("入库计划数据无效")


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
    try:
        plan = await service.generate_from_purchase_contract(current_user=user, payload=payload)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少入库计划权限")
    except InboundPlanPurchaseContractNotFoundError:
        raise_not_found("采购合同不存在")
    except ValueError:
        raise_unprocessable("入库计划数据无效")


@router.get("/{plan_id}", response_model=ApiResponse[InboundPlanResponse])
async def get_inbound_plan(
    plan_id: str,
    user: CurrentUserDep,
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    try:
        plan = await service.get_plan(current_user=user, plan_id=plan_id)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少入库计划权限")
    except InboundPlanNotFoundError:
        raise_not_found("入库计划不存在")


@router.post("/{plan_id}/schedule", response_model=ApiResponse[InboundPlanResponse])
async def schedule_inbound_plan(
    plan_id: str,
    payload: InboundPlanSchedule,
    user: CurrentUserDep,
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    try:
        plan = await service.schedule_plan(current_user=user, plan_id=plan_id, payload=payload)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少入库计划权限")
    except InboundPlanNotFoundError:
        raise_not_found("入库计划不存在")
    except ValueError:
        raise_unprocessable("入库计划数据无效")
