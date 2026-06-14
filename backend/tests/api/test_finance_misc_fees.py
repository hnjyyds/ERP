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


async def _approved_shipment(
    api_client: AsyncClient,
    token: str,
    *,
    contract_no: str = "EC-MISC-API-001",
    shipment_no: str = "SP-MISC-API-001",
) -> dict[str, object]:
    contract_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": contract_no,
            "contract_date": "2026-12-01",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2026-12-25",
            "payment_terms": "30% T/T in advance, balance before shipment",
            "source_quotation_id": f"quotation-{contract_no}",
            "source_quotation_no": f"QT-{contract_no}",
            "remarks": "杂费分摊前置出口合同",
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
                    "remark": "杂费分摊合同",
                },
            ],
        },
    )
    assert contract_response.status_code == 201
    contract = contract_response.json()["data"]
    await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-12-02"},
    )
    assert approve_response.status_code == 200

    shipment_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": shipment_no,
            "shipment_date": "2026-12-20",
            "planned_ship_date": "2026-12-25",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": f"CONT-{shipment_no}",
            "booking_no": f"BOOK-{shipment_no}",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "420.00",
            "remarks": "杂费分摊前置出货单",
            "selections": [{"contract_id": contract["id"], "quantity": "50"}],
        },
    )
    assert shipment_response.status_code == 201
    shipment = shipment_response.json()["data"]
    await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    approved_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-12-21"},
    )
    assert approved_response.status_code == 200
    return approved_response.json()["data"]


async def test_finance_misc_fee_item_allocation_and_profit(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    shipment = await _approved_shipment(api_client, business_token)

    item_response = await api_client.post(
        "/api/v1/finance/misc-fee-items",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "code": "OFFICE-API",
            "name": "办公费用",
            "category": "office",
            "default_allocation_method": "manual",
            "is_active": True,
            "remark": "日常办公费用分摊",
        },
    )
    assert item_response.status_code == 201
    item = item_response.json()["data"]
    assert item["status"] == "active"
    assert item["default_allocation_method"] == "manual"

    allocation_response = await api_client.post(
        "/api/v1/finance/misc-fee-allocations",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "allocation_no": "MFA-API-001",
            "item_id": item["id"],
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "allocated_at": "2026-12-22",
            "amount": "36.00",
            "currency": "USD",
            "allocation_method": "manual",
            "basis": "按本票业务实际占用分摊",
            "remark": "办公费用分摊",
        },
    )
    assert allocation_response.status_code == 201
    allocation = allocation_response.json()["data"]
    assert allocation["item_name"] == "办公费用"
    assert allocation["amount"] == "36.00"
    assert allocation["status"] == "allocated"

    summary_response = await api_client.get(
        "/api/v1/finance/misc-fee-allocations/summary",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"shipment_no": shipment["code"]},
    )
    assert summary_response.status_code == 200
    summary = summary_response.json()["data"]
    assert summary["total"] == 1
    assert summary["total_allocated_amount"] == "36.00"
    assert summary["items"][0]["allocation_no"] == "MFA-API-001"

    overview_response = await api_client.get(
        "/api/v1/finance/overview",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert overview_response.status_code == 200
    overview = overview_response.json()["data"]
    shipment_profit = next(
        item for item in overview["shipment_profit_items"] if item["code"] == shipment["code"]
    )
    assert shipment_profit["profit_amount"] == "144.00"


async def test_finance_misc_fee_rejects_invalid_allocation_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    shipment = await _approved_shipment(
        api_client,
        business_token,
        contract_no="EC-MISC-API-002",
        shipment_no="SP-MISC-API-002",
    )

    denied_response = await api_client.post(
        "/api/v1/finance/misc-fee-items",
        headers={"Authorization": f"Bearer {business_token}"},
        json={
            "code": "INTEREST-DENIED",
            "name": "资金占用利息",
            "category": "capital_interest",
            "default_allocation_method": "ratio",
        },
    )
    assert denied_response.status_code == 403

    item_response = await api_client.post(
        "/api/v1/finance/misc-fee-items",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "code": "REFUND-INTEREST",
            "name": "退税利息",
            "category": "tax_refund_interest",
            "default_allocation_method": "ratio",
        },
    )
    assert item_response.status_code == 201
    item = item_response.json()["data"]

    currency_response = await api_client.post(
        "/api/v1/finance/misc-fee-allocations",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "allocation_no": "MFA-CURRENCY-API",
            "item_id": item["id"],
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "allocated_at": "2026-12-22",
            "amount": "12.00",
            "currency": "CNY",
            "allocation_method": "ratio",
        },
    )
    assert currency_response.status_code == 422

    inactive_item_response = await api_client.post(
        "/api/v1/finance/misc-fee-items",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "code": "INACTIVE-MISC",
            "name": "停用杂费",
            "category": "office",
            "default_allocation_method": "manual",
            "is_active": False,
        },
    )
    assert inactive_item_response.status_code == 201
    inactive_item = inactive_item_response.json()["data"]
    assert inactive_item["status"] == "inactive"

    inactive_response = await api_client.post(
        "/api/v1/finance/misc-fee-allocations",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "allocation_no": "MFA-INACTIVE-API",
            "item_id": inactive_item["id"],
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "allocated_at": "2026-12-22",
            "amount": "12.00",
            "currency": "USD",
            "allocation_method": "manual",
        },
    )
    assert inactive_response.status_code == 422

    unauthorized_response = await api_client.get("/api/v1/finance/misc-fee-allocations/summary")
    assert unauthorized_response.status_code == 401
