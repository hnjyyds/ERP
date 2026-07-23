from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.responses import JSONResponse

from app.mcp.availability import McpAvailabilityMiddleware
from app.modules.system.mcp_settings.repositories import McpSettingsRepository


async def _token(client: AsyncClient, username: str, password: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return str(response.json()["data"]["access_token"])


async def test_super_admin_can_read_and_update_mcp_settings(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    admin_token = await _token(api_client, "admin", "admin123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = await api_client.get("/api/v1/system/mcp", headers=headers)

    assert response.status_code == 200
    settings = response.json()["data"]
    assert settings["enabled"] is False
    assert settings["server_name"] == "Yuanjing Trade ERP"
    assert settings["transport"] == "streamable_http"
    assert settings["endpoint_path"] == "/mcp"
    assert settings["token_parameter"] == "Authorization"
    assert settings["token_prefix_required"] is True
    assert settings["credential_available"] is False
    assert settings["tool_count"] == 15
    assert {resource["key"] for resource in settings["resources"]} == {
        "products",
        "customers",
        "export_orders",
    }

    menus_response = await api_client.get("/api/v1/system/menus", headers=headers)
    menu_paths = {item["path"] for item in menus_response.json()["data"]["menus"]}
    assert "/system/mcp" in menu_paths

    update_response = await api_client.patch(
        "/api/v1/system/mcp",
        headers=headers,
        json={"enabled": True},
    )

    assert update_response.status_code == 200
    assert update_response.json()["data"]["enabled"] is True

    credential_response = await api_client.post(
        "/api/v1/system/mcp/credentials",
        headers=headers,
    )
    assert credential_response.status_code == 200
    credential = credential_response.json()["data"]
    assert credential["token_type"] == "Bearer"
    assert credential["access_token"] != admin_token

    erp_api_response = await api_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {credential['access_token']}"},
    )
    assert erp_api_response.status_code == 401

    persisted_response = await api_client.get("/api/v1/system/mcp", headers=headers)
    persisted = persisted_response.json()["data"]
    assert persisted["enabled"] is True
    assert persisted["credential_available"] is True


async def test_mcp_settings_reject_non_admin(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _token(api_client, "demo", "demo123")

    response = await api_client.get(
        "/api/v1/system/mcp",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403

    menus_response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {token}"},
    )
    menu_paths = {item["path"] for item in menus_response.json()["data"]["menus"]}
    assert "/system/mcp" not in menu_paths


async def test_mcp_availability_middleware_blocks_disabled_server(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async def downstream(scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        response = JSONResponse({"available": True})
        await response(scope, receive, send)

    app = McpAvailabilityMiddleware(
        downstream,
        session_factory=session_factory,
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://127.0.0.1:8000") as client:
        disabled_by_default = await client.post("/mcp")
        assert disabled_by_default.status_code == 503

        async with session_factory() as session:
            await McpSettingsRepository(session).upsert(
                enabled=True,
                updated_by="u-admin",
            )
            await session.commit()

        available = await client.post("/mcp")

    assert available.status_code == 200
