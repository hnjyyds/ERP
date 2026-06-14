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


async def _received_purchase_invoice_notice(
    api_client: AsyncClient,
    token: str,
    *,
    declaration_no: str = "CD-PAY-API-001",
    tax_invoice_no: str = "VAT-PAY-API-001",
) -> dict[str, object]:
    generate_response = await api_client.post(
        "/api/v1/purchase/invoice-notices/from-customs-declaration",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customs_declaration_id": f"cd-{declaration_no}",
            "customs_declaration_no": declaration_no,
            "declaration_date": "2026-09-03",
            "notice_date": "2026-09-04",
            "currency": "CNY",
            "remarks": "付款管理前置供应商发票",
            "lines": [
                {
                    "supplier_id": "supplier-pack-a",
                    "supplier_name": "华东包装制品厂",
                    "purchase_contract_id": "pc-pay-api-001",
                    "purchase_contract_no": "PC-PAY-API-001",
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "customs_name": "环保购物袋",
                    "invoice_name": "无纺布购物袋",
                    "quantity": "1000",
                    "unit": "pcs",
                    "amount": "3200.00",
                    "remark": "付款管理供应商发票",
                }
            ],
        },
    )
    assert generate_response.status_code == 201
    notice = generate_response.json()["data"]["items"][0]
    receive_response = await api_client.post(
        f"/api/v1/purchase/invoice-notices/{notice['id']}/receive-tax-invoice",
        headers={"Authorization": f"Bearer {token}"},
        json={"tax_invoice_no": tax_invoice_no, "received_at": "2026-09-09"},
    )
    assert receive_response.status_code == 200
    return receive_response.json()["data"]


