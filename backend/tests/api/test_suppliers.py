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


def _supplier_payload(code: str = "S-CN-001") -> dict[str, object]:
    return {
        "code": code,
        "cn_name": "华东包装制品厂",
        "en_name": "East China Packaging Factory",
        "country": "China",
        "address": "Ningbo Industrial Zone",
        "website": "https://example.com/east-pack",
        "status": "active",
        "contacts": [
            {
                "name": "Li Wei",
                "title": "Sales Manager",
                "email": "liwei@example.com",
                "phone": "+86-574-0000",
                "is_primary": True,
            }
        ],
        "credit_profile": {
            "credit_grade": "A",
            "credit_limit": "80000",
            "currency": "CNY",
            "payment_terms": "30% deposit, 70% before shipment",
            "risk_note": "长期合作供应商",
        },
    }


async def test_supplier_create_detail_search_update_and_transactions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    create_response = await api_client.post(
        "/api/v1/masterdata/suppliers",
        headers={"Authorization": f"Bearer {token}"},
        json=_supplier_payload(),
    )
    assert create_response.status_code == 201
    supplier = create_response.json()["data"]
    assert supplier["code"] == "S-CN-001"
    assert supplier["country"] == "China"
    assert supplier["primary_contact"]["name"] == "Li Wei"
    assert supplier["credit_profile"]["credit_grade"] == "A"
    assert supplier["credit_profile"]["credit_limit"] == "80000.00"

    supplier_id = supplier["id"]
    detail_response = await api_client.get(
        f"/api/v1/masterdata/suppliers/{supplier_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["id"] == supplier_id

    list_response = await api_client.get(
        "/api/v1/masterdata/suppliers",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "Li Wei", "country": "China", "credit_grade": "A"},
    )
    assert list_response.status_code == 200
    list_data = list_response.json()["data"]
    assert list_data["total"] == 1
    assert list_data["items"][0]["code"] == "S-CN-001"

    update_response = await api_client.put(
        f"/api/v1/masterdata/suppliers/{supplier_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "cn_name": "华东包装制品集团",
            "en_name": "East China Packaging Group",
            "country": "China",
            "address": "Ningbo Industrial Zone, Building B",
            "website": "https://example.com/east-pack-group",
            "status": "active",
            "credit_profile": {
                "credit_grade": "B",
                "credit_limit": "96000",
                "currency": "CNY",
                "payment_terms": "20% deposit, 80% before shipment",
                "risk_note": "产能扩大后需复核交期",
            },
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["cn_name"] == "华东包装制品集团"
    assert updated["credit_profile"]["credit_grade"] == "B"
    assert updated["credit_profile"]["credit_limit"] == "96000.00"

    transactions_response = await api_client.get(
        f"/api/v1/masterdata/suppliers/{supplier_id}/transactions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert transactions_response.status_code == 200
    assert transactions_response.json()["data"] == {"items": [], "total": 0}

    delete_response = await api_client.delete(
        f"/api/v1/masterdata/suppliers/{supplier_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["status"] == "inactive"


async def test_supplier_primary_contact_can_be_replaced(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/suppliers",
        headers={"Authorization": f"Bearer {token}"},
        json=_supplier_payload(code="S-CN-002"),
    )
    supplier_id = create_response.json()["data"]["id"]

    contact_response = await api_client.post(
        f"/api/v1/masterdata/suppliers/{supplier_id}/contacts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Zhang Min",
            "title": "Production Planner",
            "email": "zhangmin@example.com",
            "phone": "+86-574-1111",
            "is_primary": True,
        },
    )
    assert contact_response.status_code == 201

    detail_response = await api_client.get(
        f"/api/v1/masterdata/suppliers/{supplier_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    contacts = detail_response.json()["data"]["contacts"]
    primary_contacts = [item for item in contacts if item["is_primary"]]
    assert [item["name"] for item in primary_contacts] == ["Zhang Min"]


async def test_supplier_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/masterdata/suppliers")

    assert response.status_code == 401


async def test_supplier_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/masterdata/suppliers",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
