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
    contract_no: str = "EC-TAX-API-001",
    shipment_no: str = "SP-TAX-API-001",
) -> dict[str, object]:
    contract_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": contract_no,
            "contract_date": "2026-11-01",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "trade_term": "FOB Ningbo",
            "planned_ship_date": "2026-11-30",
            "payment_terms": "30% T/T in advance, balance before shipment",
            "source_quotation_id": f"quotation-{contract_no}",
            "source_quotation_no": f"QT-{contract_no}",
            "remarks": "核销退税前置出口合同",
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
                    "remark": "核销退税合同",
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
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-11-02"},
    )
    assert approve_response.status_code == 200

    shipment_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": shipment_no,
            "shipment_date": "2026-11-25",
            "planned_ship_date": "2026-11-30",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": f"CONT-{shipment_no}",
            "booking_no": f"BOOK-{shipment_no}",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "420.00",
            "remarks": "核销退税前置出货单",
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
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-11-26"},
    )
    assert approved_response.status_code == 200
    return approved_response.json()["data"]


async def _create_verification_document(
    api_client: AsyncClient,
    token: str,
    shipment: dict[str, object],
    *,
    document_no: str = "VD-TAX-API-001",
) -> dict[str, object]:
    response = await api_client.post(
        "/api/v1/finance/verification-documents",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "document_no": document_no,
            "received_at": "2026-11-27",
            "owner_user_id": "u-001",
            "owner_user_name": "演示业务主管",
            "shipment_plan_id": shipment["id"],
            "shipment_no": shipment["code"],
            "customer_name": shipment["customer_name"],
            "currency": "USD",
            "refundable_amount": "96.00",
            "valid_until": "2026-12-27",
            "remark": "核销单领用",
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


async def test_finance_tax_refund_document_lifecycle_and_profit(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    shipment = await _approved_shipment(api_client, business_token)
    original_profit = "180.00"

    document = await _create_verification_document(api_client, finance_token, shipment)
    assert document["document_no"] == "VD-TAX-API-001"
    assert document["status"] == "issued"
    assert document["reminder_date"] == "2026-12-20"
    assert document["reminder_status"] == "pending"
    assert document["reminder_message"] == "核销单 VD-TAX-API-001 将于 2026-12-27 到期"
    assert document["refundable_amount"] == "96.00"
    assert document["refunded_amount"] == "0.00"

    usage_response = await api_client.get(
        "/api/v1/finance/verification-usage",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"shipment_no": shipment["code"]},
    )
    assert usage_response.status_code == 200
    usage = usage_response.json()["data"]
    assert usage["total"] == 1
    assert usage["items"][0]["document_no"] == "VD-TAX-API-001"
    assert usage["items"][0]["status"] == "issued"

    customs_response = await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/customs-receipt",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "customs_declaration_no": "CD-TAX-API-001",
            "customs_receipt_no": "CR-TAX-API-001",
            "received_at": "2026-11-28",
            "remark": "报关回单登记",
        },
    )
    assert customs_response.status_code == 200
    customs_registered = customs_response.json()["data"]
    assert customs_registered["status"] == "customs_receipt_registered"
    assert customs_registered["customs_receipt_no"] == "CR-TAX-API-001"

    verify_response = await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/verify",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "verification_no": "VERIFY-TAX-API-001",
            "verified_at": "2026-12-01",
            "remark": "核销登记",
        },
    )
    assert verify_response.status_code == 200
    verified = verify_response.json()["data"]
    assert verified["status"] == "verified"
    assert verified["verification_no"] == "VERIFY-TAX-API-001"
    assert verified["reminder_status"] == "done"

    refund_response = await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/tax-refunds",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "refund_no": "TR-TAX-API-001",
            "refunded_at": "2026-12-08",
            "amount": "96.00",
            "currency": "USD",
            "bank_receipt_no": "BR-TAX-API-001",
            "remark": "退税登记",
        },
    )
    assert refund_response.status_code == 201
    refunded = refund_response.json()["data"]
    assert refunded["status"] == "refunded"
    assert refunded["refunded_amount"] == "96.00"
    assert refunded["refunds"][0]["refund_no"] == "TR-TAX-API-001"

    overview_response = await api_client.get(
        "/api/v1/finance/overview",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert overview_response.status_code == 200
    overview = overview_response.json()["data"]
    shipment_profit = next(
        item for item in overview["shipment_profit_items"] if item["code"] == shipment["code"]
    )
    assert shipment_profit["profit_amount"] == f"{float(original_profit) + 96:.2f}"


async def test_finance_tax_refund_rejects_excess_amount_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    shipment = await _approved_shipment(
        api_client,
        business_token,
        contract_no="EC-TAX-API-002",
        shipment_no="SP-TAX-API-002",
    )
    document = await _create_verification_document(
        api_client,
        finance_token,
        shipment,
        document_no="VD-TAX-API-002",
    )

    denied_response = await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/tax-refunds",
        headers={"Authorization": f"Bearer {business_token}"},
        json={
            "refund_no": "TR-TAX-DENIED",
            "refunded_at": "2026-12-08",
            "amount": "12.00",
            "currency": "USD",
        },
    )
    assert denied_response.status_code == 403

    unauthorized_response = await api_client.get("/api/v1/finance/verification-usage")
    assert unauthorized_response.status_code == 401

    await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/customs-receipt",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "customs_declaration_no": "CD-TAX-API-002",
            "customs_receipt_no": "CR-TAX-API-002",
            "received_at": "2026-11-28",
        },
    )
    await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/verify",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "verification_no": "VERIFY-TAX-API-002",
            "verified_at": "2026-12-01",
        },
    )
    excess_response = await api_client.post(
        f"/api/v1/finance/verification-documents/{document['id']}/tax-refunds",
        headers={"Authorization": f"Bearer {finance_token}"},
        json={
            "refund_no": "TR-TAX-EXCESS",
            "refunded_at": "2026-12-08",
            "amount": "120.00",
            "currency": "USD",
            "remark": "超额退税",
        },
    )
    assert excess_response.status_code == 422
