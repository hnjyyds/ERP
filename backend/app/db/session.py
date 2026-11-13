from pathlib import Path

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

if settings.database_url.startswith("sqlite+aiosqlite:///./"):
    db_path = Path(settings.database_url.removeprefix("sqlite+aiosqlite:///"))
    db_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(
    settings.database_url,
    future=True,
    # SQLite 写事务串行化：并发写入时等待锁而不是立刻抛 database is locked。
    connect_args={"timeout": 30} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
