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


async def _approved_contract(
    api_client: AsyncClient,
    token: str,
    code: str = "EC-AR-API-001",
) -> dict[str, object]:
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
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
            "remarks": "财务收款前置合同",
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
                    "remark": "财务收款合同",
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


async def _create_receipt(
    api_client: AsyncClient,
    token: str,
    *,
    receipt_no: str = "BR-API-001",
    amount: str = "500.00",
) -> dict[str, object]:
    response = await api_client.post(
        "/api/v1/finance/receipts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "receipt_no": receipt_no,
            "received_at": "2026-08-01",
            "payer_name": "Euro Home Retail Ltd.",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "amount": amount,
            "currency": "USD",
            "bank_account": "BOC 6222 ****",
            "reference_no": f"SWIFT-{receipt_no}",
            "receipt_type": "advance",
            "remark": "客户预收款",
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


async def test_finance_receipt_flow_claim_allocate_and_receivables(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    contract = await _approved_contract(api_client, business_token)
    finance_token = await _login_token(api_client, "finance", "finance123")

    receipt = await _create_receipt(api_client, finance_token)

    assert receipt["status"] == "unclaimed"
    assert receipt["allocated_amount"] == "0.00"
    assert receipt["unallocated_amount"] == "500.00"
    assert receipt["claim_message"] == "银行水单 BR-API-001 待业务员认领"

    claim_response = await api_client.post(
        f"/api/v1/finance/receipts/{receipt['id']}/claim",
        headers={"Authorization": f"Bearer {business_token}"},
        json={"claimed_at": "2026-08-02", "note": "确认客户预收款"},
    )
    assert claim_response.status_code == 200
    claimed = claim_response.json()["data"]
    assert claimed["status"] == "claimed"
    assert claimed["claims"][0]["claimed_by_user_name"] == "演示业务主管"

    allocation_response = await api_client.post(
        f"/api/v1/finance/receipts/{receipt['id']}/allocations",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "allocation_type": "contract",
            "contract_id": contract["id"],
            "contract_no": contract["code"],
            "invoice_no": None,
            "allocated_at": "2026-08-03",
            "amount": "300.00",
            "currency": "USD",
            "remark": "分摊到出口合同",
        },
    )
    assert allocation_response.status_code == 201
    partially_allocated = allocation_response.json()["data"]
    assert partially_allocated["status"] == "partially_allocated"
    assert partially_allocated["allocated_amount"] == "300.00"
    assert partially_allocated["unallocated_amount"] == "200.00"

    advance_response = await api_client.post(
        f"/api/v1/finance/receipts/{receipt['id']}/allocations",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "allocation_type": "advance",
            "contract_id": contract["id"],
            "contract_no": contract["code"],
            "invoice_no": "INV-AR-API-001",
            "allocated_at": "2026-08-04",
            "amount": "200.00",
            "currency": "USD",
            "remark": "预收款分摊到出口发票",
        },
    )
    assert advance_response.status_code == 201
    allocated = advance_response.json()["data"]
    assert allocated["status"] == "allocated"
    assert allocated["allocated_amount"] == "500.00"
    assert allocated["unallocated_amount"] == "0.00"
    assert allocated["allocations"][1]["invoice_no"] == "INV-AR-API-001"

    list_response = await api_client.get(
        "/api/v1/finance/receipts",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"q": "BR-API-001", "status": "allocated"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1

    receivable_response = await api_client.get(
        "/api/v1/finance/receivables",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"contract_no": contract["code"], "invoice_no": "INV-AR-API-001"},
    )
    assert receivable_response.status_code == 200
    receivables = receivable_response.json()["data"]
    assert receivables["total"] == 1
    assert receivables["total_receivable_amount"] == "700.00"
    assert receivables["items"][0]["contract_no"] == contract["code"]
    assert receivables["items"][0]["total_amount"] == "1200.00"
    assert receivables["items"][0]["received_amount"] == "500.00"
    assert receivables["items"][0]["receivable_amount"] == "700.00"
    assert receivables["items"][0]["status"] == "partial"


async def test_finance_receipt_allocation_rejects_excess_amount_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    receipt = await _create_receipt(
        api_client,
        finance_token,
        receipt_no="BR-API-OVER",
        amount="100.00",
    )

    forbidden_create_response = await api_client.post(
        "/api/v1/finance/receipts",
        headers={"Authorization": f"Bearer {business_token}"},
        json={
            "receipt_no": "BR-FORBIDDEN",
            "received_at": "2026-08-01",
            "payer_name": "Euro Home Retail Ltd.",
            "customer_id": None,
            "customer_name": None,
            "amount": "100.00",
            "currency": "USD",
            "bank_account": "BOC 6222 ****",
            "reference_no": None,
            "receipt_type": "normal",
            "remark": None,
        },
    )
    assert forbidden_create_response.status_code == 403

    excess_response = await api_client.post(
        f"/api/v1/finance/receipts/{receipt['id']}/allocations",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "allocation_type": "invoice",
            "contract_id": None,
            "contract_no": None,
            "invoice_no": "INV-OVER-001",
            "allocated_at": "2026-08-04",
            "amount": "120.00",
            "currency": "USD",
            "remark": "超额分摊",
        },
    )
    assert excess_response.status_code == 422

    unauthorized_response = await api_client.get("/api/v1/finance/receipts")
    assert unauthorized_response.status_code == 401
