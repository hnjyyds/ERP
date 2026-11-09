from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.auth_dependencies import CurrentUserDep
from app.api.permission_dependencies import require_permissions
from app.modules.system.audit_logs.filters import AuditLogFilters
from app.modules.system.audit_logs.providers import get_audit_log_service
from app.modules.system.audit_logs.schemas import (
    AuditLogExportResponse,
    AuditLogListResponse,
)
from app.modules.system.audit_logs.services import (
    AuditLogPermissionDeniedError,
    AuditLogService,
)
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

_AUDIT_ADMIN = Depends(
    require_permissions(
        SUPER_ADMIN_PERMISSION,
        error=AuditLogPermissionDeniedError,
    )
)


def _filters(
    created_from: datetime | None,
    created_to: datetime | None,
    actor: str | None,
    resource_type: str | None,
    action: str | None,
    keyword: str | None,
) -> AuditLogFilters:
    return AuditLogFilters(
        created_from=created_from,
        created_to=created_to,
        actor=actor,
        resource_type=resource_type,
        action=action,
        keyword=keyword,
    )


@router.get(
    "",
    response_model=ApiResponse[AuditLogListResponse],
    dependencies=[_AUDIT_ADMIN],
)
async def list_audit_logs(
    current_user: CurrentUserDep,
    service: Annotated[AuditLogService, Depends(get_audit_log_service)],
    created_from: Annotated[datetime | None, Query(description="起始时间（含）。")] = None,
    created_to: Annotated[datetime | None, Query(description="结束时间（含）。")] = None,
    actor: Annotated[str | None, Query(max_length=120, description="操作人 ID 或姓名。")] = None,
    resource_type: Annotated[str | None, Query(max_length=60, description="模块。")] = None,
    action: Annotated[str | None, Query(max_length=40, description="动作。")] = None,
    keyword: Annotated[str | None, Query(max_length=120, description="单号关键字。")] = None,
) -> ApiResponse[AuditLogListResponse]:
    result = await service.list_logs(
        current_user=current_user,
        filters=_filters(created_from, created_to, actor, resource_type, action, keyword),
    )
    return ApiResponse(data=result)


@router.get(
    "/export",
    response_model=ApiResponse[AuditLogExportResponse],
    dependencies=[_AUDIT_ADMIN],
)
async def export_audit_logs(
    current_user: CurrentUserDep,
    service: Annotated[AuditLogService, Depends(get_audit_log_service)],
    created_from: Annotated[datetime | None, Query(description="起始时间（含）。")] = None,
    created_to: Annotated[datetime | None, Query(description="结束时间（含）。")] = None,
    actor: Annotated[str | None, Query(max_length=120, description="操作人 ID 或姓名。")] = None,
    resource_type: Annotated[str | None, Query(max_length=60, description="模块。")] = None,
    action: Annotated[str | None, Query(max_length=40, description="动作。")] = None,
    keyword: Annotated[str | None, Query(max_length=120, description="单号关键字。")] = None,
) -> ApiResponse[AuditLogExportResponse]:
    export = await service.export_csv(
        current_user=current_user,
        filters=_filters(created_from, created_to, actor, resource_type, action, keyword),
    )
    return ApiResponse(data=export)
