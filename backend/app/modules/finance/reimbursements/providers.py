from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.reimbursements.repositories import ReimbursementRepository
from app.modules.finance.reimbursements.services import ReimbursementService


def get_reimbursement_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ReimbursementService:
    return ReimbursementService(ReimbursementRepository(session))
