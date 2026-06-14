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


async def _approved_export_contract(api_client: AsyncClient, token: str) -> dict[str, object]:
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "EC-FIN-API-001",
            "contract_date": "2026-07-03",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2026-08-10",
            "payment_terms": "30% T/T in advance, balance before shipment",
            "source_quotation_id": "quotation-fin-api-001",
            "source_quotation_no": "QT-FIN-API-001",
            "remarks": "财务总览测试合同",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "100",
                    "unit": "pcs",
                    "unit_price": "12.00",
                    "purchased_quantity": "100",
                    "shipped_quantity": "0",
                    "image_url": "https://example.test/product.png",
                    "remark": "财务总览前置合同",
                }
            ],
        },
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-06"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


async def _shipment(api_client: AsyncClient, token: str) -> dict[str, object]:
    contract = await _approved_export_contract(api_client, token)
    response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SP-FIN-API-001",
            "shipment_date": "2026-08-18",
            "planned_ship_date": "2026-08-20",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": "CONT-FIN-001",
            "booking_no": "BOOK-FIN-001",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "40.00",
            "remarks": "财务总览出运",
            "selections": [{"contract_id": contract["id"], "quantity": "10"}],
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


async def _purchase_invoice_notice(api_client: AsyncClient, token: str) -> dict[str, object]:
    generate_response = await api_client.post(
        "/api/v1/purchase/invoice-notices/from-customs-declaration",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customs_declaration_id": "cd-fin-api-001",
            "customs_declaration_no": "CD-FIN-API-001",
            "declaration_date": "2026-09-03",
            "notice_date": "2026-09-04",
            "currency": "CNY",
            "remarks": "财务总览测试开票通知",
            "lines": [
                {
                    "supplier_id": "supplier-pack-a",
                    "supplier_name": "华东包装制品厂",
                    "purchase_contract_id": "pc-fin-api-001",
                    "purchase_contract_no": "PC-FIN-API-001",
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "customs_name": "环保购物袋",
                    "invoice_name": "无纺布购物袋",
                    "quantity": "100",
                    "unit": "pcs",
                    "amount": "300.00",
                    "remark": "财务总览供应商开票",
                }
            ],
        },
    )
    assert generate_response.status_code == 201
    notice = generate_response.json()["data"]["items"][0]
    send_response = await api_client.post(
        f"/api/v1/purchase/invoice-notices/{notice['id']}/send",
        headers={"Authorization": f"Bearer {token}"},
        json={"sender_name": "演示业务主管", "sent_at": "2026-09-05"},
    )
    assert send_response.status_code == 200
    return send_response.json()["data"]


async def _sample_fee(api_client: AsyncClient, token: str) -> dict[str, object]:
    request_response = await api_client.post(
        "/api/v1/sample/requests",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SR-FIN-API-001",
            "request_date": "2026-06-20",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "product_id": "product-bag",
            "product_code": "BAG-40",
            "product_name": "Eco Shopping Bag",
            "supplier_id": "supplier-pack",
            "supplier_name": "华东包装制品厂",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "destination": "factory",
            "requirements": "财务总览样品费测试。",
            "due_date": "2026-06-28",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "quantity": "3",
                    "unit": "pcs",
                    "requirement": "绿色样、自然色各一。",
                }
            ],
        },
    )
    assert request_response.status_code == 201
    request_id = request_response.json()["data"]["id"]
    fee_response = await api_client.post(
        f"/api/v1/sample/requests/{request_id}/fees",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "fee_type": "sample_making",
            "amount": "50.00",
            "currency": "USD",
            "payee_type": "supplier",
            "payee_name": "华东包装制品厂",
            "remark": "财务总览样品费",
        },
    )
    assert fee_response.status_code == 201
    fee = fee_response.json()["data"]
    payment_response = await api_client.post(
        f"/api/v1/sample/requests/{request_id}/fees/{fee['id']}/payment-request",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert payment_response.status_code == 200
    return payment_response.json()["data"]


async def _partner(api_client: AsyncClient, token: str) -> dict[str, object]:
    response = await api_client.post(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "P-FIN-API-001",
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
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


async def test_finance_overview_aggregates_cross_module_amounts_for_finance_user(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    shipment = await _shipment(api_client, business_token)
    await _purchase_invoice_notice(api_client, business_token)
    await _sample_fee(api_client, business_token)
    await _partner(api_client, business_token)

    finance_token = await _login_token(api_client, "finance", "finance123")
    response = await api_client.get(
        "/api/v1/finance/overview",
        headers={"Authorization": f"Bearer {finance_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["summary"] == {
        "shipment_count": 1,
        "currency_label": "USD",
        "receivable_amount": "120.00",
        "payable_amount": "40.00",
        "profit_amount": "80.00",
        "profit_rate": "66.67",
        "invoice_notice_count": 1,
        "invoice_notice_amount": "300.00",
        "sample_fee_count": 1,
        "sample_fee_amount": "50.00",
        "partner_count": 1,
        "active_partner_count": 1,
    }
    assert data["currency_summaries"] == [
        {
            "currency": "USD",
            "shipment_count": 1,
            "receivable_amount": "120.00",
            "payable_amount": "40.00",
            "profit_amount": "80.00",
            "profit_rate": "66.67",
        }
    ]
    assert data["invoice_notice_statuses"] == [
        {"status": "sent", "currency": "CNY", "count": 1, "amount": "300.00"}
    ]
    assert data["sample_fee_statuses"] == [
        {"status": "requested", "currency": "USD", "count": 1, "amount": "50.00"}
    ]
    assert data["partner_type_summaries"] == [
        {"partner_type": "freight_forwarder", "count": 1}
    ]
    assert data["shipment_profit_items"][0]["id"] == shipment["id"]
    assert data["shipment_profit_items"][0]["code"] == "SP-FIN-API-001"
    assert data["shipment_profit_items"][0]["profit_amount"] == "80.00"


async def test_finance_overview_requires_login_and_finance_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    unauthorized_response = await api_client.get("/api/v1/finance/overview")
    assert unauthorized_response.status_code == 401

    business_token = await _login_token(api_client)
    forbidden_response = await api_client.get(
        "/api/v1/finance/overview",
        headers={"Authorization": f"Bearer {business_token}"},
    )
    assert forbidden_response.status_code == 403
