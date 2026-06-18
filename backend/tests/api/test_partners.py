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


def _partner_payload(code: str = "P-FWD-001") -> dict[str, object]:
    return {
        "code": code,
        "cn_name": "远航国际货代",
        "en_name": "Ocean Link Forwarding",
        "partner_type": "freight_forwarder",
        "country": "China",
        "address": "Shanghai Port Service Center",
        "website": "https://example.com/ocean-link",
        "status": "active",
        "contacts": [
            {
                "name": "Grace Lin",
                "title": "Operation Manager",
                "email": "grace@example.com",
                "phone": "+86-21-0000",
                "is_primary": True,
            }
        ],
    }


async def test_partner_create_detail_search_update_and_fee_records(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    create_response = await api_client.post(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
        json=_partner_payload(),
    )
    assert create_response.status_code == 201
    partner = create_response.json()["data"]
    assert partner["code"] == "P-FWD-001"
    assert partner["partner_type"] == "freight_forwarder"
    assert partner["primary_contact"]["name"] == "Grace Lin"

    partner_id = partner["id"]
    detail_response = await api_client.get(
        f"/api/v1/masterdata/partners/{partner_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["id"] == partner_id

    list_response = await api_client.get(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "Grace", "partner_type": "freight_forwarder"},
    )
    assert list_response.status_code == 200
    list_data = list_response.json()["data"]
    assert list_data["total"] == 1
    assert list_data["items"][0]["code"] == "P-FWD-001"

    update_response = await api_client.put(
        f"/api/v1/masterdata/partners/{partner_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "cn_name": "远航国际物流",
            "en_name": "Ocean Link Logistics",
            "partner_type": "freight_forwarder",
            "country": "China",
            "address": "Shanghai Port Service Center, Building B",
            "website": "https://example.com/ocean-link-logistics",
            "status": "active",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["cn_name"] == "远航国际物流"
    assert updated["en_name"] == "Ocean Link Logistics"

    fees_response = await api_client.get(
        f"/api/v1/masterdata/partners/{partner_id}/fee-records",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert fees_response.status_code == 200
    assert fees_response.json()["data"] == {"items": [], "total": 0}


async def test_partner_primary_contact_can_be_replaced(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
        json=_partner_payload(code="P-INS-002") | {"partner_type": "insurer"},
    )
    partner_id = create_response.json()["data"]["id"]

    contact_response = await api_client.post(
        f"/api/v1/masterdata/partners/{partner_id}/contacts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Mia Chen",
            "title": "Account Executive",
            "email": "mia@example.com",
            "phone": "+86-21-1111",
            "is_primary": True,
        },
    )
    assert contact_response.status_code == 201

    detail_response = await api_client.get(
        f"/api/v1/masterdata/partners/{partner_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    contacts = detail_response.json()["data"]["contacts"]
    primary_contacts = [item for item in contacts if item["is_primary"]]
    assert [item["name"] for item in primary_contacts] == ["Mia Chen"]


async def test_partner_contact_update_delete_and_deactivate(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
        json=_partner_payload(code="P-CONTACT-003"),
    )
    partner = create_response.json()["data"]
    partner_id = partner["id"]
    original_contact_id = partner["contacts"][0]["id"]

    contact_response = await api_client.post(
        f"/api/v1/masterdata/partners/{partner_id}/contacts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Mia Chen",
            "title": "Account Executive",
            "email": "mia@example.com",
            "phone": "+86-21-1111",
            "is_primary": False,
        },
    )
    contact_id = contact_response.json()["data"]["id"]

    update_response = await api_client.put(
        f"/api/v1/masterdata/partners/{partner_id}/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Mia Chen Updated",
            "title": "Account Lead",
            "email": "mia.updated@example.com",
            "phone": "+86-21-9999",
            "is_primary": True,
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["name"] == "Mia Chen Updated"
    assert updated["is_primary"] is True

    detail_response = await api_client.get(
        f"/api/v1/masterdata/partners/{partner_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    contacts = detail_response.json()["data"]["contacts"]
    primary_contacts = [item for item in contacts if item["is_primary"]]
    assert [item["id"] for item in primary_contacts] == [contact_id]

    delete_contact_response = await api_client.delete(
        f"/api/v1/masterdata/partners/{partner_id}/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_contact_response.status_code == 200
    assert delete_contact_response.json()["data"]["id"] == contact_id

    final_detail_response = await api_client.get(
        f"/api/v1/masterdata/partners/{partner_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    final_contacts = final_detail_response.json()["data"]["contacts"]
    assert [item["id"] for item in final_contacts] == [original_contact_id]
    assert final_contacts[0]["is_primary"] is False

    deactivate_response = await api_client.delete(
        f"/api/v1/masterdata/partners/{partner_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert deactivate_response.status_code == 200
    assert deactivate_response.json()["data"]["status"] == "inactive"


async def test_partner_rejects_unknown_type(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
        json=_partner_payload(code="P-BAD-001") | {"partner_type": "unknown"},
    )

    assert response.status_code == 422


async def test_partner_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/masterdata/partners")

    assert response.status_code == 401


async def test_partner_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
