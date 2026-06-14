from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.reporting.statistics.repositories import StatisticsQueryRepository
from app.modules.reporting.statistics.services import ReportingStatisticsService


def get_reporting_statistics_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ReportingStatisticsService:
    return ReportingStatisticsService(StatisticsQueryRepository(session))
