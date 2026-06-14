from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
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
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/followup", tags=["followup"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少采购跟单权限")


def _raise_invalid_followup() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="采购跟单数据无效",
    )


def _raise_template_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="跟单模板不存在")


def _raise_plan_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="跟单计划不存在")


def _raise_node_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="跟单节点不存在")


@router.get("/templates", response_model=ApiResponse[FollowProcessTemplateListResponse])
async def list_followup_templates(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[FollowProcessTemplateListResponse]:
    user = await _current_user(token, auth_service)
    try:
        templates = await service.list_templates(current_user=user)
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=templates)


@router.post(
    "/templates",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FollowProcessTemplateResponse],
)
async def create_followup_template(
    payload: FollowProcessTemplateCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[FollowProcessTemplateResponse]:
    user = await _current_user(token, auth_service)
    try:
        template = await service.create_template(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=template)


@router.put(
    "/templates/{template_id}",
    response_model=ApiResponse[FollowProcessTemplateResponse],
)
async def update_followup_template(
    template_id: str,
    payload: FollowProcessTemplateCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[FollowProcessTemplateResponse]:
    user = await _current_user(token, auth_service)
    try:
        template = await service.update_template(
            current_user=user,
            template_id=template_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except FollowupTemplateNotFoundError:
        _raise_template_not_found()
    return ApiResponse(data=template)


@router.get("/plans", response_model=ApiResponse[PurchaseFollowPlanListResponse])
async def list_followup_plans(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    overall_status: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseFollowPlanListResponse]:
    user = await _current_user(token, auth_service)
    try:
        plans = await service.list_plans(
            current_user=user,
            q=q,
            overall_status=overall_status,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_followup()
    return ApiResponse(data=plans)


@router.post(
    "/plans/from-purchase-contract",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseFollowPlanResponse],
)
async def generate_followup_plan_from_purchase_contract(
    payload: PurchaseFollowPlanGenerateFromContract,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.generate_plan_from_purchase_contract(
            current_user=user,
            purchase_contract_id=payload.purchase_contract_id,
            as_of=payload.as_of,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except FollowupPlanNotFoundError:
        _raise_plan_not_found()
    except ValueError:
        _raise_invalid_followup()
    return ApiResponse(data=plan)


@router.get(
    "/overdue-nodes",
    response_model=ApiResponse[PurchaseFollowOverdueNodeListResponse],
)
async def list_overdue_followup_nodes(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
    as_of: Annotated[date, Query()],
) -> ApiResponse[PurchaseFollowOverdueNodeListResponse]:
    user = await _current_user(token, auth_service)
    try:
        overdue = await service.scan_overdue_nodes(current_user=user, as_of=as_of)
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=overdue)


@router.post("/sample-events", response_model=ApiResponse[PurchaseFollowPlanResponse])
async def sync_followup_sample_events(
    payload: PurchaseFollowPlanGenerateFromContract,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.sync_sample_followup_events(
            current_user=user,
            purchase_contract_id=payload.purchase_contract_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except FollowupPlanNotFoundError:
        _raise_plan_not_found()
    return ApiResponse(data=plan)


@router.post("/source-events", response_model=ApiResponse[PurchaseFollowPlanResponse])
async def sync_followup_source_event(
    payload: FollowSourceEventSync,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.sync_source_event(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except FollowupPlanNotFoundError:
        _raise_plan_not_found()
    except FollowupNodeNotFoundError:
        _raise_node_not_found()
    return ApiResponse(data=plan)


@router.get("/{plan_id}", response_model=ApiResponse[PurchaseFollowPlanResponse])
async def get_followup_plan(
    plan_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FollowupService, Depends(get_followup_service)],
) -> ApiResponse[PurchaseFollowPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        plan = await service.get_plan(current_user=user, plan_id=plan_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except FollowupPlanNotFoundError:
        _raise_plan_not_found()
    return ApiResponse(data=plan)
