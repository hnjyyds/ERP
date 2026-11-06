"""迁移链路契约测试：空库建表、老库对账、基线降级。"""

import sqlite3
from pathlib import Path

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine

from app.db import model_registry  # noqa: F401
from app.db.base import Base

BACKEND_ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS_DIR = BACKEND_ROOT / "migrations"


def _config(db_path: Path) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    config.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")
    return config


def _column_names(db_path: Path, table: str) -> set[str]:
    connection = sqlite3.connect(db_path)
    try:
        return {row[1] for row in connection.execute(f"PRAGMA table_info({table})")}
    finally:
        connection.close()


def _table_names(db_path: Path) -> set[str]:
    connection = sqlite3.connect(db_path)
    try:
        rows = connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        return {row[0] for row in rows}
    finally:
        connection.close()


def test_upgrade_head_creates_schema_matching_models(tmp_path: Path) -> None:
    db_path = tmp_path / "fresh.db"
    command.upgrade(_config(db_path), "head")

    engine = create_engine(f"sqlite:///{db_path}")
    try:
        with engine.connect() as connection:
            drift = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    finally:
        engine.dispose()

    assert drift == []


def test_legacy_database_is_reconciled_after_baseline_stamp(tmp_path: Path) -> None:
    db_path = tmp_path / "legacy.db"
    connection = sqlite3.connect(db_path)
    try:
        connection.executescript(
            """
            CREATE TABLE quality_inspections (
                id VARCHAR(36) PRIMARY KEY,
                inspected_at DATETIME,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO quality_inspections (id, inspected_at, created_at)
            VALUES ('qi-1', '2026-01-02', '2026-01-02 03:04:05');
            CREATE TABLE users (id VARCHAR(36) PRIMARY KEY);
            INSERT INTO users (id) VALUES ('u-1');
            """
        )
        connection.commit()
    finally:
        connection.close()

    config = _config(db_path)
    command.stamp(config, "0001_baseline")
    command.upgrade(config, "head")

    inspection_columns = _column_names(db_path, "quality_inspections")
    assert {"status", "scheduled_at", "updated_at", "reinspection_no"} <= inspection_columns
    assert {"avatar_type", "avatar_value"} <= _column_names(db_path, "users")

    connection = sqlite3.connect(db_path)
    try:
        scheduled_at, updated_at = connection.execute(
            "SELECT scheduled_at, updated_at FROM quality_inspections WHERE id = 'qi-1'"
        ).fetchone()
        user_count = connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    finally:
        connection.close()

    assert scheduled_at == "2026-01-02 09:00:00"
    assert updated_at == "2026-01-02 03:04:05"
    assert user_count == 1


def test_baseline_downgrade_removes_all_business_tables(tmp_path: Path) -> None:
    db_path = tmp_path / "downgrade.db"
    config = _config(db_path)
    command.upgrade(config, "head")
    command.downgrade(config, "base")

    assert _table_names(db_path) == {"alembic_version"}
