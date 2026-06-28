"""Tests for the finance overview endpoint."""

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


async def test_finance_overview_returns_200_with_valid_token(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, "finance", "finance123")

    response = await api_client.get(
        "/api/v1/finance/overview",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    # Finance overview should contain summary metrics
    assert isinstance(data, dict)


async def test_finance_overview_rejects_unauthenticated(
    api_client: AsyncClient,
) -> None:
    response = await api_client.get("/api/v1/finance/overview")

    assert response.status_code == 401


async def test_finance_overview_rejects_invalid_token(
    api_client: AsyncClient,
) -> None:
    response = await api_client.get(
        "/api/v1/finance/overview",
        headers={"Authorization": "Bearer invalid-token-xyz"},
    )

    assert response.status_code == 401
