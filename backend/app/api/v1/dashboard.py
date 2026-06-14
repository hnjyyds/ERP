from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.modules.system.dashboard.providers import get_dashboard_service
from app.modules.system.dashboard.schemas import (
    DashboardResponse,
    ScheduleCreate,
    ScheduleEventResponse,
)
from app.modules.system.dashboard.services import DashboardService
from app.schemas.responses import ApiResponse

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=ApiResponse[DashboardResponse])
async def get_dashboard(
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[DashboardResponse]:
    try:
        current = await auth_service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None
    dashboard = await service.get_dashboard(user_id=current.user.id)
    return ApiResponse(data=dashboard)


@router.post(
    "/schedules",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ScheduleEventResponse],
)
async def create_schedule_event(
    payload: ScheduleCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[ScheduleEventResponse]:
    try:
        current = await auth_service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None
    schedule_event = await service.create_schedule_event(user_id=current.user.id, payload=payload)
    return ApiResponse(data=schedule_event)
