from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.dashboard.models import (
    CompanyAnnouncement,
    DashboardShortcut,
    Notification,
    ScheduleEvent,
    TodoTask,
)
from app.modules.system.dashboard.repositories import DashboardRepository


async def seed_dashboard_demo_data(session: AsyncSession, *, user_id: str) -> None:
    repository = DashboardRepository(session)
    if await repository.has_dashboard_data(user_id=user_id):
        return

    timezone = ZoneInfo("Asia/Shanghai")
    published_at = datetime(2026, 6, 13, 9, 0, tzinfo=timezone)
    owner_user_name = {
        "u-001": "演示业务主管",
        "u-finance": "演示财务",
    }.get(user_id)

    existing_announcement = await session.scalar(select(CompanyAnnouncement.id).limit(1))
    if existing_announcement is None:
        session.add(
            CompanyAnnouncement(
                title="外贸业务系统启动",
                content="请关注采购跟单、QC 查验和仓库入出库提醒。",
                published_at=published_at,
                is_active=True,
            )
        )

    session.add_all(
        [
            TodoTask(
                owner_user_id=user_id,
                owner_user_name=owner_user_name,
                creator_user_id="system",
                creator_user_name="系统流程",
                title="审批出口合同 YJ-EC-202606-001",
                content="出口合同已提交审批，请确认合同金额、客户和交期。",
                source_type="approval",
                source_id="YJ-EC-202606-001",
                due_at=datetime(2026, 6, 13, 17, 0, tzinfo=timezone),
                status="pending",
            ),
            TodoTask(
                owner_user_id=user_id,
                owner_user_name=owner_user_name,
                creator_user_id="system",
                creator_user_name="系统流程",
                title="跟进采购合同确认样提交",
                content="确认样提交节点即将到期，请跟进供应商反馈。",
                source_type="followup",
                source_id="YJ-PC-202606-001",
                due_at=datetime(2026, 6, 14, 10, 0, tzinfo=timezone),
                status="pending",
            ),
            Notification(
                owner_user_id=user_id,
                title="采购跟单节点临期",
                message="采购合同 YJ-PC-202606-001 的确认样提交节点即将到期。",
                severity="warning",
                is_read=False,
                created_at=published_at,
            ),
            ScheduleEvent(
                owner_user_id=user_id,
                title="查看供应商大货样",
                description="核对样品登记中的大货样状态。",
                starts_at=datetime(2026, 6, 13, 14, 0, tzinfo=timezone),
                ends_at=datetime(2026, 6, 13, 15, 0, tzinfo=timezone),
                created_at=published_at,
            ),
            DashboardShortcut(
                owner_user_id=user_id,
                label="出口合同",
                target_path="/sales/contracts",
                icon="file-text",
                sort_order=10,
            ),
            DashboardShortcut(
                owner_user_id=user_id,
                label="采购跟单",
                target_path="/purchase/followup",
                icon="calendar-clock",
                sort_order=20,
            ),
        ]
    )
    await session.commit()
