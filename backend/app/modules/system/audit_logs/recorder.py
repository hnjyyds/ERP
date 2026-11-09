"""审计埋点入口：由服务层在 UnitOfWork 内调用，与业务变更同事务提交。"""

import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.audit_logs.models import AuditLog
from app.modules.system.auth.schemas import CurrentUserResponse


async def record_audit(
    session: AsyncSession,
    actor: CurrentUserResponse,
    action: str,
    resource_type: str,
    resource_id: str | None,
    resource_no: str | None,
    summary: str,
    payload: dict[str, object] | None = None,
) -> None:
    session.add(
        AuditLog(
            actor_user_id=actor.id,
            actor_name=actor.display_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_no=resource_no,
            summary=summary,
            payload=json.dumps(payload, ensure_ascii=False) if payload is not None else None,
        )
    )
    await session.flush()
