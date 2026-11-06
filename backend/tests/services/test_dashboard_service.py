from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.dashboard.business_task_repositories import (
    DashboardBusinessTaskRepository,
)
from app.modules.system.dashboard.repositories import DashboardRepository
from app.modules.system.dashboard.seed import seed_dashboard_demo_data
from app.modules.system.dashboard.services import DashboardService


async def test_dashboard_service_filters_by_current_user(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_dashboard_demo_data(session, user_id="u-001")
        await seed_dashboard_demo_data(session, user_id="u-002")
        service = DashboardService(
            DashboardRepository(session),
            DashboardBusinessTaskRepository(session),
        )

        dashboard = await service.get_dashboard(
            current_user=CurrentUserResponse(
                id="u-001",
                username="demo",
                display_name="演示业务主管",
                department_name="业务部",
                roles=["业务主管"],
                permissions=["dashboard:view"],
            )
        )

    assert dashboard.summary.todo_count == 2
    assert {event.owner_user_id for event in dashboard.schedule_events} == {"u-001"}
