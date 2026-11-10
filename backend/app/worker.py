"""ARQ worker 入口：只负责调度，业务扫描逻辑在 notifications.reminders。

Web 进程不会 import 本模块，也不会因 Redis 不可用而受影响。
"""

from typing import Any

from arq import cron
from arq.connections import RedisSettings

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.modules.system.notifications.reminders import (
    scan_followup_node_reminders,
    scan_quality_inspection_reminders,
)

settings = get_settings()


async def startup(ctx: dict[str, Any]) -> None:
    """启动时给出明确的 Redis 连接提示，而不是静默重试。"""
    redis = ctx["redis"]
    try:
        await redis.ping()
    except Exception as exc:  # noqa: BLE001 - 统一转换为可读的启动错误
        raise RuntimeError(
            f"无法连接 Redis（REDIS_URL={settings.redis_url}）。"
            "请先启动 Redis，或在环境变量中配置正确的 REDIS_URL。"
        ) from exc


async def run_quality_inspection_reminders(ctx: dict[str, Any]) -> int:
    async with SessionLocal() as session, session.begin():
        return await scan_quality_inspection_reminders(session)


async def run_followup_node_reminders(ctx: dict[str, Any]) -> int:
    async with SessionLocal() as session, session.begin():
        return await scan_followup_node_reminders(session)


class WorkerSettings:
    """cron 使用 worker 所在主机的本地时区；容器部署时通过 TZ 控制。"""

    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    functions = [run_quality_inspection_reminders, run_followup_node_reminders]
    cron_jobs = [
        cron(run_quality_inspection_reminders, hour={9}, minute={0}),
        cron(run_followup_node_reminders, hour={9}, minute={10}),
    ]
    on_startup = startup
