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


def _purchase_contract_payload(code: str) -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2026-08-05",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "currency": "USD",
        "delivery_date": "2026-08-30",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "stock_purchase",
        "remarks": "货物入库 API 测试",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "1000",
                "unit": "pcs",
                "unit_price": "1.2",
                "source_export_contract_id": None,
                "source_export_contract_no": None,
                "source_export_contract_line_id": None,
                "remark": "货物入库 API 测试",
            }
        ],
    }


async def test_inbound_order_api_formal_inbound_posts_inventory_and_supplier_records(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload("PC-IO-API"),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    await api_client.post(f"/api/v1/purchase/contracts/{contract['id']}/submit", headers=headers)
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-05"},
    )
    assert approve_response.status_code == 200
    plans_response = await api_client.get(
        "/api/v1/warehouse/inbound-plans",
        headers=headers,
        params={"q": "PC-IO-API"},
    )
    plan = plans_response.json()["data"]["items"][0]
    qc_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-IO-API",
            "purchase_contract_id": contract["id"],
            "inspected_at": "2026-08-19",
            "result": "passed",
            "inspector_id": "u-qc-001",
            "inspector_name": "QC 张工",
            "issue_summary": None,
            "attachment_group_id": "attach-qc-api",
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "120",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                    "remark": "首检通过",
                }
            ],
            "issues": [],
        },
    )
    assert qc_response.status_code == 201

    generate_response = await api_client.post(
        "/api/v1/warehouse/inbound-orders/from-plan",
        headers=headers,
        json={
            "plan_id": plan["id"],
            "code": "IO-API-001",
            "inbound_mode": "formal",
            "inbound_at": "2026-08-30",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-a-01",
            "location_name": "A-01",
            "operator_name": "仓库主管",
            "lines": [],
        },
    )
    assert generate_response.status_code == 201
    order = generate_response.json()["data"]
    assert order["status"] == "draft"

    submit_response = await api_client.post(
        f"/api/v1/warehouse/inbound-orders/{order['id']}/submit",
        headers=headers,
    )
    assert submit_response.status_code == 200
    approve_order_response = await api_client.post(
        f"/api/v1/warehouse/inbound-orders/{order['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-30"},
    )
    assert approve_order_response.status_code == 200
    approved_order = approve_order_response.json()["data"]
    assert approved_order["status"] == "approved"
    assert approved_order["lines"][0]["stock_status"] == "available"

    balances_response = await api_client.get(
        "/api/v1/warehouse/inbound-orders/inventory-balances",
        headers=headers,
        params={"q": "BAG-40"},
    )
    assert balances_response.status_code == 200
    balance = balances_response.json()["data"]["items"][0]
    assert balance["available_quantity"] == "1000"
    assert balance["pending_inspection_quantity"] == "0"

    ledgers_response = await api_client.get(
        "/api/v1/warehouse/inbound-orders/inventory-ledgers",
        headers=headers,
        params={"source_id": order["id"]},
    )
    assert ledgers_response.status_code == 200
    ledger = ledgers_response.json()["data"]["items"][0]
    assert ledger["quantity"] == "1000"
    assert ledger["stock_status"] == "available"

    supplier_records_response = await api_client.get(
        "/api/v1/warehouse/inbound-orders",
        headers=headers,
        params={"supplier_id": "supplier-pack-a"},
    )
    assert supplier_records_response.status_code == 200
    assert supplier_records_response.json()["data"]["total"] >= 1


async def test_inbound_order_api_rejects_unauthorized_finance_and_invalid_payload(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    unauthorized_response = await api_client.get("/api/v1/warehouse/inbound-orders")
    assert unauthorized_response.status_code == 401

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    finance_response = await api_client.get(
        "/api/v1/warehouse/inbound-orders",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert finance_response.status_code == 403

    token = await _login_token(api_client)
    invalid_response = await api_client.post(
        "/api/v1/warehouse/inbound-orders/from-plan",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plan_id": "missing",
            "code": "IO-BAD",
            "inbound_mode": "bad",
            "inbound_at": "2026-08-30",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-a-01",
            "location_name": "A-01",
            "operator_name": "仓库主管",
            "lines": [],
        },
    )
    assert invalid_response.status_code == 422
