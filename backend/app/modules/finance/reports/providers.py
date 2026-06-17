from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.reports.repositories import ReportsRepository
from app.modules.finance.reports.services import ReportsService


def get_finance_reports_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ReportsService:
    return ReportsService(ReportsRepository(session))
