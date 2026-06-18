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


async def test_supplier_contact_update_and_delete(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/suppliers",
        headers={"Authorization": f"Bearer {token}"},
        json=_supplier_payload(code="S-CONTACT-003"),
    )
    supplier = create_response.json()["data"]
    supplier_id = supplier["id"]
    original_contact_id = supplier["contacts"][0]["id"]

    contact_response = await api_client.post(
        f"/api/v1/masterdata/suppliers/{supplier_id}/contacts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Zhang Min",
            "title": "Production Planner",
            "email": "zhangmin@example.com",
            "phone": "+86-574-1111",
            "is_primary": False,
        },
    )
    contact_id = contact_response.json()["data"]["id"]

    update_response = await api_client.put(
        f"/api/v1/masterdata/suppliers/{supplier_id}/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Zhang Min Updated",
            "title": "Production Lead",
            "email": "zhang.updated@example.com",
            "phone": "+86-574-9999",
            "is_primary": True,
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["name"] == "Zhang Min Updated"
    assert updated["is_primary"] is True

    detail_response = await api_client.get(
        f"/api/v1/masterdata/suppliers/{supplier_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    contacts = detail_response.json()["data"]["contacts"]
    primary_contacts = [item for item in contacts if item["is_primary"]]
    assert [item["id"] for item in primary_contacts] == [contact_id]

    delete_response = await api_client.delete(
        f"/api/v1/masterdata/suppliers/{supplier_id}/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["id"] == contact_id

    final_detail_response = await api_client.get(
        f"/api/v1/masterdata/suppliers/{supplier_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    final_contacts = final_detail_response.json()["data"]["contacts"]
    assert [item["id"] for item in final_contacts] == [original_contact_id]
    assert final_contacts[0]["is_primary"] is False


async def test_supplier_transactions_collect_supplier_quotation_and_purchase_contract(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    create_supplier_response = await api_client.post(
        "/api/v1/masterdata/suppliers",
        headers=headers,
        json=_supplier_payload(code="S-TXN-001"),
    )
    assert create_supplier_response.status_code == 201
    supplier = create_supplier_response.json()["data"]
    supplier_id = supplier["id"]

    inquiry_response = await api_client.post(
        "/api/v1/purchase/inquiries",
        headers=headers,
        json={
            "code": "PI-SUPPLIER-TXN-001",
            "inquiry_date": "2026-08-01",
            "buyer_user_id": "u-001",
            "buyer_user_name": "演示业务主管",
            "remarks": "供应商业务记录询价",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "1000",
                    "unit": "pcs",
                }
            ],
        },
    )
    assert inquiry_response.status_code == 201
    inquiry = inquiry_response.json()["data"]
    inquiry_id = inquiry["id"]
    inquiry_line_id = inquiry["lines"][0]["id"]

    quote_response = await api_client.post(
        f"/api/v1/purchase/inquiries/{inquiry_id}/quotations",
        headers=headers,
        json={
            "inquiry_line_id": inquiry_line_id,
            "supplier_id": supplier_id,
            "supplier_name": supplier["cn_name"],
            "quoted_at": "2026-08-02",
            "unit_price": "0.82",
            "currency": "USD",
            "lead_time_days": 18,
            "min_order_quantity": "800",
            "sample_available": False,
            "remark": "供应商业务记录报价",
        },
    )
    assert quote_response.status_code == 201

    purchase_contract_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json={
            "code": "PC-SUPPLIER-TXN-001",
            "contract_date": "2026-08-05",
            "supplier_id": supplier_id,
            "supplier_name": supplier["cn_name"],
            "buyer_user_id": "u-001",
            "buyer_user_name": "演示业务主管",
            "currency": "USD",
            "delivery_date": "2026-08-28",
            "payment_terms": "30% 预付，70% 出货前",
            "source_type": "stock_purchase",
            "remarks": "供应商业务记录采购合同",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "1000",
                    "unit": "pcs",
                    "unit_price": "0.82",
                    "source_export_contract_id": None,
                    "source_export_contract_no": None,
                    "source_export_contract_line_id": None,
                    "remark": "供应商业务记录采购合同",
                }
            ],
        },
    )
    assert purchase_contract_response.status_code == 201

    transactions_response = await api_client.get(
        f"/api/v1/masterdata/suppliers/{supplier_id}/transactions",
        headers=headers,
    )
    assert transactions_response.status_code == 200
    transactions = transactions_response.json()["data"]["items"]
    by_type = {item["source_type"]: item for item in transactions}
    assert by_type["supplier_quotation"]["source_code"] == "PI-SUPPLIER-TXN-001"
    assert by_type["supplier_quotation"]["amount"] == "820.00"
    assert by_type["purchase_contract"]["source_code"] == "PC-SUPPLIER-TXN-001"
    assert by_type["purchase_contract"]["amount"] == "820.00"


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
