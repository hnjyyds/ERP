from dataclasses import dataclass
from datetime import datetime
from typing import Sequence
from typing import TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.dashboard.models import (
    CompanyAnnouncement,
    DashboardShortcut,
    Notification,
    ScheduleEvent,
    TodoTask,
)

ModelT = TypeVar("ModelT")


@dataclass(frozen=True)
class AnnouncementRow:
    id: str
    title: str
    content: str
    published_at: datetime


@dataclass(frozen=True)
class TodoTaskRow:
    id: str
    owner_user_id: str
    owner_user_name: str | None
    creator_user_id: str | None
    creator_user_name: str | None
    title: str
    content: str
    source_type: str
    source_id: str | None
    due_at: datetime | None
    status: str


@dataclass(frozen=True)
class NotificationRow:
    id: str
    owner_user_id: str
    title: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime


@dataclass(frozen=True)
class ScheduleEventRow:
    id: str
    owner_user_id: str
    title: str
    description: str | None
    starts_at: datetime
    ends_at: datetime
    created_at: datetime


@dataclass(frozen=True)
class ShortcutRow:
    id: str
    owner_user_id: str
    label: str
    target_path: str
    icon: str
    sort_order: int


@dataclass(frozen=True)
class TodoAssigneeRow:
    user_id: str
    display_name: str


class DashboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def has_dashboard_data(self, user_id: str) -> bool:
        result = await self.session.scalar(
            select(func.count()).select_from(TodoTask).where(TodoTask.owner_user_id == user_id)
        )
        return bool(result)

    async def list_announcements(self) -> list[AnnouncementRow]:
        statement = (
            select(CompanyAnnouncement)
            .where(CompanyAnnouncement.is_active.is_(True))
            .order_by(CompanyAnnouncement.published_at.desc())
        )
        return [
            AnnouncementRow(
                id=item.id,
                title=item.title,
                content=item.content,
                published_at=item.published_at,
            )
            for item in await self._scalars(statement)
        ]

    async def list_todos(self, user_id: str) -> list[TodoTaskRow]:
        statement = (
            select(TodoTask)
            .where(TodoTask.owner_user_id == user_id)
            .order_by(TodoTask.due_at.asc().nulls_last(), TodoTask.id.asc())
        )
        return [self._map_todo_task(item) for item in await self._scalars(statement)]

    async def list_notifications(self, user_id: str) -> list[NotificationRow]:
        statement = (
            select(Notification)
            .where(Notification.owner_user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        return [
            NotificationRow(
                id=item.id,
                owner_user_id=item.owner_user_id,
                title=item.title,
                message=item.message,
                severity=item.severity,
                is_read=item.is_read,
                created_at=item.created_at,
            )
            for item in await self._scalars(statement)
        ]

    async def list_schedule_events(self, user_id: str) -> list[ScheduleEventRow]:
        statement = (
            select(ScheduleEvent)
            .where(ScheduleEvent.owner_user_id == user_id)
            .order_by(ScheduleEvent.starts_at.asc())
        )
        return [self._map_schedule_event(item) for item in await self._scalars(statement)]

    async def list_shortcuts(self, user_id: str) -> list[ShortcutRow]:
        statement = (
            select(DashboardShortcut)
            .where(DashboardShortcut.owner_user_id == user_id)
            .order_by(DashboardShortcut.sort_order.asc(), DashboardShortcut.label.asc())
        )
        return [
            ShortcutRow(
                id=item.id,
                owner_user_id=item.owner_user_id,
                label=item.label,
                target_path=item.target_path,
                icon=item.icon,
                sort_order=item.sort_order,
            )
            for item in await self._scalars(statement)
        ]

    async def create_schedule_event(
        self,
        *,
        user_id: str,
        title: str,
        description: str | None,
        starts_at: datetime,
        ends_at: datetime,
        created_at: datetime,
    ) -> ScheduleEventRow:
        event = ScheduleEvent(
            owner_user_id=user_id,
            title=title,
            description=description,
            starts_at=starts_at,
            ends_at=ends_at,
            created_at=created_at,
        )
        self.session.add(event)
        await self.session.flush()
        return self._map_schedule_event(event)

    async def delete_schedule_event(
        self,
        *,
        user_id: str,
        schedule_id: str,
    ) -> ScheduleEventRow | None:
        event = await self.session.scalar(
            select(ScheduleEvent).where(
                ScheduleEvent.id == schedule_id,
                ScheduleEvent.owner_user_id == user_id,
            )
        )
        if event is None:
            return None
        row = self._map_schedule_event(event)
        await self.session.delete(event)
        await self.session.flush()
        return row

    async def create_announcement(
        self,
        *,
        title: str,
        content: str,
        published_at: datetime,
    ) -> AnnouncementRow:
        announcement = CompanyAnnouncement(
            title=title,
            content=content,
            published_at=published_at,
            is_active=True,
        )
        self.session.add(announcement)
        await self.session.flush()
        return self._map_announcement(announcement)

    async def create_todo_tasks(
        self,
        *,
        title: str,
        content: str,
        creator_user_id: str,
        creator_user_name: str,
        assignees: Sequence[TodoAssigneeRow],
        due_at: datetime | None = None,
    ) -> list[TodoTaskRow]:
        tasks = [
            TodoTask(
                owner_user_id=assignee.user_id,
                owner_user_name=assignee.display_name,
                creator_user_id=creator_user_id,
                creator_user_name=creator_user_name,
                title=title,
                content=content,
                source_type="manual",
                source_id=None,
                due_at=due_at,
                status="pending",
            )
            for assignee in assignees
        ]
        self.session.add_all(tasks)
        await self.session.flush()
        return [self._map_todo_task(task) for task in tasks]

    async def mark_notification_read(
        self,
        *,
        user_id: str,
        notification_id: str,
    ) -> NotificationRow | None:
        notification = await self.session.scalar(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.owner_user_id == user_id,
            )
        )
        if notification is None:
            return None
        notification.is_read = True
        await self.session.flush()
        return self._map_notification(notification)

    async def create_shortcut(
        self,
        *,
        user_id: str,
        label: str,
        target_path: str,
        icon: str,
        sort_order: int,
    ) -> ShortcutRow:
        shortcut = DashboardShortcut(
            owner_user_id=user_id,
            label=label,
            target_path=target_path,
            icon=icon,
            sort_order=sort_order,
        )
        self.session.add(shortcut)
        await self.session.flush()
        return self._map_shortcut(shortcut)

    async def delete_shortcut(self, *, user_id: str, shortcut_id: str) -> ShortcutRow | None:
        shortcut = await self.session.scalar(
            select(DashboardShortcut).where(
                DashboardShortcut.id == shortcut_id,
                DashboardShortcut.owner_user_id == user_id,
            )
        )
        if shortcut is None:
            return None
        row = self._map_shortcut(shortcut)
        await self.session.delete(shortcut)
        await self.session.flush()
        return row

    async def _scalars(self, statement: Select[tuple[ModelT]]) -> list[ModelT]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_announcement(self, item: CompanyAnnouncement) -> AnnouncementRow:
        return AnnouncementRow(
            id=item.id,
            title=item.title,
            content=item.content,
            published_at=item.published_at,
        )

    def _map_todo_task(self, item: TodoTask) -> TodoTaskRow:
        return TodoTaskRow(
            id=item.id,
            owner_user_id=item.owner_user_id,
            owner_user_name=item.owner_user_name,
            creator_user_id=item.creator_user_id,
            creator_user_name=item.creator_user_name,
            title=item.title,
            content=item.content,
            source_type=item.source_type,
            source_id=item.source_id,
            due_at=item.due_at,
            status=item.status,
        )

    def _map_notification(self, item: Notification) -> NotificationRow:
        return NotificationRow(
            id=item.id,
            owner_user_id=item.owner_user_id,
            title=item.title,
            message=item.message,
            severity=item.severity,
            is_read=item.is_read,
            created_at=item.created_at,
        )

    def _map_schedule_event(self, item: ScheduleEvent) -> ScheduleEventRow:
        return ScheduleEventRow(
            id=item.id,
            owner_user_id=item.owner_user_id,
            title=item.title,
            description=item.description,
            starts_at=item.starts_at,
            ends_at=item.ends_at,
            created_at=item.created_at,
        )

    def _map_shortcut(self, item: DashboardShortcut) -> ShortcutRow:
        return ShortcutRow(
            id=item.id,
            owner_user_id=item.owner_user_id,
            label=item.label,
            target_path=item.target_path,
            icon=item.icon,
            sort_order=item.sort_order,
        )
