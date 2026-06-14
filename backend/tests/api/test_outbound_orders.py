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


def _export_contract_payload(code: str) -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2026-09-01",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "planned_ship_date": "2026-09-30",
        "payment_terms": "30% T/T in advance, balance before shipment",
        "source_quotation_id": f"quotation-{code}",
        "source_quotation_no": f"QT-{code}",
        "remarks": "货物出库 API 前置出口合同",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "300",
                "unit": "pcs",
                "unit_price": "1.40",
                "purchased_quantity": "0",
                "shipped_quantity": "0",
                "image_url": "https://example.test/product.png",
                "remark": "货物出库 API 合同明细",
            }
        ],
    }


async def _approved_export_contract(
    api_client: AsyncClient,
    token: str,
    code: str,
) -> dict[str, object]:
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers=headers,
        json=_export_contract_payload(code),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    await api_client.post(f"/api/v1/sales/contracts/{contract['id']}/submit", headers=headers)
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-09-02"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


def _purchase_contract_payload(
    code: str,
    export_contract: dict[str, object],
) -> dict[str, object]:
    export_lines = export_contract["lines"]
    assert isinstance(export_lines, list)
    export_line = export_lines[0]
    assert isinstance(export_line, dict)
    return {
        "code": code,
        "contract_date": "2026-09-03",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "currency": "USD",
        "delivery_date": "2026-09-20",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "export_contract",
        "remarks": "货物出库 API 前置采购合同",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "300",
                "unit": "pcs",
                "unit_price": "1.20",
                "source_export_contract_id": export_contract["id"],
                "source_export_contract_no": export_contract["code"],
                "source_export_contract_line_id": export_line["id"],
                "remark": "货物出库 API 采购明细",
            }
        ],
    }


async def _approved_purchase_contract_with_stock(
    api_client: AsyncClient,
    token: str,
    export_contract: dict[str, object],
) -> dict[str, object]:
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload("PC-OO-API", export_contract),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    await api_client.post(f"/api/v1/purchase/contracts/{contract['id']}/submit", headers=headers)
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-09-03"},
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    plans_response = await api_client.get(
        "/api/v1/warehouse/inbound-plans",
        headers=headers,
        params={"q": "PC-OO-API"},
    )
    assert plans_response.status_code == 200
    inbound_plan = plans_response.json()["data"]["items"][0]
    qc_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-OO-API",
            "purchase_contract_id": approved["id"],
            "inspected_at": "2026-09-18",
            "result": "passed",
            "inspector_id": "u-qc-001",
            "inspector_name": "QC 张工",
            "issue_summary": None,
            "attachment_group_id": "attach-qc-oo-api",
            "lines": [
                {
                    "purchase_contract_line_id": approved["lines"][0]["id"],
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "300",
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
    inbound_response = await api_client.post(
        "/api/v1/warehouse/inbound-orders/from-plan",
        headers=headers,
        json={
            "plan_id": inbound_plan["id"],
            "code": "IO-OO-API",
            "inbound_mode": "formal",
            "inbound_at": "2026-09-20",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-fg-01",
            "location_name": "成品区 A-01",
            "operator_name": "仓库主管",
            "lines": [],
        },
    )
    assert inbound_response.status_code == 201
    inbound_order = inbound_response.json()["data"]
    await api_client.post(
        f"/api/v1/warehouse/inbound-orders/{inbound_order['id']}/submit",
        headers=headers,
    )
    approve_inbound_response = await api_client.post(
        f"/api/v1/warehouse/inbound-orders/{inbound_order['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-09-20"},
    )
    assert approve_inbound_response.status_code == 200
    return approved


async def _approved_shipment(
    api_client: AsyncClient,
    token: str,
    export_contract: dict[str, object],
) -> dict[str, object]:
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers=headers,
        json={
            "code": "SP-OO-API",
            "shipment_date": "2026-09-25",
            "planned_ship_date": "2026-09-30",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": "CONT-OO-API",
            "booking_no": "BOOK-OO-API",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "420.00",
            "remarks": "货物出库 API 发货计划",
            "selections": [{"contract_id": export_contract["id"], "quantity": "300"}],
        },
    )
    assert create_response.status_code == 201
    shipment = create_response.json()["data"]
    await api_client.post(f"/api/v1/sales/shipments/{shipment['id']}/submit", headers=headers)
    approve_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-09-26"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


