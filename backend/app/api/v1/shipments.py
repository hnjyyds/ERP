from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.sales.shipments.providers import get_shipment_plan_service
from app.modules.sales.shipments.schemas import (
    ShipmentApprove,
    ShipmentPlanGenerate,
    ShipmentPlanListResponse,
    ShipmentPlanResponse,
    ShipmentReminderListResponse,
)
from app.modules.sales.shipments.services import (
    PermissionDeniedError,
    ShipmentNotFoundError,
    ShipmentPlanService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sales/shipments", tags=["shipments"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少出货明细权限")


def _raise_invalid_shipment() -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="出货明细数据无效",
    )


def _raise_shipment_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="出货明细不存在")


@router.get("", response_model=ApiResponse[ShipmentPlanListResponse])
async def list_shipments(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ShipmentPlanListResponse]:
    user = await _current_user(token, auth_service)
    try:
        shipments = await service.list_shipments(
            current_user=user,
            q=q,
            approval_status=approval_status,
            customer_id=customer_id,
            contract_id=contract_id,
        )
        return ApiResponse(data=shipments)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_shipment()


@router.post(
    "/from-contracts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ShipmentPlanResponse],
)
async def generate_shipment_from_contracts(
    payload: ShipmentPlanGenerate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        shipment = await service.generate_from_contracts(
            current_user=user,
            payload=payload,
        )
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ShipmentNotFoundError:
        _raise_shipment_not_found()
    except ValueError:
        _raise_invalid_shipment()


@router.get("/reminders", response_model=ApiResponse[ShipmentReminderListResponse])
async def list_shipment_reminders(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentReminderListResponse]:
    user = await _current_user(token, auth_service)
    try:
        reminders = await service.list_reminders(current_user=user)
        return ApiResponse(data=reminders)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/{shipment_id}", response_model=ApiResponse[ShipmentPlanResponse])
async def get_shipment(
    shipment_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        shipment = await service.get_shipment(current_user=user, shipment_id=shipment_id)
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ShipmentNotFoundError:
        _raise_shipment_not_found()


@router.post("/{shipment_id}/submit", response_model=ApiResponse[ShipmentPlanResponse])
async def submit_shipment(
    shipment_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        shipment = await service.submit_shipment(
            current_user=user,
            shipment_id=shipment_id,
        )
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ShipmentNotFoundError:
        _raise_shipment_not_found()
    except ValueError:
        _raise_invalid_shipment()


@router.post("/{shipment_id}/approve", response_model=ApiResponse[ShipmentPlanResponse])
async def approve_shipment(
    shipment_id: str,
    payload: ShipmentApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    user = await _current_user(token, auth_service)
    try:
        shipment = await service.approve_shipment(
            current_user=user,
            shipment_id=shipment_id,
            payload=payload,
        )
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ShipmentNotFoundError:
        _raise_shipment_not_found()
    except ValueError:
        _raise_invalid_shipment()
