from datetime import UTC, datetime

from app.db.uow import UnitOfWork
from app.modules.system.dashboard.repositories import (
    AnnouncementRow,
    DashboardRepository,
    NotificationRow,
    ScheduleEventRow,
    ShortcutRow,
    TodoTaskRow,
)
from app.modules.system.dashboard.schemas import (
    AnnouncementResponse,
    DashboardResponse,
    DashboardSummary,
    NotificationResponse,
    ScheduleCreate,
    ScheduleEventResponse,
    ShortcutResponse,
    TodoTaskResponse,
)


class DashboardService:
    def __init__(self, repository: DashboardRepository) -> None:
        self._repository = repository

    async def get_dashboard(self, *, user_id: str) -> DashboardResponse:
        announcements = await self._repository.list_announcements()
        todos = await self._repository.list_todos(user_id=user_id)
        notifications = await self._repository.list_notifications(user_id=user_id)
        schedule_events = await self._repository.list_schedule_events(user_id=user_id)
        shortcuts = await self._repository.list_shortcuts(user_id=user_id)

        return DashboardResponse(
            announcements=[self._announcement_response(row) for row in announcements],
            todos=[self._todo_response(row) for row in todos],
            notifications=[self._notification_response(row) for row in notifications],
            schedule_events=[self._schedule_response(row) for row in schedule_events],
            shortcuts=[self._shortcut_response(row) for row in shortcuts],
            summary=DashboardSummary(
                announcement_count=len(announcements),
                todo_count=len(todos),
                unread_notification_count=len([item for item in notifications if not item.is_read]),
                today_schedule_count=len(schedule_events),
                shortcut_count=len(shortcuts),
            ),
        )

    async def create_schedule_event(
        self,
        *,
        user_id: str,
        payload: ScheduleCreate,
    ) -> ScheduleEventResponse:
        async with UnitOfWork(self._repository.session):
            row = await self._repository.create_schedule_event(
                user_id=user_id,
                title=payload.title,
                description=payload.description,
                starts_at=payload.starts_at,
                ends_at=payload.ends_at,
                created_at=datetime.now(UTC),
            )
        return self._schedule_response(row)

    def _announcement_response(self, row: AnnouncementRow) -> AnnouncementResponse:
        return AnnouncementResponse(
            id=row.id,
            title=row.title,
            content=row.content,
            published_at=row.published_at,
        )

    def _todo_response(self, row: TodoTaskRow) -> TodoTaskResponse:
        return TodoTaskResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            title=row.title,
            source_type=row.source_type,
            source_id=row.source_id,
            due_at=row.due_at,
            status=row.status,
        )

    def _notification_response(self, row: NotificationRow) -> NotificationResponse:
        return NotificationResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            title=row.title,
            message=row.message,
            severity=row.severity,
            is_read=row.is_read,
            created_at=row.created_at,
        )

    def _schedule_response(self, row: ScheduleEventRow) -> ScheduleEventResponse:
        return ScheduleEventResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            title=row.title,
            description=row.description,
            starts_at=row.starts_at,
            ends_at=row.ends_at,
            created_at=row.created_at,
        )

    def _shortcut_response(self, row: ShortcutRow) -> ShortcutResponse:
        return ShortcutResponse(
            id=row.id,
            owner_user_id=row.owner_user_id,
            label=row.label,
            target_path=row.target_path,
            icon=row.icon,
            sort_order=row.sort_order,
        )
