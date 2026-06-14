from dataclasses import dataclass
from datetime import datetime
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
    title: str
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
        return [
            TodoTaskRow(
                id=item.id,
                owner_user_id=item.owner_user_id,
                title=item.title,
                source_type=item.source_type,
                source_id=item.source_id,
                due_at=item.due_at,
                status=item.status,
            )
            for item in await self._scalars(statement)
        ]

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

    async def _scalars(self, statement: Select[tuple[ModelT]]) -> list[ModelT]:
        result = await self.session.scalars(statement)
        return list(result)

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