async def test_outbound_order_api_formal_outbound_deducts_stock_and_records(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    export_contract = await _approved_export_contract(api_client, token, "EC-OO-API")
    await _approved_purchase_contract_with_stock(api_client, token, export_contract)
    shipment = await _approved_shipment(api_client, token, export_contract)

    create_plan_response = await api_client.post(
        "/api/v1/warehouse/outbound-plans/from-shipment",
        headers=headers,
        json={
            "shipment_plan_id": shipment["id"],
            "outbound_type": "finished_goods_outbound",
            "planned_date": "2026-09-30",
        },
    )
    assert create_plan_response.status_code == 201
    plan = create_plan_response.json()["data"]
    schedule_response = await api_client.post(
        f"/api/v1/warehouse/outbound-plans/{plan['id']}/schedule",
        headers=headers,
        json={
            "planned_date": "2026-09-30",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-fg-01",
            "location_name": "成品区 A-01",
            "operator_name": "仓库主管",
        },
    )
    assert schedule_response.status_code == 200

    generate_response = await api_client.post(
        "/api/v1/warehouse/outbound-orders/from-plan",
        headers=headers,
        json={
            "plan_id": plan["id"],
            "code": "OO-API-001",
            "outbound_mode": "formal",
            "outbound_at": "2026-09-30",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-fg-01",
            "location_name": "成品区 A-01",
            "operator_name": "仓库主管",
            "exception_reason": None,
            "lines": [],
        },
    )
    assert generate_response.status_code == 201
    order = generate_response.json()["data"]
    assert order["status"] == "draft"
    assert order["lines"][0]["quantity"] == "300"

    submit_response = await api_client.post(
        f"/api/v1/warehouse/outbound-orders/{order['id']}/submit",
        headers=headers,
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/warehouse/outbound-orders/{order['id']}/approve",
        headers=headers,
        json={
            "reviewer_name": "演示业务主管",
            "approved_at": "2026-09-30",
            "allow_negative": False,
        },
    )
    assert approve_response.status_code == 200
    approved_order = approve_response.json()["data"]
    assert approved_order["status"] == "approved"

    balances_response = await api_client.get(
        "/api/v1/warehouse/inbound-orders/inventory-balances",
        headers=headers,
        params={"q": "BAG-40"},
    )
    assert balances_response.status_code == 200
    balance = balances_response.json()["data"]["items"][0]
    assert balance["available_quantity"] == "0"

    ledgers_response = await api_client.get(
        "/api/v1/warehouse/inbound-orders/inventory-ledgers",
        headers=headers,
        params={"source_id": order["id"]},
    )
    assert ledgers_response.status_code == 200
    ledger = ledgers_response.json()["data"]["items"][0]
    assert ledger["direction"] == "out"
    assert ledger["quantity"] == "300"

    records_response = await api_client.get(
        "/api/v1/warehouse/outbound-orders",
        headers=headers,
        params={"q": "OO-API-001", "status": "approved"},
    )
    assert records_response.status_code == 200
    assert records_response.json()["data"]["total"] == 1


async def test_outbound_order_api_rejects_unauthorized_finance_and_invalid_payload(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    unauthorized_response = await api_client.get("/api/v1/warehouse/outbound-orders")
    assert unauthorized_response.status_code == 401

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    finance_response = await api_client.get(
        "/api/v1/warehouse/outbound-orders",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert finance_response.status_code == 403

    token = await _login_token(api_client)
    invalid_response = await api_client.post(
        "/api/v1/warehouse/outbound-orders/from-plan",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plan_id": "missing",
            "code": "OO-BAD",
            "outbound_mode": "bad",
            "outbound_at": "2026-09-30",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-fg-01",
            "location_name": "成品区 A-01",
            "operator_name": "仓库主管",
            "lines": [],
        },
    )
    assert invalid_response.status_code == 422
