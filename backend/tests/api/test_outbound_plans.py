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


def _contract_payload(code: str) -> dict[str, object]:
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
        "remarks": "出库计划 API 前置出口合同",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "1000",
                "unit": "pcs",
                "unit_price": "1.40",
                "purchased_quantity": "1000",
                "shipped_quantity": "0",
                "image_url": "https://example.test/product.png",
                "remark": "出库计划 API 合同明细",
            }
        ],
    }


async def _approved_contract(
    api_client: AsyncClient,
    token: str,
    code: str,
) -> dict[str, object]:
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=_contract_payload(code),
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


async def _approved_shipment(api_client: AsyncClient, token: str) -> dict[str, object]:
    contract = await _approved_contract(api_client, token, "EC-OP-API")
    create_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SP-OP-API",
            "shipment_date": "2026-08-18",
            "planned_ship_date": "2026-08-20",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": "CONT-OP-API",
            "booking_no": "BOOK-OP-API",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "420.00",
            "remarks": "出库计划 API 发货计划",
            "selections": [{"contract_id": contract["id"], "quantity": "300"}],
        },
    )
    assert create_response.status_code == 201
    shipment = create_response.json()["data"]
    await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approve_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-19"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


async def test_outbound_plan_api_generates_from_shipment_and_schedules(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    shipment = await _approved_shipment(api_client, token)

    create_response = await api_client.post(
        "/api/v1/warehouse/outbound-plans/from-shipment",
        headers=headers,
        json={
            "shipment_plan_id": shipment["id"],
            "outbound_type": "finished_goods_outbound",
            "planned_date": None,
        },
    )
    assert create_response.status_code == 201
    plan = create_response.json()["data"]
    assert plan["source_code"] == "SP-OP-API"
    assert plan["status"] == "planned"
    assert plan["planned_date"] == "2026-08-20"
    assert plan["lines"][0]["planned_quantity"] == "300"

    schedule_response = await api_client.post(
        f"/api/v1/warehouse/outbound-plans/{plan['id']}/schedule",
        headers=headers,
        json={
            "planned_date": "2026-08-18",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-fg-01",
            "location_name": "成品区 A-01",
            "operator_name": "仓库主管",
        },
    )
    assert schedule_response.status_code == 200
    scheduled = schedule_response.json()["data"]
    assert scheduled["status"] == "scheduled"
    assert scheduled["location_name"] == "成品区 A-01"

    list_response = await api_client.get(
        "/api/v1/warehouse/outbound-plans",
        headers=headers,
        params={"q": "BAG-40", "outbound_type": "finished_goods_outbound"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] >= 1


async def test_outbound_plan_api_rejects_unauthorized_finance_and_invalid_payload(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    unauthorized_response = await api_client.get("/api/v1/warehouse/outbound-plans")
    assert unauthorized_response.status_code == 401

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    finance_response = await api_client.get(
        "/api/v1/warehouse/outbound-plans",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert finance_response.status_code == 403

    token = await _login_token(api_client)
    invalid_response = await api_client.post(
        "/api/v1/warehouse/outbound-plans/from-shipment",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "shipment_plan_id": "missing",
            "outbound_type": "bad_type",
            "planned_date": "2026-08-20",
        },
    )
    assert invalid_response.status_code == 422
