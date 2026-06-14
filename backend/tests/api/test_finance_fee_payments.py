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


async def _create_partner(
    api_client: AsyncClient,
    token: str,
    *,
    code: str = "P-FEE-API-001",
) -> dict[str, object]:
    response = await api_client.post(
        "/api/v1/masterdata/partners",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": code,
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


async def _approved_shipment(
    api_client: AsyncClient,
    token: str,
    *,
    contract_no: str = "EC-FEE-API-001",
    shipment_no: str = "SP-FEE-API-001",
) -> dict[str, object]:
    contract_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": contract_no,
            "contract_date": "2026-10-01",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2026-10-30",
            "payment_terms": "30% T/T in advance, balance before shipment",
            "source_quotation_id": f"quotation-{contract_no}",
            "source_quotation_no": f"QT-{contract_no}",
            "remarks": "付费管理前置出口合同",
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
                    "remark": "付费管理合同",
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
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-10-02"},
    )
    assert approve_response.status_code == 200

    shipment_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": shipment_no,
            "shipment_date": "2026-10-25",
            "planned_ship_date": "2026-10-30",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": f"CONT-{shipment_no}",
            "booking_no": f"BOOK-{shipment_no}",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "420.00",
            "remarks": "付费管理前置出货单",
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
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-10-26"},
    )
    assert approved_response.status_code == 200
    return approved_response.json()["data"]


async def _create_partner_fee_invoice(
    api_client: AsyncClient,
    token: str,
    partner: dict[str, object],
    shipment: dict[str, object],
    *,
    invoice_no: str = "PFI-FEE-API-001",
) -> dict[str, object]:
    response = await api_client.post(
        "/api/v1/finance/partner-fee-invoices",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "invoice_no": invoice_no,
            "invoice_date": "2026-10-27",
            "partner_id": partner["id"],
            "partner_name": partner["cn_name"],
            "partner_type": partner["partner_type"],
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "fee_type": "freight",
            "total_amount": "980.00",
            "currency": "USD",
            "due_date": "2026-11-05",
            "remark": "货代运费发票",
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


async def test_finance_fee_payment_flow_invoice_request_approve_and_payables(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    partner = await _create_partner(api_client, business_token)
    shipment = await _approved_shipment(api_client, business_token)

    invoice = await _create_partner_fee_invoice(api_client, finance_token, partner, shipment)
    assert invoice["invoice_no"] == "PFI-FEE-API-001"
    assert invoice["status"] == "unpaid"
    assert invoice["fee_type"] == "freight"
    assert invoice["total_amount"] == "980.00"
    assert invoice["paid_amount"] == "0.00"
    assert invoice["unpaid_amount"] == "980.00"
    assert invoice["shipment_no"] == "SP-FEE-API-001"

    request_response = await api_client.post(
        "/api/v1/finance/fee-payment-requests",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "request_no": "FPR-FEE-API-001",
            "partner_fee_invoice_id": invoice["id"],
            "request_date": "2026-10-28",
            "requested_amount": "400.00",
            "currency": "USD",
            "remark": "首笔货代费",
        },
    )
    assert request_response.status_code == 201
    fee_request = request_response.json()["data"]
    assert fee_request["status"] == "submitted"
    assert fee_request["approved_amount"] == "0.00"
    assert fee_request["paid_amount"] == "0.00"
    assert fee_request["partner_fee_invoice_no"] == "PFI-FEE-API-001"

    approve_response = await api_client.post(
        f"/api/v1/finance/fee-payment-requests/{fee_request['id']}/approve",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "approved_amount": "400.00",
            "approved_at": "2026-10-29",
            "reviewer_name": "演示财务",
            "payment_account": "BOC 8899",
            "remark": "财务审批付费",
        },
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["status"] == "approved"
    assert approved["paid_amount"] == "400.00"

    invoice_list_response = await api_client.get(
        "/api/v1/finance/partner-fee-invoices",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"q": "PFI-FEE-API-001", "status": "partial"},
    )
    assert invoice_list_response.status_code == 200
    invoices = invoice_list_response.json()["data"]
    assert invoices["total"] == 1
    assert invoices["items"][0]["paid_amount"] == "400.00"
    assert invoices["items"][0]["unpaid_amount"] == "580.00"

    payable_response = await api_client.get(
        "/api/v1/finance/fee-payables",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={
            "partner_id": partner["id"],
            "shipment_no": "SP-FEE-API-001",
            "fee_type": "freight",
        },
    )
    assert payable_response.status_code == 200
    payables = payable_response.json()["data"]
    assert payables["total"] == 1
    assert payables["total_payable_amount"] == "580.00"
    assert payables["items"][0]["invoice_no"] == "PFI-FEE-API-001"
    assert payables["items"][0]["partner_name"] == "远航国际货代"
    assert payables["items"][0]["shipment_no"] == "SP-FEE-API-001"
    assert payables["items"][0]["fee_type"] == "freight"
    assert payables["items"][0]["paid_amount"] == "400.00"
    assert payables["items"][0]["payable_amount"] == "580.00"
    assert payables["items"][0]["status"] == "partial"


async def test_finance_fee_payment_rejects_excess_amount_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    partner = await _create_partner(api_client, business_token, code="P-FEE-API-OVER")
    shipment = await _approved_shipment(
        api_client,
        business_token,
        contract_no="EC-FEE-API-OVER",
        shipment_no="SP-FEE-API-OVER",
    )
    invoice = await _create_partner_fee_invoice(
        api_client,
        finance_token,
        partner,
        shipment,
        invoice_no="PFI-FEE-API-OVER",
    )

    forbidden_request_response = await api_client.post(
        "/api/v1/finance/fee-payment-requests",
        headers={"Authorization": f"Bearer {business_token}"},
        json={
            "request_no": "FPR-FORBIDDEN",
            "partner_fee_invoice_id": invoice["id"],
            "request_date": "2026-10-28",
            "requested_amount": "100.00",
            "currency": "USD",
            "remark": None,
        },
    )
    assert forbidden_request_response.status_code == 403

    excess_request_response = await api_client.post(
        "/api/v1/finance/fee-payment-requests",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "request_no": "FPR-FEE-API-OVER",
            "partner_fee_invoice_id": invoice["id"],
            "request_date": "2026-10-28",
            "requested_amount": "1200.00",
            "currency": "USD",
            "remark": "超额付费",
        },
    )
    assert excess_request_response.status_code == 422

    unauthorized_response = await api_client.get("/api/v1/finance/fee-payment-requests")
    assert unauthorized_response.status_code == 401
