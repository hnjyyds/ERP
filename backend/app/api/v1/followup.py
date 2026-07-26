from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
from app.modules.followup.providers import get_followup_service
from app.modules.followup.schemas import (
    FollowProcessTemplateCreate,
    FollowProcessTemplateListResponse,
    FollowProcessTemplateResponse,
    FollowSourceEventSync,
    PurchaseFollowOverdueNodeListResponse,
    PurchaseFollowPlanGenerateFromContract,
    PurchaseFollowPlanListResponse,
    PurchaseFollowPlanResponse,
)
from app.modules.followup.services import (
    FollowupNodeNotFoundError,
    FollowupPlanNotFoundError,
    FollowupService,
    FollowupTemplateNotFoundError,
    PermissionDeniedError,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/followup", tags=["followup"])


@router.get("/templates", response_model=ApiResponse[FollowProcessTemplateListResponse])
async def list_followup_templates(
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[FollowProcessTemplateListResponse]:
    try:
        templates = await service.list_templates(current_user=user)
        return ApiResponse(data=templates)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")


@router.post(
    "/templates",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FollowProcessTemplateResponse],
)
async def create_followup_template(
    payload: FollowProcessTemplateCreate,
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[FollowProcessTemplateResponse]:
    try:
        template = await service.create_template(current_user=user, payload=payload)
        return ApiResponse(data=template)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")


@router.put(
    "/templates/{template_id}",
    response_model=ApiResponse[FollowProcessTemplateResponse],
)
async def update_followup_template(
    template_id: str,
    payload: FollowProcessTemplateCreate,
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[FollowProcessTemplateResponse]:
    try:
        template = await service.update_template(
            current_user=user,
            template_id=template_id,
            payload=payload,
        )
        return ApiResponse(data=template)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")
    except FollowupTemplateNotFoundError:
        raise_not_found("跟单模板不存在")


@router.get("/plans", response_model=ApiResponse[PurchaseFollowPlanListResponse])
async def list_followup_plans(
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    overall_status: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseFollowPlanListResponse]:
    try:
        plans = await service.list_plans(
            current_user=user,
            q=q,
            overall_status=overall_status,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=plans)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")
    except ValueError:
        raise_unprocessable("采购跟单数据无效")


@router.post(
    "/plans/from-purchase-contract",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseFollowPlanResponse],
)
async def generate_followup_plan_from_purchase_contract(
    payload: PurchaseFollowPlanGenerateFromContract,
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    try:
        plan = await service.generate_plan_from_purchase_contract(
            current_user=user,
            purchase_contract_id=payload.purchase_contract_id,
            as_of=payload.as_of,
        )
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")
    except FollowupPlanNotFoundError:
        raise_not_found("跟单计划不存在")
    except ValueError:
        raise_unprocessable("采购跟单数据无效")


@router.get(
    "/overdue-nodes",
    response_model=ApiResponse[PurchaseFollowOverdueNodeListResponse],
)
async def list_overdue_followup_nodes(
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
    as_of: Annotated[date, Query()],
) -> ApiResponse[PurchaseFollowOverdueNodeListResponse]:
    try:
        overdue = await service.scan_overdue_nodes(current_user=user, as_of=as_of)
        return ApiResponse(data=overdue)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")


@router.post("/sample-events", response_model=ApiResponse[PurchaseFollowPlanResponse])
async def sync_followup_sample_events(
    payload: PurchaseFollowPlanGenerateFromContract,
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    try:
        plan = await service.sync_sample_followup_events(
            current_user=user,
            purchase_contract_id=payload.purchase_contract_id,
        )
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")
    except FollowupPlanNotFoundError:
        raise_not_found("跟单计划不存在")


@router.post("/source-events", response_model=ApiResponse[PurchaseFollowPlanResponse])
async def sync_followup_source_event(
    payload: FollowSourceEventSync,
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    try:
        plan = await service.sync_source_event(current_user=user, payload=payload)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")
    except FollowupPlanNotFoundError:
        raise_not_found("跟单计划不存在")
    except FollowupNodeNotFoundError:
        raise_not_found("跟单节点不存在")


@router.get("/{plan_id}", response_model=ApiResponse[PurchaseFollowPlanResponse])
async def get_followup_plan(
    plan_id: str,
    user: CurrentUserDep,
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    try:
        plan = await service.get_plan(current_user=user, plan_id=plan_id)
        return ApiResponse(data=plan)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购跟单权限")
    except FollowupPlanNotFoundError:
        raise_not_found("跟单计划不存在")
