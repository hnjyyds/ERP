"""每日定时提醒扫描：只做判定与写入，不依赖调度器或 Redis。

ARQ cron 只负责调用这里的函数；测试可直接传入 Session 验证判定与去重。
"""

from datetime import UTC, date, datetime, time, timedelta
from urllib.parse import quote

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.followup.repositories import FollowupRepository
from app.modules.quality.inspections.repositories import QualityInspectionRepository
from app.modules.system.dashboard.notification_writer import notify_reminder

# 临期阈值：排期当日起 3 天内（含当天）提醒。
QC_DUE_SOON_DAYS = 3
QC_SOURCE_TYPE = "quality_inspection"
FOLLOWUP_SOURCE_TYPE = "purchase_follow_node"


async def scan_quality_inspection_reminders(
    session: AsyncSession,
    *,
    now: datetime | None = None,
    due_soon_days: int = QC_DUE_SOON_DAYS,
) -> int:
    """扫描未完成的 QC 任务：临期或已逾期时提醒责任人，返回新写入条数。"""
    current = now or datetime.now(UTC)
    today = current.date()
    window_end = datetime.combine(
        today + timedelta(days=due_soon_days + 1),
        time.min,
        tzinfo=UTC,
    )
    rows = await QualityInspectionRepository(session).list_scheduled_reminders(
        window_end=window_end
    )
    created = 0
    for row in rows:
        scheduled_date = row.scheduled_at.date()
        owner_user_id = row.inspector_id or row.qc_user_id or row.owner_user_id
        target_path = f"/quality/inspections?q={quote(row.code)}"
        if scheduled_date < today:
            written = await notify_reminder(
                session,
                owner_user_id=owner_user_id,
                source_type=QC_SOURCE_TYPE,
                source_id=row.id,
                event=f"qc.overdue.{today.isoformat()}",
                title_key="notification.qc.title",
                message_key="notification.qc.overdue",
                params={
                    "no": row.code,
                    "due": scheduled_date.isoformat(),
                    "days": (today - scheduled_date).days,
                },
                severity="high",
                target_path=target_path,
            )
        else:
            written = await notify_reminder(
                session,
                owner_user_id=owner_user_id,
                source_type=QC_SOURCE_TYPE,
                source_id=row.id,
                event=f"qc.due_soon.{today.isoformat()}",
                title_key="notification.qc.title",
                message_key="notification.qc.due_soon",
                params={
                    "no": row.code,
                    "due": scheduled_date.isoformat(),
                    "days": (scheduled_date - today).days,
                },
                severity="warning",
                target_path=target_path,
            )
        created += int(written)
    return created


async def scan_followup_node_reminders(
    session: AsyncSession,
    *,
    today: date | None = None,
) -> int:
    """扫描计划日期已过且未完成的跟单节点，返回新写入条数。"""
    current = today or datetime.now(UTC).date()
    rows = await FollowupRepository(session).list_reminder_nodes(today=current)
    created = 0
    for row in rows:
        written = await notify_reminder(
            session,
            owner_user_id=row.owner_user_id,
            source_type=FOLLOWUP_SOURCE_TYPE,
            source_id=row.id,
            event=f"followup.node.overdue.{current.isoformat()}",
            title_key="notification.followup.title",
            message_key="notification.followup.overdue",
            params={
                "no": row.purchase_contract_no,
                "node": row.node_name,
                "days": row.overdue_days,
            },
            severity="high",
            target_path=f"/purchase/followup?q={quote(row.purchase_contract_no)}",
        )
        created += int(written)
    return created
