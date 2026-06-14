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


def _contract_payload(
    code: str,
    *,
    product_id: str = "product-bag",
    product_code: str = "BAG-40",
    product_name: str = "Eco Shopping Bag",
    quantity: str = "1000",
    unit_price: str = "1.40",
    shipped_quantity: str = "250",
) -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2026-07-03",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "planned_ship_date": "2026-08-10",
        "payment_terms": "30% T/T in advance, balance before shipment",
        "source_quotation_id": f"quotation-{code}",
        "source_quotation_no": f"QT-{code}",
        "remarks": "客户确认后签订出口合同",
        "lines": [
            {
                "product_id": product_id,
                "product_code": product_code,
                "product_name": product_name,
                "specification": "40x35cm",
                "model": product_code,
                "quantity": quantity,
                "unit": "pcs",
                "unit_price": unit_price,
                "purchased_quantity": quantity,
                "shipped_quantity": shipped_quantity,
                "image_url": "https://example.test/product.png",
                "remark": "出货明细前置合同",
            }
        ],
    }


async def _approved_contract(
    api_client: AsyncClient,
    token: str,
    payload: dict[str, object],
) -> dict[str, object]:
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-06"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


async def test_shipment_flow_from_contracts_approval_reminder_and_contract_writeback(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    contract_a = await _approved_contract(
        api_client,
        token,
        _contract_payload("EC-SHIP-API-A"),
    )
    contract_b = await _approved_contract(
        api_client,
        token,
        _contract_payload(
            "EC-SHIP-API-B",
            product_id="product-box",
            product_code="BOX-20",
            product_name="Gift Box",
            quantity="500",
            unit_price="2.10",
            shipped_quantity="0",
        ),
    )

    create_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SP-API-001",
            "shipment_date": "2026-08-18",
            "planned_ship_date": "2026-08-20",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": "CONT-API-001",
            "booking_no": "BOOK-API-001",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "780.00",
            "remarks": "两个出口合同合并出运",
            "selections": [
                {"contract_id": contract_a["id"], "quantity": "300"},
                {"contract_id": contract_b["id"], "quantity": "200"},
            ],
        },
    )
    assert create_response.status_code == 201
    shipment = create_response.json()["data"]
    assert shipment["code"] == "SP-API-001"
    assert shipment["approval_status"] == "draft"
    assert len(shipment["lines"]) == 2
    assert shipment["finance_overview"]["receivable_amount"] == "840.00"
    assert shipment["finance_overview"]["profit_amount"] == "60.00"
    assert shipment["reminder"]["reminder_date"] == "2026-08-13"
    shipment_id = shipment["id"]

    list_response = await api_client.get(
        "/api/v1/sales/shipments",
        headers={"Authorization": f"Bearer {token}"},
        params={"contract_id": contract_a["id"], "q": "SP-API-001"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1

    submit_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["data"]["approval_status"] == "submitted"

    approve_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-19"},
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["approval_status"] == "approved"
    assert approved["contract_progresses"][0]["shipment_statuses"][0]["status"] == "partial"

    reminders_response = await api_client.get(
        "/api/v1/sales/shipments/reminders",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert reminders_response.status_code == 200
    assert reminders_response.json()["data"]["items"][0]["shipment_no"] == "SP-API-001"

    contract_response = await api_client.get(
        f"/api/v1/sales/contracts/{contract_a['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert contract_response.status_code == 200
    refreshed_contract = contract_response.json()["data"]
    assert refreshed_contract["statistics"]["shipped_quantity"] == "550"


async def test_shipment_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/sales/shipments")

    assert response.status_code == 401


async def test_shipment_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/sales/shipments",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
