"""Tests for the system endpoints (menus, etc.)."""

from httpx import AsyncClient


async def _login_token(
    api_client: AsyncClient,
    username: str = "demo",
    password: str = "demo123",
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    return response.json()["data"]["access_token"]


async def test_system_menus_returns_200_with_valid_token(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    # Should return a list of menu items
    assert "menus" in data or isinstance(data, list)
    # At minimum we should have some menu entries
    menus = data.get("menus", data if isinstance(data, list) else [])
    assert len(menus) > 0


async def test_system_menus_rejects_unauthenticated(
    api_client: AsyncClient,
) -> None:
    response = await api_client.get("/api/v1/system/menus")

    assert response.status_code == 401


async def test_system_menus_rejects_invalid_token(
    api_client: AsyncClient,
) -> None:
    response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": "Bearer invalid-token-xyz"},
    )

    assert response.status_code == 401
