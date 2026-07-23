import asyncio
from pathlib import Path

from httpx import ASGITransport, AsyncClient
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.main import create_app
from app.mcp.credentials import McpCredentialTokenService, McpCredentialVerifier
from app.mcp.server import mcp, mcp_http_app
from app.modules.system.auth.seed import seed_system_demo_data
from app.modules.system.mcp_settings.models import McpSettings
from app.modules.system.mcp_settings.repositories import McpSettingsRepository


async def test_fastmcp_exposes_expected_crud_tools() -> None:
    tools = await mcp.list_tools()

    assert {tool.name for tool in tools} == {
        "list_products",
        "get_product",
        "create_product",
        "update_product",
        "delete_product",
        "list_customers",
        "get_customer",
        "create_customer",
        "update_customer",
        "delete_customer",
        "list_export_orders",
        "get_export_order",
        "create_export_order",
        "update_export_order",
        "delete_export_order",
    }
    assert all("access_token" not in tool.inputSchema.get("properties", {}) for tool in tools)


async def test_fastapi_serves_fastmcp_over_streamable_http(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    settings = get_settings()
    token_service = McpCredentialTokenService(
        secret_key=settings.auth_secret_key,
        ttl_seconds=settings.mcp_credential_ttl_seconds,
    )
    async with session_factory() as session:
        await seed_system_demo_data(session)
        repository = McpSettingsRepository(session)
        await repository.upsert(enabled=True, updated_by="u-admin")
        row = await repository.rotate_credential(updated_by="u-admin")
        assert row is not None
        await session.commit()
    credential, _ = token_service.create(
        user_id="u-admin",
        version=row.credential_version,
    )
    app = create_app(mcp_session_factory=session_factory)
    transport = ASGITransport(app=app)

    async with mcp_http_app.router.lifespan_context(mcp_http_app):
        async with AsyncClient(
            transport=transport,
            base_url="http://127.0.0.1:8080",
            headers={"Authorization": f"Bearer {credential}"},
        ) as http_client:
            async with streamable_http_client(
                "http://127.0.0.1:8080/mcp",
                http_client=http_client,
            ) as (read_stream, write_stream, _):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    tools = await session.list_tools()

    assert len(tools.tools) == 15


async def test_fastmcp_rejects_missing_mcp_credential(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await McpSettingsRepository(session).upsert(enabled=True, updated_by="u-admin")
        await session.commit()
    app = create_app(mcp_session_factory=session_factory)
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://127.0.0.1:8080",
    ) as http_client:
        response = await http_client.post(
            "/mcp",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream",
            },
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "test", "version": "1"},
                },
            },
        )

    assert response.status_code == 401


async def test_rotating_mcp_credential_revokes_the_previous_token(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    settings = get_settings()
    token_service = McpCredentialTokenService(
        secret_key=settings.auth_secret_key,
        ttl_seconds=settings.mcp_credential_ttl_seconds,
    )
    verifier = McpCredentialVerifier(
        session_factory=session_factory,
        token_service=token_service,
    )
    async with session_factory() as session:
        repository = McpSettingsRepository(session)
        await repository.upsert(enabled=True, updated_by="u-admin")
        first = await repository.rotate_credential(updated_by="u-admin")
        assert first is not None
        await session.commit()
    old_token, _ = token_service.create(
        user_id="u-admin",
        version=first.credential_version,
    )

    async with session_factory() as session:
        second = await McpSettingsRepository(session).rotate_credential(
            updated_by="u-admin"
        )
        assert second is not None
        await session.commit()
    new_token, _ = token_service.create(
        user_id="u-admin",
        version=second.credential_version,
    )

    assert await verifier.verify_token(old_token) is None
    assert await verifier.verify_token(new_token) is not None


async def test_concurrent_mcp_credential_rotation_uses_distinct_versions(
    tmp_path: Path,
) -> None:
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'mcp-rotation.db'}",
        connect_args={"timeout": 2},
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(McpSettings.__table__.create)
    async with session_factory() as session:
        await McpSettingsRepository(session).upsert(enabled=True, updated_by="setup")
        await session.commit()

    ready = asyncio.Event()
    lock = asyncio.Lock()
    arrivals = 0

    class BarrierSession:
        def __init__(self, session: AsyncSession) -> None:
            self._session = session

        async def scalar(self, statement):  # type: ignore[no-untyped-def]
            nonlocal arrivals
            value = await self._session.scalar(statement)
            async with lock:
                arrivals += 1
                if arrivals == 2:
                    ready.set()
            await ready.wait()
            return value

        async def execute(self, statement):  # type: ignore[no-untyped-def]
            return await self._session.execute(statement)

        async def flush(self) -> None:
            await self._session.flush()

    async def rotate(updated_by: str) -> int:
        async with session_factory() as session:
            repository = McpSettingsRepository(BarrierSession(session))  # type: ignore[arg-type]
            row = await repository.rotate_credential(updated_by=updated_by)
            assert row is not None
            await session.commit()
            return row.credential_version

    try:
        versions = await asyncio.gather(rotate("admin-a"), rotate("admin-b"))
        assert sorted(versions) == [1, 2]

        token_service = McpCredentialTokenService(secret_key="test-secret", ttl_seconds=60)
        verifier = McpCredentialVerifier(
            session_factory=session_factory,
            token_service=token_service,
        )
        first_token, _ = token_service.create(user_id="admin-a", version=1)
        latest_token, _ = token_service.create(user_id="admin-b", version=2)

        assert await verifier.verify_token(first_token) is None
        assert await verifier.verify_token(latest_token) is not None
    finally:
        await engine.dispose()
