from datetime import UTC, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import resolve_limit, resolve_offset
from app.modules.system.audit_logs.filters import AuditLogFilters
from app.modules.system.audit_logs.models import AuditLog
from app.modules.system.audit_logs.rows import AuditLogRow


def _to_utc_naive(value: datetime) -> datetime:
    return value.astimezone(UTC).replace(tzinfo=None) if value.tzinfo else value


class AuditLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_logs(
        self,
        filters: AuditLogFilters,
        *,
        limit: int | None = None,
        offset: int | None = None,
    ) -> tuple[list[AuditLogRow], int]:
        statement = self._apply_filters(select(AuditLog), filters)
        count_statement = self._apply_filters(select(func.count()).select_from(AuditLog), filters)
        total = int(await self.session.scalar(count_statement) or 0)
        statement = (
            statement.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = (await self.session.scalars(statement)).all()
        return [self._map(row) for row in rows], total

    async def list_all(self, filters: AuditLogFilters) -> list[AuditLogRow]:
        statement = self._apply_filters(select(AuditLog), filters).order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        rows = (await self.session.scalars(statement)).all()
        return [self._map(row) for row in rows]

    def _apply_filters(
        self,
        statement: Select[tuple[AuditLog]],
        filters: AuditLogFilters,
    ) -> Select[tuple[AuditLog]]:
        if filters.created_from is not None:
            statement = statement.where(
                AuditLog.created_at >= _to_utc_naive(filters.created_from)
            )
        if filters.created_to is not None:
            statement = statement.where(AuditLog.created_at <= _to_utc_naive(filters.created_to))
        if filters.actor:
            keyword = f"%{filters.actor.strip()}%"
            statement = statement.where(
                or_(
                    AuditLog.actor_user_id == filters.actor.strip(),
                    AuditLog.actor_name.ilike(keyword),
                )
            )
        if filters.resource_type:
            statement = statement.where(AuditLog.resource_type == filters.resource_type)
        if filters.action:
            statement = statement.where(AuditLog.action == filters.action)
        if filters.keyword:
            statement = statement.where(AuditLog.resource_no.ilike(f"%{filters.keyword.strip()}%"))
        return statement

    def _map(self, row: AuditLog) -> AuditLogRow:
        return AuditLogRow(
            id=row.id,
            actor_user_id=row.actor_user_id,
            actor_name=row.actor_name,
            action=row.action,
            resource_type=row.resource_type,
            resource_id=row.resource_id,
            resource_no=row.resource_no,
            summary=row.summary,
            payload=row.payload,
            created_at=row.created_at,
        )
