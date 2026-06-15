from httpx import AsyncClient


async def _login_token(
    api_client: AsyncClient,
    *,
    username: str = "demo",
    password: str = "demo123",
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
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


async def test_announcement_create_is_visible_on_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="admin", password="admin123")
    payload = {
        "title": "端午放假通知",
        "content": "6 月 16 日上午完成出货资料交接。",
    }

    create_response = await api_client.post(
        "/api/v1/announcements",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    assert create_response.json()["data"]["title"] == payload["title"]

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    titles = {item["title"] for item in dashboard_response.json()["data"]["announcements"]}
    assert payload["title"] in titles


async def test_announcement_create_requires_admin_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/announcements",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "普通用户公告",
            "content": "普通业务账号不应能发布公司公告。",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "无权限发布公告"


async def test_notification_can_be_marked_read(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    notification_id = dashboard_response.json()["data"]["notifications"][0]["id"]

    read_response = await api_client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert read_response.status_code == 200
    assert read_response.json()["data"]["is_read"] is True

    refreshed = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert refreshed.json()["data"]["summary"]["unread_notification_count"] == 0


async def test_shortcut_create_and_delete_refresh_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    payload = {
        "label": "商品资料",
        "target_path": "/masterdata/products",
        "icon": "package",
        "sort_order": 30,
    }

    create_response = await api_client.post(
        "/api/v1/shortcuts",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    shortcut = create_response.json()["data"]
    assert shortcut["label"] == payload["label"]

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert dashboard_response.json()["data"]["summary"]["shortcut_count"] == 3

    delete_response = await api_client.delete(
        f"/api/v1/shortcuts/{shortcut['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["id"] == shortcut["id"]

    refreshed = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    shortcut_ids = {item["id"] for item in refreshed.json()["data"]["shortcuts"]}
    assert shortcut["id"] not in shortcut_ids


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
