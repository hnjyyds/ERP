import json
import logging
from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException
from httpx import ASGITransport, AsyncClient

from app.api.request_logging import RequestLoggingMiddleware
from app.core.logging import JsonLogFormatter, set_current_user_id


def _completed_record(records: list[logging.LogRecord]) -> logging.LogRecord:
    return next(
        record
        for record in records
        if getattr(record, "event", None) == "request_completed"
    )


async def _client_for(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


async def test_request_id_is_returned_and_written_to_structured_log(
    caplog: logging.LogCaptureFixture,
) -> None:
    app = FastAPI()
    app.add_middleware(RequestLoggingMiddleware, log_health_requests=True)

    @app.get("/ok")
    async def ok() -> dict[str, bool]:
        return {"ok": True}

    with caplog.at_level(logging.INFO, logger="app.request"):
        async for client in _client_for(app):
            response = await client.get("/ok", headers={"X-Request-ID": "browser-req-001"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "browser-req-001"
    record = _completed_record(caplog.records)
    assert record.request_id == "browser-req-001"
    assert record.method == "GET"
    assert record.path == "/ok"
    assert record.status_code == 200
    assert record.duration_ms >= 0


async def test_invalid_request_id_is_replaced_and_context_is_cleared_between_requests(
    caplog: logging.LogCaptureFixture,
) -> None:
    app = FastAPI()
    app.add_middleware(RequestLoggingMiddleware, log_health_requests=True)

    @app.get("/with-user")
    async def with_user() -> dict[str, bool]:
        set_current_user_id("u-quality")
        return {"ok": True}

    @app.get("/without-user")
    async def without_user() -> dict[str, bool]:
        return {"ok": True}

    with caplog.at_level(logging.INFO, logger="app.request"):
        async for client in _client_for(app):
            first = await client.get(
                "/with-user",
                headers={"X-Request-ID": "invalid id with spaces"},
            )
            second = await client.get("/without-user")

    assert first.headers["X-Request-ID"] != "invalid id with spaces"
    assert len(first.headers["X-Request-ID"]) == 32
    assert len(second.headers["X-Request-ID"]) == 32
    completed = [
        record for record in caplog.records if getattr(record, "event", None) == "request_completed"
    ]
    assert completed[-2].user_id == "u-quality"
    assert completed[-1].user_id is None


async def test_client_error_is_logged_as_warning(
    caplog: logging.LogCaptureFixture,
) -> None:
    app = FastAPI()
    app.add_middleware(RequestLoggingMiddleware, log_health_requests=True)

    @app.get("/missing")
    async def missing() -> None:
        raise HTTPException(status_code=404, detail="missing")

    with caplog.at_level(logging.WARNING, logger="app.request"):
        async for client in _client_for(app):
            response = await client.get("/missing")

    assert response.status_code == 404
    record = _completed_record(caplog.records)
    assert record.levelno == logging.WARNING
    assert record.status_code == 404


async def test_unhandled_error_returns_traceable_response_and_logs_stack(
    caplog: logging.LogCaptureFixture,
) -> None:
    app = FastAPI()
    app.add_middleware(RequestLoggingMiddleware, log_health_requests=True)

    @app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("database unavailable")

    with caplog.at_level(logging.ERROR, logger="app.request"):
        async for client in _client_for(app):
            response = await client.get("/boom", headers={"X-Request-ID": "failed-req-001"})

    assert response.status_code == 500
    assert response.headers["X-Request-ID"] == "failed-req-001"
    assert response.json()["code"] == "SERVER_ERROR"
    record = next(
        record for record in caplog.records if getattr(record, "event", None) == "request_failed"
    )
    assert record.request_id == "failed-req-001"
    assert record.exc_info is not None


async def test_authenticated_request_log_contains_current_user_id(
    api_client: AsyncClient,
    seeded_system: None,
    caplog: logging.LogCaptureFixture,
) -> None:
    login_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "finance", "password": "finance123"},
    )
    token = login_response.json()["data"]["access_token"]

    with caplog.at_level(logging.INFO, logger="app.request"):
        response = await api_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    record = next(
        record
        for record in caplog.records
        if getattr(record, "event", None) == "request_completed"
        and getattr(record, "path", None) == "/api/v1/auth/me"
    )
    assert record.user_id == "u-finance"


def test_json_formatter_redacts_sensitive_structured_fields() -> None:
    record = logging.LogRecord(
        name="app.test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="safe message",
        args=(),
        exc_info=None,
    )
    record.authorization = "Bearer top-secret"
    record.payload = {
        "username": "admin",
        "password": "plain-secret",
        "nested": {
            "access_token": "token-secret",
            "client_secret": "client-secret",
        },
    }

    rendered = JsonLogFormatter().format(record)
    payload = json.loads(rendered)

    assert "top-secret" not in rendered
    assert "plain-secret" not in rendered
    assert "token-secret" not in rendered
    assert "client-secret" not in rendered
    assert payload["authorization"] == "[REDACTED]"
    assert payload["payload"]["password"] == "[REDACTED]"
    assert payload["payload"]["nested"]["access_token"] == "[REDACTED]"
    assert payload["payload"]["nested"]["client_secret"] == "[REDACTED]"
    assert payload["payload"]["username"] == "admin"
