from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.followup.models import (
    FollowProcessTemplate,
    PurchaseFollowNode,
    PurchaseFollowPlan,
)
from app.modules.quality.inspections.models import QualityInspection
from app.modules.system.dashboard.models import Notification
from app.modules.system.notifications.reminders import (
    scan_followup_node_reminders,
    scan_quality_inspection_reminders,
)

TODAY = date(2026, 11, 10)


async def _notification_count(session: AsyncSession) -> int:
    return int(await session.scalar(select(func.count()).select_from(Notification)) or 0)


def _inspection(
    *,
    code: str,
    scheduled_at: datetime,
    status: str = "pending",
    inspector_id: str | None = "u-qc",
    qc_user_id: str | None = "u-qc-lead",
    owner_user_id: str = "u-owner",
) -> QualityInspection:
    return QualityInspection(
        code=code,
        purchase_contract_id="pc-1",
        purchase_contract_no="PC-001",
        supplier_id="supplier-1",
        supplier_name="演示供应商",
        status=status,
        scheduled_at=scheduled_at,
        inspected_at=scheduled_at.date(),
        result="",
        inspector_id=inspector_id,
        inspector_name="查验员",
        qc_user_id=qc_user_id,
        qc_user_name="QC 负责人",
        owner_user_id=owner_user_id,
    )


async def _seed_followup_plan(
    session: AsyncSession,
    *,
    planned_date: date,
    actual_date: date | None = None,
    status: str = "pending",
    owner_user_id: str = "u-buyer",
) -> PurchaseFollowNode:
    template = FollowProcessTemplate(
        name=f"模板-{planned_date.isoformat()}",
        enabled=True,
        is_default=False,
        owner_user_id=owner_user_id,
    )
    session.add(template)
    await session.flush()
    plan = PurchaseFollowPlan(
        purchase_contract_id=f"pc-{planned_date.isoformat()}",
        purchase_contract_no="PC-FOLLOW-001",
        supplier_id="supplier-1",
        supplier_name="演示供应商",
        template_id=template.id,
        base_date=date(2026, 10, 1),
        overall_status="pending",
        owner_user_id=owner_user_id,
    )
    session.add(plan)
    await session.flush()
    node = PurchaseFollowNode(
        follow_plan_id=plan.id,
        node_code="deposit",
        node_name="定金支付",
        sequence_no=1,
        planned_date=planned_date,
        remind_date=planned_date - timedelta(days=3),
        actual_date=actual_date,
        status=status,
    )
    session.add(node)
    await session.flush()
    return node


async def test_qc_due_soon_and_overdue_create_daily_reminders(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    now = datetime.combine(TODAY, time(hour=9), tzinfo=UTC)
    async with session_factory() as session:
        session.add_all(
            [
                _inspection(code="QC-SOON", scheduled_at=now + timedelta(days=2)),
                _inspection(code="QC-OVERDUE", scheduled_at=now - timedelta(days=2)),
                _inspection(code="QC-FAR", scheduled_at=now + timedelta(days=4)),
                _inspection(
                    code="QC-DONE",
                    scheduled_at=now - timedelta(days=2),
                    status="completed",
                ),
            ]
        )
        await session.flush()

        created = await scan_quality_inspection_reminders(session, now=now)
        assert created == 2

        rows = list(await session.scalars(select(Notification).order_by(Notification.event)))
        assert [row.event for row in rows] == [
            f"qc.due_soon.{TODAY.isoformat()}",
            f"qc.overdue.{TODAY.isoformat()}",
        ]
        due_soon, overdue = rows
        assert due_soon.severity == "warning"
        assert due_soon.owner_user_id == "u-qc"
        assert due_soon.target_path == "/quality/inspections?q=QC-SOON"
        assert "QC-SOON" in due_soon.message
        assert overdue.severity == "high"
        assert "已逾期 2 天" in overdue.message


async def test_qc_reminder_falls_back_to_qc_owner_and_skips_same_day(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    now = datetime.combine(TODAY, time(hour=9), tzinfo=UTC)
    async with session_factory() as session:
        session.add(
            _inspection(
                code="QC-FALLBACK",
                scheduled_at=now - timedelta(days=1),
                inspector_id=None,
                qc_user_id=None,
            )
        )
        await session.flush()

        assert await scan_quality_inspection_reminders(session, now=now) == 1
        # 同一天重跑：事件日期相同，不能产生第二条。
        assert await scan_quality_inspection_reminders(session, now=now) == 0
        rows = list(await session.scalars(select(Notification)))
        assert len(rows) == 1
        assert rows[0].owner_user_id == "u-owner"

        # 次日重跑：事件日期不同，允许再提醒一次。
        next_day = now + timedelta(days=1)
        assert await scan_quality_inspection_reminders(session, now=next_day) == 1
        assert await _notification_count(session) == 2


async def test_followup_overdue_node_notifies_plan_owner_and_deduplicates(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await _seed_followup_plan(session, planned_date=TODAY - timedelta(days=3))
        await _seed_followup_plan(
            session,
            planned_date=TODAY - timedelta(days=1),
            actual_date=TODAY - timedelta(days=1),
            status="completed",
        )
        await _seed_followup_plan(session, planned_date=TODAY)
        await session.flush()

        assert await scan_followup_node_reminders(session, today=TODAY) == 1
        assert await scan_followup_node_reminders(session, today=TODAY) == 0
        rows = list(await session.scalars(select(Notification)))
        assert len(rows) == 1
        row = rows[0]
        assert row.owner_user_id == "u-buyer"
        assert row.event == f"followup.node.overdue.{TODAY.isoformat()}"
        assert row.severity == "high"
        assert row.target_path == "/purchase/followup?q=PC-FOLLOW-001"
        assert "定金支付" in row.message
        assert "已逾期 3 天" in row.message


def test_worker_settings_expose_two_daily_cron_jobs_without_connecting() -> None:
    from app.worker import WorkerSettings

    assert WorkerSettings.redis_settings.host == "localhost"
    assert WorkerSettings.redis_settings.port == 6379
    assert WorkerSettings.redis_settings.database == 0
    assert len(WorkerSettings.cron_jobs) == 2
    assert {job.name for job in WorkerSettings.cron_jobs} == {
        "cron:run_quality_inspection_reminders",
        "cron:run_followup_node_reminders",
    }
    assert [job.hour for job in WorkerSettings.cron_jobs] == [{9}, {9}]
    assert [job.minute for job in WorkerSettings.cron_jobs] == [{0}, {10}]
