from httpx import AsyncClient


async def _token(client: AsyncClient, username: str, password: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return str(response.json()["data"]["access_token"])


async def test_any_logged_in_user_can_read_company_info(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    demo_token = await _token(api_client, "demo", "demo123")
    response = await api_client.get(
        "/api/v1/organization/company",
        headers={"Authorization": f"Bearer {demo_token}"},
    )
    assert response.status_code == 200
    assert "name" in response.json()["data"]


async def test_super_admin_can_update_company_info(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    admin_token = await _token(api_client, "admin", "admin123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    update_response = await api_client.patch(
        "/api/v1/organization/company",
        headers=headers,
        json={
            "name": "远景国际贸易有限公司",
            "name_en": "Vision Trading Co., Ltd.",
            "letterhead": "VISION TRADING CO., LTD.",
            "email": "info@vision.com",
            "bank_account": "6222001234567890",
        },
    )
    assert update_response.status_code == 200
    data = update_response.json()["data"]
    assert data["name"] == "远景国际贸易有限公司"
    assert data["name_en"] == "Vision Trading Co., Ltd."
    assert data["email"] == "info@vision.com"
    assert data["updated_at"] is not None

    # 再次读取应拿到已保存数据（单例持久化）。
    read_response = await api_client.get("/api/v1/organization/company", headers=headers)
    assert read_response.json()["data"]["name"] == "远景国际贸易有限公司"
    assert read_response.json()["data"]["bank_account"] == "6222001234567890"

    # 部分更新不应清空其他字段。
    partial_response = await api_client.patch(
        "/api/v1/organization/company",
        headers=headers,
        json={"phone": "+86-21-12345678"},
    )
    assert partial_response.status_code == 200
    assert partial_response.json()["data"]["phone"] == "+86-21-12345678"
    assert partial_response.json()["data"]["name"] == "远景国际贸易有限公司"


async def test_invalid_email_is_rejected(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    admin_token = await _token(api_client, "admin", "admin123")
    response = await api_client.patch(
        "/api/v1/organization/company",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "not-an-email"},
    )
    assert response.status_code == 422


async def test_non_super_admin_cannot_update_company_info(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    demo_token = await _token(api_client, "demo", "demo123")
    response = await api_client.patch(
        "/api/v1/organization/company",
        headers={"Authorization": f"Bearer {demo_token}"},
        json={"name": "越权公司"},
    )
    assert response.status_code == 403