async def _create_supplier_invoice(
    api_client: AsyncClient,
    token: str,
    notice: dict[str, object],
    *,
    invoice_no: str = "SI-PAY-API-001",
) -> dict[str, object]:
    response = await api_client.post(
        "/api/v1/finance/supplier-invoices",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "invoice_no": invoice_no,
            "invoice_date": "2026-09-09",
            "supplier_id": notice["supplier_id"],
            "supplier_name": notice["supplier_name"],
            "purchase_invoice_notice_id": notice["id"],
            "purchase_invoice_notice_code": notice["code"],
            "purchase_contract_id": "pc-pay-api-001",
            "purchase_contract_no": "PC-PAY-API-001",
            "total_amount": "3200.00",
            "currency": "CNY",
            "due_date": "2026-09-20",
            "remark": "供应商税票登记",
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


async def test_finance_payment_flow_invoice_request_approve_and_payables(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    notice = await _received_purchase_invoice_notice(api_client, business_token)

    invoice = await _create_supplier_invoice(api_client, finance_token, notice)
    assert invoice["invoice_no"] == "SI-PAY-API-001"
    assert invoice["status"] == "unpaid"
    assert invoice["total_amount"] == "3200.00"
    assert invoice["paid_amount"] == "0.00"
    assert invoice["unpaid_amount"] == "3200.00"
    assert invoice["purchase_invoice_notice_code"] == notice["code"]

    request_response = await api_client.post(
        "/api/v1/finance/payment-requests",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "request_no": "PR-PAY-API-001",
            "supplier_invoice_id": invoice["id"],
            "payment_type": "goods_payment",
            "request_date": "2026-09-10",
            "requested_amount": "1200.00",
            "currency": "CNY",
            "remark": "首笔货款",
        },
    )
    assert request_response.status_code == 201
    payment_request = request_response.json()["data"]
    assert payment_request["status"] == "submitted"
    assert payment_request["approved_amount"] == "0.00"
    assert payment_request["paid_amount"] == "0.00"
    assert payment_request["supplier_invoice_no"] == "SI-PAY-API-001"

    approve_response = await api_client.post(
        f"/api/v1/finance/payment-requests/{payment_request['id']}/approve",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "approved_amount": "1200.00",
            "approved_at": "2026-09-11",
            "reviewer_name": "演示财务",
            "payment_account": "BOC 8888",
            "remark": "财务审批并付款",
        },
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["status"] == "approved"
    assert approved["approved_amount"] == "1200.00"
    assert approved["paid_amount"] == "1200.00"

    invoice_list_response = await api_client.get(
        "/api/v1/finance/supplier-invoices",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"q": "SI-PAY-API-001", "status": "partial"},
    )
    assert invoice_list_response.status_code == 200
    invoices = invoice_list_response.json()["data"]
    assert invoices["total"] == 1
    assert invoices["items"][0]["status"] == "partial"
    assert invoices["items"][0]["paid_amount"] == "1200.00"
    assert invoices["items"][0]["unpaid_amount"] == "2000.00"

    payable_response = await api_client.get(
        "/api/v1/finance/payables",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"supplier_id": "supplier-pack-a", "purchase_contract_no": "PC-PAY-API-001"},
    )
    assert payable_response.status_code == 200
    payables = payable_response.json()["data"]
    assert payables["total"] == 1
    assert payables["total_payable_amount"] == "2000.00"
    assert payables["items"][0]["invoice_no"] == "SI-PAY-API-001"
    assert payables["items"][0]["total_amount"] == "3200.00"
    assert payables["items"][0]["paid_amount"] == "1200.00"
    assert payables["items"][0]["payable_amount"] == "2000.00"
    assert payables["items"][0]["status"] == "partial"

    final_request_response = await api_client.post(
        "/api/v1/finance/payment-requests",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "request_no": "PR-PAY-API-002",
            "supplier_invoice_id": invoice["id"],
            "payment_type": "goods_payment",
            "request_date": "2026-09-12",
            "requested_amount": "2000.00",
            "currency": "CNY",
            "remark": "尾款",
        },
    )
    assert final_request_response.status_code == 201
    final_request = final_request_response.json()["data"]

    final_approve_response = await api_client.post(
        f"/api/v1/finance/payment-requests/{final_request['id']}/approve",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "approved_amount": "2000.00",
            "approved_at": "2026-09-13",
            "reviewer_name": "演示财务",
            "payment_account": "BOC 8888",
            "remark": "尾款付清",
        },
    )
    assert final_approve_response.status_code == 200

    paid_payable_response = await api_client.get(
        "/api/v1/finance/payables",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"supplier_id": "supplier-pack-a", "status": "paid"},
    )
    assert paid_payable_response.status_code == 200
    paid_payables = paid_payable_response.json()["data"]
    assert paid_payables["total"] == 1
    assert paid_payables["items"][0]["status"] == "paid"
    assert paid_payables["items"][0]["paid_amount"] == "3200.00"
    assert paid_payables["items"][0]["payable_amount"] == "0.00"


async def test_finance_payment_rejects_excess_amount_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    notice = await _received_purchase_invoice_notice(
        api_client,
        business_token,
        declaration_no="CD-PAY-API-OVER",
        tax_invoice_no="VAT-PAY-API-OVER",
    )
    invoice = await _create_supplier_invoice(
        api_client,
        finance_token,
        notice,
        invoice_no="SI-PAY-API-OVER",
    )

    forbidden_request_response = await api_client.post(
        "/api/v1/finance/payment-requests",
        headers={"Authorization": f"Bearer {business_token}"},
        json={
            "request_no": "PR-FORBIDDEN",
            "supplier_invoice_id": invoice["id"],
            "payment_type": "goods_payment",
            "request_date": "2026-09-10",
            "requested_amount": "100.00",
            "currency": "CNY",
            "remark": None,
        },
    )
    assert forbidden_request_response.status_code == 403

    excess_request_response = await api_client.post(
        "/api/v1/finance/payment-requests",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "request_no": "PR-PAY-API-OVER",
            "supplier_invoice_id": invoice["id"],
            "payment_type": "goods_payment",
            "request_date": "2026-09-10",
            "requested_amount": "4000.00",
            "currency": "CNY",
            "remark": "超额付款",
        },
    )
    assert excess_request_response.status_code == 422

    unauthorized_response = await api_client.get("/api/v1/finance/payment-requests")
    assert unauthorized_response.status_code == 401
