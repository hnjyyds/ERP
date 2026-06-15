from httpx import AsyncClient


async def test_login_returns_token_user_and_permission_menus(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["user"]["id"] == "u-001"
    assert data["user"]["username"] == "demo"
    assert data["user"]["display_name"] == "演示业务主管"
    assert data["user"]["department_name"] == "业务部"
    assert data["user"]["avatar_type"] == "preset"
    assert data["user"]["avatar_value"] == "amber-orbit"
    assert data["user"]["roles"] == ["业务主管"]
    assert set(data["user"]["permissions"]) == {
        "dashboard:view",
        "followup:plan:edit",
        "followup:plan:view",
        "followup:plan:view_all",
        "followup:template:edit",
        "followup:template:view",
        "masterdata:customer:credit:edit",
        "masterdata:customer:credit:view",
        "masterdata:customer:edit",
        "masterdata:customer:view",
        "masterdata:customer:view_all",
        "masterdata:document_party:edit",
        "masterdata:document_party:view",
        "masterdata:document_party:view_all",
        "masterdata:partner:edit",
        "masterdata:partner:view",
        "masterdata:partner:view_all",
        "masterdata:product:edit",
        "masterdata:product:export",
        "masterdata:product:view",
        "masterdata:supplier:credit:edit",
        "masterdata:supplier:credit:view",
        "masterdata:supplier:edit",
        "masterdata:supplier:view",
        "masterdata:supplier:view_all",
        "sample:delivery:approve",
        "sample:delivery:edit",
        "sample:delivery:fee:view",
        "sample:delivery:view",
        "sample:delivery:view_all",
        "sample:request:edit",
        "sample:request:fee:edit",
        "sample:request:view",
        "sample:request:view_all",
        "sample:record:edit",
        "sample:record:view",
        "sample:record:view_all",
        "schedule:create",
        "sales:quotation:approve",
        "sales:quotation:edit",
        "sales:quotation:export",
        "sales:quotation:view",
        "sales:quotation:view_all",
        "sales:contract:approve",
        "sales:contract:edit",
        "sales:contract:export",
        "sales:contract:view",
        "sales:contract:view_all",
        "sales:shipment:approve",
        "sales:shipment:edit",
        "sales:shipment:view",
        "sales:shipment:view_all",
        "purchase:inquiry:edit",
        "purchase:inquiry:export",
        "purchase:inquiry:view",
        "purchase:inquiry:view_all",
        "purchase:contract:approve",
        "purchase:contract:edit",
        "purchase:contract:view",
        "purchase:contract:view_all",
        "purchase:invoice_notice:edit",
        "purchase:invoice_notice:send",
        "purchase:invoice_notice:view",
        "purchase:invoice_notice:view_all",
        "purchase:followup:view",
        "quality:inspection:edit",
        "quality:inspection:view",
        "quality:inspection:view_all",
        "reporting:view",
        "warehouse:inbound_plan:edit",
        "warehouse:inbound_plan:view",
        "warehouse:inbound_plan:view_all",
        "warehouse:inbound_order:approve",
        "warehouse:inbound_order:edit",
        "warehouse:inbound_order:view",
        "warehouse:inbound_order:view_all",
        "warehouse:outbound_plan:edit",
        "warehouse:outbound_plan:view",
        "warehouse:outbound_plan:view_all",
        "warehouse:outbound_order:allow_negative",
        "warehouse:outbound_order:approve",
        "warehouse:outbound_order:edit",
        "warehouse:outbound_order:view",
        "warehouse:outbound_order:view_all",
    }
    assert [item["label"] for item in data["menus"]] == [
        "工作桌面",
        "商品资料",
        "客户资料",
        "供应商资料",
        "合作伙伴",
        "单证资料",
        "打样管理",
        "样品登记",
        "寄样管理",
        "出口报价",
        "出口合同",
        "出货明细",
        "采购询价",
        "采购合同",
        "开票通知",
        "采购跟单",
        "QC 查验",
        "入库计划",
        "货物入库",
        "出库计划",
        "货物出库",
        "经理查询",
    ]


async def test_login_rejects_invalid_password(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "wrong-password"},
    )

    assert response.status_code == 401


async def test_current_user_and_menus_require_bearer_token(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    login_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "finance", "password": "finance123"},
    )
    token = login_response.json()["data"]["access_token"]

    me_response = await api_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["data"]["user"]["display_name"] == "演示财务"
    assert me_response.json()["data"]["user"]["avatar_value"] == "sage-pulse"

    menus_response = await api_client.get(
        "/api/v1/system/menus",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert menus_response.status_code == 200
    assert [item["label"] for item in menus_response.json()["data"]["menus"]] == [
        "工作桌面",
        "财务管理",
    ]

    unauthorized_response = await api_client.get("/api/v1/system/menus")
    assert unauthorized_response.status_code == 401


async def test_assignable_users_require_authentication(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    login_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
    )
    token = login_response.json()["data"]["access_token"]

    response = await api_client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    users = response.json()["data"]["users"]
    assert {item["id"] for item in users} == {"u-admin", "u-001", "u-finance"}
    assert {item["display_name"] for item in users} == {"演示管理员", "演示业务主管", "演示财务"}
    assert all("avatar_type" in item and "avatar_value" in item for item in users)

    unauthorized_response = await api_client.get("/api/v1/auth/users")
    assert unauthorized_response.status_code == 401


async def test_current_user_can_update_own_avatar(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    login_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
    )
    token = login_response.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_response = await api_client.patch(
        "/api/v1/auth/me/avatar",
        headers=headers,
        json={"avatar_type": "preset", "avatar_value": "blueprint-grid"},
    )

    assert update_response.status_code == 200
    assert update_response.json()["data"]["user"]["avatar_value"] == "blueprint-grid"
    assert update_response.json()["data"]["menus"]

    current_response = await api_client.get("/api/v1/auth/me", headers=headers)
    assert current_response.status_code == 200
    assert current_response.json()["data"]["user"]["avatar_value"] == "blueprint-grid"

    invalid_response = await api_client.patch(
        "/api/v1/auth/me/avatar",
        headers=headers,
        json={"avatar_type": "preset", "avatar_value": "unknown-avatar"},
    )
    assert invalid_response.status_code == 422
