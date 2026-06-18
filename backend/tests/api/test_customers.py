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

    delete_response = await api_client.delete(
        f"/api/v1/masterdata/customers/{customer_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["status"] == "inactive"


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


async def test_customer_contact_update_and_delete(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/masterdata/customers",
        headers={"Authorization": f"Bearer {token}"},
        json=_customer_payload(code="C-CONTACT-003"),
    )
    customer = create_response.json()["data"]
    customer_id = customer["id"]
    original_contact_id = customer["contacts"][0]["id"]

    contact_response = await api_client.post(
        f"/api/v1/masterdata/customers/{customer_id}/contacts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Bob Carter",
            "title": "Import Director",
            "email": "bob@example.com",
            "phone": "+1-212-0000",
            "is_primary": False,
        },
    )
    contact_id = contact_response.json()["data"]["id"]

    update_response = await api_client.put(
        f"/api/v1/masterdata/customers/{customer_id}/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Robert Carter",
            "title": "Import Lead",
            "email": "robert@example.com",
            "phone": "+1-212-9999",
            "is_primary": True,
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["name"] == "Robert Carter"
    assert updated["is_primary"] is True

    detail_response = await api_client.get(
        f"/api/v1/masterdata/customers/{customer_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    contacts = detail_response.json()["data"]["contacts"]
    primary_contacts = [item for item in contacts if item["is_primary"]]
    assert [item["id"] for item in primary_contacts] == [contact_id]

    delete_response = await api_client.delete(
        f"/api/v1/masterdata/customers/{customer_id}/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["id"] == contact_id

    final_detail_response = await api_client.get(
        f"/api/v1/masterdata/customers/{customer_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    final_contacts = final_detail_response.json()["data"]["contacts"]
    assert [item["id"] for item in final_contacts] == [original_contact_id]
    assert final_contacts[0]["is_primary"] is False


async def test_customer_transactions_close_sales_chain_from_quotation_to_shipment(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    customer_response = await api_client.post(
        "/api/v1/masterdata/customers",
        headers={"Authorization": f"Bearer {token}"},
        json=_customer_payload(code="C-SALES-CHAIN-001"),
    )
    assert customer_response.status_code == 201
    customer = customer_response.json()["data"]
    customer_id = customer["id"]

    quotation_response = await api_client.post(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "QT-CUST-CHAIN-001",
            "quote_date": "2026-07-01",
            "customer_id": customer_id,
            "customer_name": customer["cn_name"],
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "valid_until": "2026-07-15",
            "description": "客户交易记录闭环报价",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "1000",
                    "unit": "pcs",
                    "unit_price": "1.25",
                    "freight_method": "sea",
                    "freight_amount": "120.00",
                    "purchase_reference_supplier_name": "华东包装制品厂",
                    "purchase_reference_price": "0.82",
                    "remark": "首单报价",
                }
            ],
        },
    )
    assert quotation_response.status_code == 201
    quotation = quotation_response.json()["data"]
    quotation_id = quotation["id"]
    await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approve_quotation_response = await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-02"},
    )
    assert approve_quotation_response.status_code == 200
    contract_response = await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/confirm-contract",
        headers={"Authorization": f"Bearer {token}"},
        json={"confirmed_at": "2026-07-03", "contract_no": "EC-CUST-CHAIN-001"},
    )
    assert contract_response.status_code == 200
    contract_id = contract_response.json()["data"]["contract_id"]

    submit_contract_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_contract_response.status_code == 200
    approve_contract_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-06"},
    )
    assert approve_contract_response.status_code == 200

    shipment_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SP-CUST-CHAIN-001",
            "shipment_date": "2026-08-18",
            "planned_ship_date": "2026-08-20",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": "CONT-CUST-CHAIN-001",
            "booking_no": "BOOK-CUST-CHAIN-001",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "780.00",
            "remarks": "客户交易记录闭环出货",
            "selections": [{"contract_id": contract_id, "quantity": "300"}],
        },
    )
    assert shipment_response.status_code == 201
    shipment_id = shipment_response.json()["data"]["id"]
    await api_client.post(
        f"/api/v1/sales/shipments/{shipment_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approve_shipment_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-19"},
    )
    assert approve_shipment_response.status_code == 200

    transactions_response = await api_client.get(
        f"/api/v1/masterdata/customers/{customer_id}/transactions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert transactions_response.status_code == 200
    transactions = transactions_response.json()["data"]["items"]
    by_type = {item["source_type"]: item for item in transactions}
    assert by_type["export_quotation"]["source_code"] == "QT-CUST-CHAIN-001"
    assert by_type["export_quotation"]["amount"] == "1370.00"
    assert by_type["export_contract"]["source_code"] == "EC-CUST-CHAIN-001"
    assert by_type["shipment"]["source_code"] == "SP-CUST-CHAIN-001"


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
