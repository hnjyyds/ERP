from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.modules.system.dashboard.providers import get_dashboard_service
from app.modules.system.dashboard.schemas import (
    AnnouncementCreate,
    AnnouncementResponse,
    DashboardResponse,
    NotificationPath,
    NotificationResponse,
    ScheduleCreate,
    ScheduleEventPath,
    ScheduleEventResponse,
    ShortcutCreate,
    ShortcutPath,
    ShortcutResponse,
)
from app.modules.system.dashboard.services import DashboardService
from app.schemas.responses import ApiResponse

router = APIRouter(tags=["dashboard"])

ANNOUNCEMENT_CREATE_PERMISSION = "announcement:create"
ADMIN_ROLE_NAMES = {"管理员", "admin", "administrator"}


def _can_create_announcement(user: CurrentUserResponse) -> bool:
    normalized_roles = {role.strip().lower() for role in user.roles}
    return (
        ANNOUNCEMENT_CREATE_PERMISSION in user.permissions
        or bool(ADMIN_ROLE_NAMES.intersection(normalized_roles))
    )


def _resolve_schedule_event_path(
    schedule_id: Annotated[str, Path(min_length=1, max_length=80)],
) -> ScheduleEventPath:
    return ScheduleEventPath(schedule_id=schedule_id)


def _resolve_notification_path(
    notification_id: Annotated[str, Path(min_length=1, max_length=80)],
) -> NotificationPath:
    return NotificationPath(notification_id=notification_id)


def _resolve_shortcut_path(
    shortcut_id: Annotated[str, Path(min_length=1, max_length=80)],
) -> ShortcutPath:
    return ShortcutPath(shortcut_id=shortcut_id)


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


@router.delete("/schedules/{schedule_id}", response_model=ApiResponse[ScheduleEventResponse])
async def delete_schedule_event(
    path: Annotated[ScheduleEventPath, Depends(_resolve_schedule_event_path)],
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[ScheduleEventResponse]:
    try:
        current = await auth_service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None
    schedule_event = await service.delete_schedule_event(
        user_id=current.user.id,
        schedule_id=path.schedule_id,
    )
    if schedule_event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日程不存在")
    return ApiResponse(data=schedule_event)


@router.post(
    "/announcements",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[AnnouncementResponse],
)
async def create_announcement(
    payload: AnnouncementCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AnnouncementResponse]:
    try:
        current = await auth_service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None
    if not _can_create_announcement(current.user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权限发布公告")
    announcement = await service.create_announcement(payload=payload)
    return ApiResponse(data=announcement)


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=ApiResponse[NotificationResponse],
)
async def mark_notification_read(
    path: Annotated[NotificationPath, Depends(_resolve_notification_path)],
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[NotificationResponse]:
    try:
        current = await auth_service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None
    notification = await service.mark_notification_read(
        user_id=current.user.id,
        notification_id=path.notification_id,
    )
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="提醒不存在")
    return ApiResponse(data=notification)


@router.post(
    "/shortcuts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ShortcutResponse],
)
async def create_shortcut(
    payload: ShortcutCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[ShortcutResponse]:
    try:
        current = await auth_service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None
    shortcut = await service.create_shortcut(user_id=current.user.id, payload=payload)
    return ApiResponse(data=shortcut)


@router.delete("/shortcuts/{shortcut_id}", response_model=ApiResponse[ShortcutResponse])
async def delete_shortcut(
    path: Annotated[ShortcutPath, Depends(_resolve_shortcut_path)],
    token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[ShortcutResponse]:
    try:
        current = await auth_service.get_current_user(token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None
    shortcut = await service.delete_shortcut(user_id=current.user.id, shortcut_id=path.shortcut_id)
    if shortcut is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="快捷入口不存在")
    return ApiResponse(data=shortcut)
