from httpx import AsyncClient


async def test_health_endpoint_returns_stable_api_response(api_client: AsyncClient) -> None:
    response = await api_client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {"status": "ok", "service": "yuanjing-trade-api"},
        "error": None,
    }
