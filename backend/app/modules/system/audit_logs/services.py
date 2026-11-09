import csv
from datetime import UTC, datetime
from io import StringIO

from app.modules.system.audit_logs.filters import AuditLogFilters
from app.modules.system.audit_logs.repositories import AuditLogRepository
from app.modules.system.audit_logs.rows import AuditLogRow
from app.modules.system.audit_logs.schemas import (
    AuditLogExportResponse,
    AuditLogListResponse,
    AuditLogResponse,
)
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
from app.modules.system.auth.schemas import CurrentUserResponse


class AuditLogPermissionDeniedError(Exception):
    pass


class AuditLogService:
    def __init__(self, repository: AuditLogRepository) -> None:
        self._repository = repository

    async def list_logs(
        self,
        *,
        current_user: CurrentUserResponse,
        filters: AuditLogFilters,
        limit: int | None = None,
        offset: int | None = None,
    ) -> AuditLogListResponse:
        self._require_super_admin(current_user)
        rows, total = await self._repository.list_logs(filters, limit=limit, offset=offset)
        return AuditLogListResponse(
            items=[self._response(row) for row in rows],
            total=total,
        )

    async def export_csv(
        self,
        *,
        current_user: CurrentUserResponse,
        filters: AuditLogFilters,
    ) -> AuditLogExportResponse:
        self._require_super_admin(current_user)
        rows = await self._repository.list_all(filters)
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["时间", "操作人", "动作", "模块", "单号", "摘要", "资源 ID", "附加信息"])
        for row in rows:
            writer.writerow(
                [
                    row.created_at.isoformat(sep=" ", timespec="seconds"),
                    row.actor_name,
                    row.action,
                    row.resource_type,
                    row.resource_no or "",
                    row.summary,
                    row.resource_id or "",
                    row.payload or "",
                ]
            )
        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        return AuditLogExportResponse(
            filename=f"audit-logs-{timestamp}.csv",
            content_type="text/csv",
            content=output.getvalue(),
        )

    def _require_super_admin(self, current_user: CurrentUserResponse) -> None:
        if SUPER_ADMIN_PERMISSION not in current_user.permissions:
            raise AuditLogPermissionDeniedError

    def _response(self, row: AuditLogRow) -> AuditLogResponse:
        return AuditLogResponse(
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
