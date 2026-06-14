from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.overview.repositories import FinanceOverviewRepository
from app.modules.finance.overview.services import FinanceOverviewService


def get_finance_overview_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FinanceOverviewService:
    return FinanceOverviewService(FinanceOverviewRepository(session))
