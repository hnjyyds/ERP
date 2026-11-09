from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.system.audit_logs.repositories import AuditLogRepository
from app.modules.system.audit_logs.services import AuditLogService


async def get_audit_log_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AuditLogService:
    return AuditLogService(AuditLogRepository(session))
