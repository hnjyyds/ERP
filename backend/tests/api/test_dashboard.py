from httpx import AsyncClient


async def _login_token(api_client: AsyncClient) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
    )
    return response.json()["data"]["access_token"]


async def test_dashboard_returns_pdf_required_sections(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["error"] is None

    dashboard = body["data"]
    assert set(dashboard) == {
        "announcements",
        "todos",
        "notifications",
        "schedule_events",
        "shortcuts",
        "summary",
    }
    assert dashboard["summary"] == {
        "announcement_count": 1,
        "todo_count": 2,
        "unread_notification_count": 1,
        "today_schedule_count": 1,
        "shortcut_count": 2,
    }
    assert dashboard["todos"][0]["source_type"] == "approval"
    assert dashboard["notifications"][0]["severity"] == "warning"


async def test_schedule_create_is_visible_on_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    payload = {
        "title": "跟进采购合同节点",
        "description": "确认样提交前提醒供应商",
        "starts_at": "2026-06-15T09:00:00+08:00",
        "ends_at": "2026-06-15T10:00:00+08:00",
    }

    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    created = create_response.json()["data"]
    assert created["title"] == payload["title"]
    assert created["owner_user_id"] == "u-001"

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    event_titles = {
        item["title"] for item in dashboard_response.json()["data"]["schedule_events"]
    }
    assert "跟进采购合同节点" in event_titles


async def test_schedule_create_rejects_unexpected_fields(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "非法字段测试",
            "starts_at": "2026-06-15T09:00:00+08:00",
            "ends_at": "2026-06-15T10:00:00+08:00",
            "unexpected": "not allowed",
        },
    )

    assert response.status_code == 422


async def test_dashboard_requires_login(api_client: AsyncClient, seeded_system: None) -> None:
    response = await api_client.get("/api/v1/dashboard")

    assert response.status_code == 401
