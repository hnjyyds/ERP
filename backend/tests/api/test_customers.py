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


def _customer_payload(code: str = "C-EU-001") -> dict[str, object]:
    return {
        "code": code,
        "cn_name": "欧陆家居用品有限公司",
        "en_name": "Euro Home Retail Ltd.",
        "country": "Germany",
        "address": "Hamburg Trade Center",
        "website": "https://example.com/euro-home",
        "status": "active",
        "contacts": [
            {
                "name": "Anna Schmidt",
                "title": "Sourcing Manager",
                "email": "anna@example.com",
                "phone": "+49-40-0000",
                "is_primary": True,
            }
        ],
        "credit_profile": {
            "credit_grade": "A",
            "credit_limit": "50000",
            "currency": "USD",
            "payment_terms": "T/T 30 days",
            "risk_note": "稳定采购，账期可控",
        },
    }


async def test_customer_create_detail_search_update_and_transactions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    create_response = await api_client.post(
        "/api/v1/masterdata/customers",
        headers={"Authorization": f"Bearer {token}"},
        json=_customer_payload(),
    )
    assert create_response.status_code == 201
    customer = create_response.json()["data"]
    assert customer["code"] == "C-EU-001"
    assert customer["country"] == "Germany"
    assert customer["primary_contact"]["name"] == "Anna Schmidt"
    assert customer["credit_profile"]["credit_grade"] == "A"
    assert customer["credit_profile"]["credit_limit"] == "50000.00"

    customer_id = customer["id"]
    detail_response = await api_client.get(
        f"/api/v1/masterdata/customers/{customer_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["id"] == customer_id

    list_response = await api_client.get(
        "/api/v1/masterdata/customers",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "Anna", "country": "Germany", "credit_grade": "A"},
    )
    assert list_response.status_code == 200
    list_data = list_response.json()["data"]
    assert list_data["total"] == 1
    assert list_data["items"][0]["code"] == "C-EU-001"

    update_response = await api_client.put(
        f"/api/v1/masterdata/customers/{customer_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "cn_name": "欧陆家居用品集团",
            "en_name": "Euro Home Retail Group",
            "country": "Germany",
            "address": "Hamburg Trade Center, Building B",
            "website": "https://example.com/euro-home-group",
            "status": "active",
            "credit_profile": {
                "credit_grade": "B",
                "credit_limit": "62000",
                "currency": "USD",
                "payment_terms": "T/T 45 days",
                "risk_note": "额度调整后需主管复核",
            },
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["cn_name"] == "欧陆家居用品集团"
    assert updated["credit_profile"]["credit_grade"] == "B"
    assert updated["credit_profile"]["credit_limit"] == "62000.00"

    transactions_response = await api_client.get(
        f"/api/v1/masterdata/customers/{customer_id}/transactions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert transactions_response.status_code == 200
    assert transactions_response.json()["data"] == {"items": [], "total": 0}


async def test_customer_primary_contact_can_be_replaced(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/customers",
        headers={"Authorization": f"Bearer {token}"},
        json=_customer_payload(code="C-US-002"),
    )
    customer_id = create_response.json()["data"]["id"]

    contact_response = await api_client.post(
        f"/api/v1/masterdata/customers/{customer_id}/contacts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Bob Carter",
            "title": "Import Director",
            "email": "bob@example.com",
            "phone": "+1-212-0000",
            "is_primary": True,
        },
    )
    assert contact_response.status_code == 201

    detail_response = await api_client.get(
        f"/api/v1/masterdata/customers/{customer_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    contacts = detail_response.json()["data"]["contacts"]
    primary_contacts = [item for item in contacts if item["is_primary"]]
    assert [item["name"] for item in primary_contacts] == ["Bob Carter"]


async def test_customer_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/masterdata/customers")

    assert response.status_code == 401


async def test_customer_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/masterdata/customers",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
