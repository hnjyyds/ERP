from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

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


async def test_today_schedule_count_uses_local_day(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    time_zone = ZoneInfo("Asia/Shanghai")
    today = datetime.now(time_zone).date()

    def utc_naive(day, hour: int) -> datetime:
        local = datetime.combine(day, time(hour=hour), tzinfo=time_zone)
        return local.astimezone(UTC).replace(tzinfo=None)

    async with session_factory() as session:
        repository = DashboardRepository(session)
        # 昨天 12:00、昨天 23:00 跨到今天 01:00、今天 12:00、明天 12:00
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        for title, starts_at, ends_at in (
            ("昨天日程", utc_naive(yesterday, 12), utc_naive(yesterday, 13)),
            ("跨日日程", utc_naive(yesterday, 23), utc_naive(today, 1)),
            ("今日日程", utc_naive(today, 12), utc_naive(today, 13)),
            ("明天日程", utc_naive(tomorrow, 12), utc_naive(tomorrow, 13)),
        ):
            await repository.create_schedule_event(
                user_id="u-schedule",
                title=title,
                description=None,
                starts_at=starts_at,
                ends_at=ends_at,
                created_at=starts_at,
            )

        service = DashboardService(repository, DashboardBusinessTaskRepository(session))
        dashboard = await service.get_dashboard(
            current_user=CurrentUserResponse(
                id="u-schedule",
                username="schedule",
                display_name="日程用户",
                department_name="业务部",
                roles=["业务员"],
                permissions=["dashboard:view"],
            )
        )

    # “我的日程”仍返回全部事件，只有“今日日程”计数按本地自然日过滤。
    assert [event.title for event in dashboard.schedule_events] == [
        "昨天日程",
        "跨日日程",
        "今日日程",
        "明天日程",
    ]
    assert dashboard.summary.today_schedule_count == 2
