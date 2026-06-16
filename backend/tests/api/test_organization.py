from httpx import AsyncClient


async def _token(client: AsyncClient, username: str, password: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return str(response.json()["data"]["access_token"])


async def test_super_admin_can_manage_users_and_role_permissions_without_password_leaks(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    admin_token = await _token(api_client, "admin", "admin123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    options_response = await api_client.get("/api/v1/organization/options", headers=headers)
    assert options_response.status_code == 200
    options = options_response.json()["data"]
    assert options["departments"] == []
    sales_role = next(item for item in options["roles"] if item["code"] == "sales_manager")

    no_department_response = await api_client.post(
        "/api/v1/organization/users",
        headers=headers,
        json={
            "username": "blocked.no.department",
            "display_name": "无部门用户",
            "department_id": "dept-missing",
            "role_ids": [sales_role["id"]],
            "is_active": True,
            "avatar_type": "preset",
            "avatar_value": "copper-wave",
        },
    )
    assert no_department_response.status_code == 409
    assert no_department_response.json()["message"] == "请先新增部门"

    department_response = await api_client.post(
        "/api/v1/organization/departments",
        headers=headers,
        json={"name": "业务部", "sort_order": 10},
    )
    assert department_response.status_code == 201
    sales_department = department_response.json()["data"]

    create_response = await api_client.post(
        "/api/v1/organization/users",
        headers=headers,
        json={
            "username": "ops.user",
            "display_name": "运营专员",
            "department_id": sales_department["id"],
            "role_ids": [sales_role["id"]],
            "is_active": True,
            "avatar_type": "preset",
            "avatar_value": "copper-wave",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()["data"]
    assert len(created["initial_password"]) >= 10
    assert created["user"]["username"] == "ops.user"
    assert created["user"]["avatar_type"] == "preset"
    assert created["user"]["avatar_value"] == "copper-wave"
    assert created["user"]["password_set"] is True
    assert "password_hash" not in created["user"]
    assert "password_salt" not in created["user"]

    login_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "ops.user", "password": created["initial_password"]},
    )
    assert login_response.status_code == 200

    list_response = await api_client.get("/api/v1/organization/users", headers=headers)
    assert list_response.status_code == 200
    list_body = list_response.json()["data"]
    created_list_item = next(item for item in list_body["users"] if item["username"] == "ops.user")
    assert created["initial_password"] not in str(list_body)
    assert created_list_item["password_set"] is True
    assert created_list_item["avatar_value"] == "copper-wave"
    assert "initial_password" not in created_list_item
    assert "temporary_password" not in created_list_item

    uploaded_avatar = "data:image/png;base64,iVBORw0KGgo="
    update_response = await api_client.patch(
        f"/api/v1/organization/users/{created['user']['id']}",
        headers=headers,
        json={
            "display_name": "运营主管",
            "role_ids": ["role-finance"],
            "is_active": True,
            "avatar_type": "upload",
            "avatar_value": uploaded_avatar,
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["display_name"] == "运营主管"
    assert update_response.json()["data"]["avatar_type"] == "upload"
    assert update_response.json()["data"]["avatar_value"] == uploaded_avatar
    assert [role["code"] for role in update_response.json()["data"]["roles"]] == ["finance"]

    reset_response = await api_client.post(
        f"/api/v1/organization/users/{created['user']['id']}/reset-password",
        headers=headers,
    )
    assert reset_response.status_code == 200
    temporary_password = reset_response.json()["data"]["temporary_password"]
    assert temporary_password

    old_password_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "ops.user", "password": created["initial_password"]},
    )
    assert old_password_response.status_code == 401

    new_password_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "ops.user", "password": temporary_password},
    )
    assert new_password_response.status_code == 200

    delete_response = await api_client.delete(
        f"/api/v1/organization/users/{created['user']['id']}",
        headers=headers,
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["is_active"] is False

    delete_department_response = await api_client.delete(
        f"/api/v1/organization/departments/{sales_department['id']}",
        headers=headers,
    )
    assert delete_department_response.status_code == 409
    assert delete_department_response.json()["message"] == "部门下已有用户，不能删除"

    deleted_login_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "ops.user", "password": temporary_password},
    )
    assert deleted_login_response.status_code == 401

    permissions = options["permissions"]
    permission_by_code = {item["code"]: item for item in permissions}
    update_role_response = await api_client.patch(
        "/api/v1/organization/roles/role-finance/permissions",
        headers=headers,
        json={
            "permission_ids": [
                permission_by_code["dashboard:view"]["id"],
                permission_by_code["finance:view"]["id"],
                permission_by_code["reporting:view"]["id"],
            ],
        },
    )
    assert update_role_response.status_code == 200
    assert update_role_response.json()["data"]["code"] == "finance"
    assert {
        item["code"] for item in update_role_response.json()["data"]["permissions"]
    } == {
        "dashboard:view",
        "finance:view",
        "reporting:view",
    }

    finance_token = await _token(api_client, "finance", "finance123")
    finance_menus_response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    finance_paths = {item["path"] for item in finance_menus_response.json()["data"]["menus"]}
    assert "/reporting" in finance_paths
    assert "/organization/users" not in finance_paths


async def test_non_super_admin_cannot_manage_organization_users_or_role_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    demo_token = await _token(api_client, "demo", "demo123")
    headers = {"Authorization": f"Bearer {demo_token}"}

    list_response = await api_client.get("/api/v1/organization/users", headers=headers)
    assert list_response.status_code == 403
    assert list_response.json()["code"] == "PERMISSION_DENIED"
    assert list_response.json()["message"] == "缺少组织管理权限"

    create_response = await api_client.post(
        "/api/v1/organization/users",
        headers=headers,
        json={
            "username": "blocked.user",
            "display_name": "无权限用户",
            "department_id": "dept-sales",
            "role_ids": ["role-sales-manager"],
        },
    )
    assert create_response.status_code == 403
    assert create_response.json()["code"] == "PERMISSION_DENIED"

    update_role_response = await api_client.patch(
        "/api/v1/organization/roles/role-finance/permissions",
        headers=headers,
        json={"permission_ids": ["perm-dashboard-view"]},
    )
    assert update_role_response.status_code == 403
    assert update_role_response.json()["code"] == "PERMISSION_DENIED"


async def test_only_super_admin_menu_contains_organization_management(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user"]["roles"] == ["超级管理员"]
    assert "system:super_admin" in data["user"]["permissions"]
    assert any(item["path"] == "/organization/users" for item in data["menus"])

    demo_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
    )
    assert demo_response.status_code == 200
    assert all(
        item["path"] != "/organization/users"
        for item in demo_response.json()["data"]["menus"]
    )
