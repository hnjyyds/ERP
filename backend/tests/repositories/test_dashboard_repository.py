from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.dashboard.repositories import DashboardRepository, ScheduleEventRow
from app.modules.system.dashboard.seed import seed_dashboard_demo_data


async def test_dashboard_repository_returns_typed_schedule_rows(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_dashboard_demo_data(session, user_id="u-001")
        repository = DashboardRepository(session)

        rows = await repository.list_schedule_events(user_id="u-001")

    assert rows
    assert isinstance(rows[0], ScheduleEventRow)
    assert rows[0].owner_user_id == "u-001"
