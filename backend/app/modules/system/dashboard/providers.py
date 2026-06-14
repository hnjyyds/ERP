from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.system.dashboard.repositories import DashboardRepository
from app.modules.system.dashboard.services import DashboardService


async def get_dashboard_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DashboardService:
    return DashboardService(repository=DashboardRepository(session))
