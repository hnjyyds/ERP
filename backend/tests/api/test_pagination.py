from collections.abc import AsyncIterator

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.pagination import PaginationMiddleware
from app.core.pagination import resolve_limit, resolve_offset


async def _client_for(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


async def test_pagination_defaults_to_fifty_and_explicit_values_are_available() -> None:
    app = FastAPI()
    app.add_middleware(PaginationMiddleware)

    @app.get("/items")
    async def items() -> dict[str, int | None]:
        return {
            "limit": resolve_limit(50),
            "offset": resolve_offset(0),
        }

    async for client in _client_for(app):
        default_response = await client.get("/items")
        paged_response = await client.get("/items?limit=20&offset=40")

    assert default_response.json() == {"limit": 50, "offset": 0}
    assert paged_response.json() == {"limit": 20, "offset": 40}


async def test_invalid_pagination_returns_uniform_validation_response() -> None:
    app = FastAPI()
    app.add_middleware(PaginationMiddleware)

    @app.get("/items")
    async def items() -> dict[str, bool]:
        return {"ok": True}

    async for client in _client_for(app):
        response = await client.get("/items?limit=0&offset=-1")

    payload = response.json()
    assert response.status_code == 422
    assert payload["success"] is False
    assert payload["code"] == "VALIDATION_ERROR"
    assert [item["field"] for item in payload["error"]["details"]] == [
        "limit",
        "offset",
    ]
