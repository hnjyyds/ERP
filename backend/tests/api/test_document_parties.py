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


def _party_payload(code: str = "DP-CNEE-001") -> dict[str, object]:
    return {
        "code": code,
        "party_type": "consignee",
        "display_name": "Euro Home Hamburg GmbH",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "country": "Germany",
        "address": "Hamburg Trade Center, HafenCity",
        "contact_person": "Anna Schmidt",
        "email": "anna.docs@example.com",
        "phone": "+49-40-0000",
        "bank_name": None,
        "swift_code": None,
        "account_no": None,
        "tax_id": "DE123456789",
        "remarks": "默认收货人",
        "is_default": True,
        "status": "active",
    }


async def test_document_party_create_detail_search_update_and_lookup(
    api_client: AsyncClient,
    seeded_system: None,
    reference_master_data: None,
) -> None:
    token = await _login_token(api_client)

    create_response = await api_client.post(
        "/api/v1/masterdata/document-parties",
        headers={"Authorization": f"Bearer {token}"},
        json=_party_payload(),
    )
    assert create_response.status_code == 201
    party = create_response.json()["data"]
    assert party["code"] == "DP-CNEE-001"
    assert party["party_type"] == "consignee"
    assert party["display_name"] == "Euro Home Hamburg GmbH"
    assert party["is_default"] is True

    party_id = party["id"]
    detail_response = await api_client.get(
        f"/api/v1/masterdata/document-parties/{party_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["id"] == party_id

    list_response = await api_client.get(
        "/api/v1/masterdata/document-parties",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "q": "Hamburg",
            "party_type": "consignee",
            "customer_id": "customer-euro-home",
        },
    )
    assert list_response.status_code == 200
    list_data = list_response.json()["data"]
    assert list_data["total"] == 1
    assert list_data["items"][0]["code"] == "DP-CNEE-001"

    update_response = await api_client.put(
        f"/api/v1/masterdata/document-parties/{party_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "party_type": "consignee",
            "display_name": "Euro Home Bremen GmbH",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "country": "Germany",
            "address": "Bremen Logistics Center",
            "contact_person": "Anna Schmidt",
            "email": "anna.docs@example.com",
            "phone": "+49-421-0000",
            "bank_name": None,
            "swift_code": None,
            "account_no": None,
            "tax_id": "DE123456789",
            "remarks": "更新后的收货人",
            "is_default": True,
            "status": "active",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["display_name"] == "Euro Home Bremen GmbH"
    assert updated["address"] == "Bremen Logistics Center"

    lookup_response = await api_client.get(
        "/api/v1/masterdata/document-parties/lookup",
        headers={"Authorization": f"Bearer {token}"},
        params={"party_type": "consignee", "customer_id": "customer-euro-home"},
    )
    assert lookup_response.status_code == 200
    lookup_data = lookup_response.json()["data"]
    assert lookup_data["total"] == 1
    assert lookup_data["items"][0]["id"] == party_id

    delete_response = await api_client.delete(
        f"/api/v1/masterdata/document-parties/{party_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["status"] == "inactive"
    assert delete_response.json()["data"]["is_default"] is False

    inactive_lookup_response = await api_client.get(
        "/api/v1/masterdata/document-parties/lookup",
        headers={"Authorization": f"Bearer {token}"},
        params={"party_type": "consignee", "customer_id": "customer-euro-home"},
    )
    assert inactive_lookup_response.status_code == 200
    assert inactive_lookup_response.json()["data"]["total"] == 0


async def test_document_party_list_supports_pagination_and_summary(
    api_client: AsyncClient,
    seeded_system: None,
    reference_master_data: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    for index, party_type in enumerate(["consignee", "consignee", "issuing_bank"], start=1):
        payload = _party_payload(code=f"DP-PAGE-00{index}") | {
            "party_type": party_type,
            "is_default": index == 1,
        }
        created = await api_client.post(
            "/api/v1/masterdata/document-parties", headers=headers, json=payload
        )
        assert created.status_code == 201

    first_page = await api_client.get(
        "/api/v1/masterdata/document-parties",
        headers=headers,
        params={"q": "DP-PAGE", "limit": 2, "offset": 0},
    )
    assert first_page.status_code == 200
    first_data = first_page.json()["data"]
    assert first_data["total"] == 3
    assert len(first_data["items"]) == 2
    assert first_data["summary"] == {
        "total": 3,
        "default_count": 1,
        "consignee_count": 2,
        "issuing_bank_count": 1,
    }

    second_page = await api_client.get(
        "/api/v1/masterdata/document-parties",
        headers=headers,
        params={"q": "DP-PAGE", "limit": 2, "offset": 2},
    )
    assert second_page.status_code == 200
    second_data = second_page.json()["data"]
    assert second_data["total"] == 3
    assert len(second_data["items"]) == 1

    filtered = await api_client.get(
        "/api/v1/masterdata/document-parties",
        headers=headers,
        params={"q": "DP-PAGE", "status": "inactive"},
    )
    assert filtered.status_code == 200
    assert filtered.json()["data"]["total"] == 0


async def test_document_party_rejects_duplicate_code(
    api_client: AsyncClient,
    seeded_system: None,
    reference_master_data: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    payload = _party_payload(code="DP-DUP-001")

    first = await api_client.post(
        "/api/v1/masterdata/document-parties", headers=headers, json=payload
    )
    assert first.status_code == 201

    duplicate = await api_client.post(
        "/api/v1/masterdata/document-parties", headers=headers, json=payload
    )
    assert duplicate.status_code == 422
    assert "单证资料编码已存在" in duplicate.text


async def test_document_party_rejects_unknown_type(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/masterdata/document-parties",
        headers={"Authorization": f"Bearer {token}"},
        json=_party_payload(code="DP-BAD-001") | {"party_type": "unknown"},
    )

    assert response.status_code == 422


async def test_document_party_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/masterdata/document-parties")

    assert response.status_code == 401


async def test_document_party_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/masterdata/document-parties",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
