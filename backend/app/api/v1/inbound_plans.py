from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
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


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少入库计划权限")


def _raise_invalid_plan() -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="入库计划数据无效",
    )


def _raise_plan_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="入库计划不存在")


def _raise_purchase_contract_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="采购合同不存在")


@router.get("", response_model=ApiResponse[InboundPlanListResponse])
async def list_inbound_plans(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    inbound_type: Annotated[str | None, Query(max_length=40)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[InboundPlanListResponse]:
    user = await _current_user(token, auth_service)
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
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_plan()


@router.post(
    "/from-purchase-contract",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[InboundPlanResponse],
)
async def generate_inbound_plan_from_purchase_contract(
    payload: InboundPlanGenerateFromPurchaseContract,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.generate_from_purchase_contract(current_user=user, payload=payload)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        _raise_permission_denied()
    except InboundPlanPurchaseContractNotFoundError:
        _raise_purchase_contract_not_found()
    except ValueError:
        _raise_invalid_plan()


@router.get("/{plan_id}", response_model=ApiResponse[InboundPlanResponse])
async def get_inbound_plan(
    plan_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.get_plan(current_user=user, plan_id=plan_id)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        _raise_permission_denied()
    except InboundPlanNotFoundError:
        _raise_plan_not_found()


@router.post("/{plan_id}/schedule", response_model=ApiResponse[InboundPlanResponse])
async def schedule_inbound_plan(
    plan_id: str,
    payload: InboundPlanSchedule,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[InboundPlanService, Depends(get_inbound_plan_service)],
) -> ApiResponse[InboundPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.schedule_plan(current_user=user, plan_id=plan_id, payload=payload)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        _raise_permission_denied()
    except InboundPlanNotFoundError:
        _raise_plan_not_found()
    except ValueError:
        _raise_invalid_plan()
