from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
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
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sales/shipments", tags=["shipments"])


@router.get("", response_model=ApiResponse[ShipmentPlanListResponse])
async def list_shipments(
    user: CurrentUserDep,
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ShipmentPlanListResponse]:
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
        raise_permission_denied("缺少出货明细权限")
    except ValueError:
        raise_unprocessable("出货明细数据无效")


@router.post(
    "/from-contracts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ShipmentPlanResponse],
)
async def generate_shipment_from_contracts(
    payload: ShipmentPlanGenerate,
    user: CurrentUserDep,
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    try:
        shipment = await service.generate_from_contracts(
            current_user=user,
            payload=payload,
        )
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        raise_permission_denied("缺少出货明细权限")
    except ShipmentNotFoundError:
        raise_not_found("出货明细不存在")
    except ValueError:
        raise_unprocessable("出货明细数据无效")


@router.get("/reminders", response_model=ApiResponse[ShipmentReminderListResponse])
async def list_shipment_reminders(
    user: CurrentUserDep,
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentReminderListResponse]:
    try:
        reminders = await service.list_reminders(current_user=user)
        return ApiResponse(data=reminders)
    except PermissionDeniedError:
        raise_permission_denied("缺少出货明细权限")


@router.get("/{shipment_id}", response_model=ApiResponse[ShipmentPlanResponse])
async def get_shipment(
    shipment_id: str,
    user: CurrentUserDep,
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    try:
        shipment = await service.get_shipment(current_user=user, shipment_id=shipment_id)
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        raise_permission_denied("缺少出货明细权限")
    except ShipmentNotFoundError:
        raise_not_found("出货明细不存在")


@router.post("/{shipment_id}/submit", response_model=ApiResponse[ShipmentPlanResponse])
async def submit_shipment(
    shipment_id: str,
    user: CurrentUserDep,
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    try:
        shipment = await service.submit_shipment(
            current_user=user,
            shipment_id=shipment_id,
        )
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        raise_permission_denied("缺少出货明细权限")
    except ShipmentNotFoundError:
        raise_not_found("出货明细不存在")
    except ValueError:
        raise_unprocessable("出货明细数据无效")


@router.post("/{shipment_id}/approve", response_model=ApiResponse[ShipmentPlanResponse])
async def approve_shipment(
    shipment_id: str,
    payload: ShipmentApprove,
    user: CurrentUserDep,
    service: Annotated[ShipmentPlanService, Depends(get_shipment_plan_service)],
) -> ApiResponse[ShipmentPlanResponse]:
    try:
        shipment = await service.approve_shipment(
            current_user=user,
            shipment_id=shipment_id,
            payload=payload,
        )
        return ApiResponse(data=shipment)
    except PermissionDeniedError:
        raise_permission_denied("缺少出货明细权限")
    except ShipmentNotFoundError:
        raise_not_found("出货明细不存在")
    except ValueError:
        raise_unprocessable("出货明细数据无效")
