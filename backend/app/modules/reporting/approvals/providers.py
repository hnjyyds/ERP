from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.reporting.approvals.repositories import ApprovalQueryRepository
from app.modules.reporting.approvals.services import ApprovalQueryService


def get_approval_query_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ApprovalQueryService:
    return ApprovalQueryService(ApprovalQueryRepository(session))
