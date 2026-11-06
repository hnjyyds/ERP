"""数据库迁移入口：把 Alembic 版本化 DDL 接入启动流程，并提供老库标记命令。

启动时的自动迁移只处理「空库」和「已纳入版本管理」两种状态；
已有数据但还没有 `alembic_version` 的旧库必须先执行一次
`python -m app.db.migrate stamp-existing`，避免把基线迁移重复应用到已有表上。
"""

import asyncio
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings
from app.db import model_registry  # noqa: F401
from app.db.base import Base

BASELINE_REVISION = "0001_baseline"
BACKEND_ROOT = Path(__file__).resolve().parents[2]
ALEMBIC_INI = BACKEND_ROOT / "alembic.ini"
MIGRATIONS_DIR = BACKEND_ROOT / "migrations"
SQLITE_PREFIX = "sqlite+aiosqlite:///"


@dataclass(frozen=True)
class DatabaseState:
    """迁移前的数据库状态快照。"""

    tables: frozenset[str]
    missing_tables: frozenset[str]
    has_alembic_version: bool

    @property
    def is_legacy(self) -> bool:
        return bool(self.tables) and not self.has_alembic_version


def build_config() -> Config:
    config = Config(str(ALEMBIC_INI))
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    config.set_main_option("sqlalchemy.url", get_settings().database_url)
    return config


async def inspect_database_state() -> DatabaseState:
    engine = create_async_engine(get_settings().database_url)
    try:
        async with engine.connect() as connection:
            tables = await connection.run_sync(
                lambda sync_connection: inspect(sync_connection).get_table_names()
            )
    finally:
        await engine.dispose()

    present = frozenset(tables)
    expected = frozenset(Base.metadata.tables)
    return DatabaseState(
        tables=present,
        missing_tables=frozenset(expected - present - {"alembic_version"}),
        has_alembic_version="alembic_version" in present,
    )


async def run_migrations() -> None:
    """应用启动时升级到最新版本；旧库未标记时给出明确指引而不是直接建表。"""
    state = await inspect_database_state()
    if state.is_legacy:
        raise RuntimeError(
            "数据库已有表但尚未纳入 Alembic 版本管理，"
            "请先执行 `python -m app.db.migrate stamp-existing`。"
        )

    for attempt in range(3):
        try:
            await asyncio.to_thread(command.upgrade, build_config(), "head")
            return
        except OperationalError as exc:
            if "database is locked" not in str(exc).lower() or attempt == 2:
                raise
            await asyncio.sleep(0.5 * (attempt + 1))


def _database_file() -> Path | None:
    url = get_settings().database_url
    if not url.startswith(SQLITE_PREFIX):
        return None
    path = Path(url.removeprefix(SQLITE_PREFIX))
    return path if path.exists() else None


def _backup_database_file() -> Path | None:
    path = _database_file()
    if path is None:
        return None
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    backup = path.with_name(f"{path.stem}.before-alembic-{timestamp}{path.suffix}")
    shutil.copy2(path, backup)
    return backup


def stamp_existing() -> int:
    """把已有旧库标记为已应用基线，再执行对账迁移补齐缺失列。"""
    state = asyncio.run(inspect_database_state())

    if state.has_alembic_version:
        print("数据库已纳入 Alembic 版本管理，无需重复标记。")
        return 0

    if not state.tables:
        print("数据库为空，无需标记；启动时会自动执行迁移建表。")
        return 0

    if state.missing_tables:
        missing = "、".join(sorted(state.missing_tables))
        print(f"数据库缺少预期表，拒绝标记基线：{missing}")
        return 1

    backup = _backup_database_file()
    if backup is not None:
        print(f"已备份数据库到 {backup}")

    config = build_config()
    command.stamp(config, BASELINE_REVISION)
    print(f"已将现有数据库标记为基线版本 {BASELINE_REVISION}")
    command.upgrade(config, "head")
    # 再跑一次确认幂等，避免后续每次启动都重复执行对账逻辑。
    command.upgrade(config, "head")
    print("对账迁移完成，数据库已是最新版本。")
    return 0


if __name__ == "__main__":
    raise SystemExit(stamp_existing())
