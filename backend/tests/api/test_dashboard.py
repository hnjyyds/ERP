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
    assert dashboard["todos"][0]["assignment_type"] == "assigned"
    assert dashboard["notifications"][0]["severity"] == "warning"


async def test_todo_create_supports_self_and_assigned_users(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    payload = {
        "title": "整理下周寄样清单",
        "content": "确认样品、快递单和客户地址。",
        "assignee_user_ids": ["u-001", "u-finance"],
    }

    create_response = await api_client.post(
        "/api/v1/todos",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    created = create_response.json()["data"]
    assert len(created["items"]) == 2
    assert {item["owner_user_id"] for item in created["items"]} == {"u-001", "u-finance"}
    assert {item["title"] for item in created["items"]} == {payload["title"]}
    assert {item["content"] for item in created["items"]} == {payload["content"]}
    assert {item["source_type"] for item in created["items"]} == {"manual"}
    assert {item["creator_user_id"] for item in created["items"]} == {"u-001"}
    assert {item["creator_user_name"] for item in created["items"]} == {"演示业务主管"}
    assert {
        (item["owner_user_id"], item["assignment_type"]) for item in created["items"]
    } == {
        ("u-001", "self"),
        ("u-finance", "assigned"),
    }

    dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    dashboard = dashboard_response.json()["data"]
    personal_todos = [
        item for item in dashboard["todos"] if item["assignment_type"] == "self"
    ]
    assigned_todos = [
        item for item in dashboard["todos"] if item["assignment_type"] == "assigned"
    ]
    assert dashboard["summary"]["todo_count"] == 3
    assert {item["title"] for item in personal_todos} == {payload["title"]}
    assert len(assigned_todos) == 2

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    finance_dashboard_response = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    finance_todos = finance_dashboard_response.json()["data"]["todos"]
    assigned_to_finance = [item for item in finance_todos if item["title"] == payload["title"]]
    assert len(assigned_to_finance) == 1
    assert assigned_to_finance[0]["owner_user_name"] == "演示财务"
    assert assigned_to_finance[0]["assignment_type"] == "assigned"


async def test_personal_todo_create_rejects_unexpected_fields(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/todos",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "非法字段测试",
            "content": "这个字段不应该被接受",
            "assignee_user_ids": ["u-001"],
            "owner_user_id": "u-002",
        },
    )

    assert response.status_code == 422


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


async def test_schedule_delete_is_limited_to_owner_and_refreshes_dashboard(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    admin_token = await _login_token(api_client, username="admin", password="admin123")
    payload = {
        "title": "待删除日程",
        "description": "验证删除后不再出现在工作台",
        "starts_at": "2026-06-15T14:00:00+08:00",
        "ends_at": "2026-06-15T15:00:00+08:00",
    }

    create_response = await api_client.post(
        "/api/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    schedule = create_response.json()["data"]

    forbidden_response = await api_client.delete(
        f"/api/v1/schedules/{schedule['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert forbidden_response.status_code == 404

    delete_response = await api_client.delete(
        f"/api/v1/schedules/{schedule['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["id"] == schedule["id"]

    refreshed = await api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    dashboard = refreshed.json()["data"]
    schedule_ids = {item["id"] for item in dashboard["schedule_events"]}
    assert schedule["id"] not in schedule_ids
    assert dashboard["summary"]["today_schedule_count"] == 1


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
    assert response.json()["message"] == "无权限发布公告"


async def test_announcement_create_requires_super_admin_even_with_announcement_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    super_admin_token = await _login_token(
        api_client,
        username="admin",
        password="admin123",
    )
    options_response = await api_client.get(
        "/api/v1/organization/options",
        headers={"Authorization": f"Bearer {super_admin_token}"},
    )
    permission_by_code = {
        item["code"]: item
        for item in options_response.json()["data"]["permissions"]
    }
    grant_response = await api_client.patch(
        "/api/v1/organization/roles/role-finance/permissions",
        headers={"Authorization": f"Bearer {super_admin_token}"},
        json={
            "permission_ids": [
                permission_by_code["dashboard:view"]["id"],
                permission_by_code["finance:view"]["id"],
                permission_by_code["announcement:create"]["id"],
            ],
        },
    )
    assert grant_response.status_code == 200

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.post(
        "/api/v1/announcements",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "title": "财务公告",
            "content": "拥有公告创建权限但不是超级管理员，仍不可发布。",
        },
    )

    assert response.status_code == 403
    assert response.json()["message"] == "无权限发布公告"


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
