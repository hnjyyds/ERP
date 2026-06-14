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


def _contract_payload(code: str = "EC-E2E-001") -> dict[str, object]:
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
        "source_quotation_id": "quotation-e2e",
        "source_quotation_no": "QT-E2E-001",
        "remarks": "客户确认后签订出口合同",
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
                "purchased_quantity": "400",
                "shipped_quantity": "250",
                "image_url": "https://example.test/bag.png",
                "remark": "首单合同",
            }
        ],
    }


def _quotation_payload(code: str = "QT-CONTRACT-E2E-001") -> dict[str, object]:
    return {
        "code": code,
        "quote_date": "2026-07-01",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "valid_until": "2026-07-15",
        "description": "环保购物袋首单报价，含海运费。",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "1000",
                "unit": "pcs",
                "unit_price": "1.25",
                "freight_method": "sea",
                "freight_amount": "120.00",
                "purchase_reference_supplier_name": "华东包装制品厂",
                "purchase_reference_price": "0.82",
                "remark": "首单报价",
            }
        ],
    }


async def test_export_contract_flow_signature_payment_statistics_export_and_event(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=_contract_payload("EC-E2E-001"),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    assert contract["code"] == "EC-E2E-001"
    assert contract["approval_status"] == "draft"
    assert contract["statistics"]["total_quantity"] == "1000"
    assert contract["statistics"]["total_amount"] == "1400.00"
    assert contract["statistics"]["shipped_quantity"] == "250"
    assert contract["statistics"]["unshipped_amount"] == "1050.00"
    assert contract["purchase_statuses"][0]["unpurchased_quantity"] == "600"
    assert contract["shipment_statuses"][0]["status"] == "partial"
    contract_id = contract["id"]

    payload = _contract_payload("EC-E2E-001")
    payload["payment_terms"] = "LC at sight"
    payload["lines"][0]["unit_price"] = "1.50"
    update_response = await api_client.put(
        f"/api/v1/sales/contracts/{contract_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["payment_terms"] == "LC at sight"
    assert updated["statistics"]["total_amount"] == "1500.00"

    signature_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/signature",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "signed_by": "Anna Schmidt",
            "signed_at": "2026-07-04",
            "signature_method": "email_scan",
            "file_no": "SIGN-E2E-001",
            "remark": "客户邮件回签",
        },
    )
    assert signature_response.status_code == 200
    assert signature_response.json()["data"]["signature_status"] == "signed"

    payment_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/advance-payments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "payment_no": "AR-E2E-001",
            "received_at": "2026-07-05",
            "amount": "300.00",
            "currency": "USD",
            "payer_name": "Euro Home Retail Ltd.",
            "remark": "30% 预收款",
        },
    )
    assert payment_response.status_code == 201
    assert payment_response.json()["data"]["amount"] == "300.00"

    submit_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["data"]["approval_status"] == "submitted"

    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-06"},
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["approval_status"] == "approved"
    assert approved["statistics"]["advance_payment_amount"] == "300.00"

    export_response = await api_client.get(
        f"/api/v1/sales/contracts/{contract_id}/export",
        headers={"Authorization": f"Bearer {token}"},
        params={"format": "pdf"},
    )
    assert export_response.status_code == 200
    export = export_response.json()["data"]
    assert export["filename"] == "EC-E2E-001.pdf"
    assert export["content_type"] == "application/pdf"
    assert "EXPORT CONTRACT" in export["content"]


async def test_export_quotation_confirm_creates_real_export_contract(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    quote_no = "QT-CONTRACT-E2E-001"
    create_quote = await api_client.post(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json=_quotation_payload(quote_no),
    )
    quotation_id = create_quote.json()["data"]["id"]
    await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-02"},
    )

    contract_response = await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/confirm-contract",
        headers={"Authorization": f"Bearer {token}"},
        json={"confirmed_at": "2026-07-03", "contract_no": "EC-FROM-QT-E2E-001"},
    )
    assert contract_response.status_code == 200
    generated = contract_response.json()["data"]

    list_response = await api_client.get(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "EC-FROM-QT-E2E-001"},
    )
    assert list_response.status_code == 200
    contract = list_response.json()["data"]["items"][0]
    assert generated["contract_id"] == contract["id"]
    assert contract["source_quotation_no"] == quote_no
    assert contract["statistics"]["total_amount"] == "1250.00"


async def test_export_contract_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/sales/contracts")

    assert response.status_code == 401


async def test_export_contract_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
