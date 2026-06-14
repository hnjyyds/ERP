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


def _quotation_payload(code: str = "QT-E2E-001") -> dict[str, object]:
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


async def _create_sample_delivery_for_quote(
    api_client: AsyncClient,
    token: str,
    *,
    quote_no: str,
) -> None:
    sample_response = await api_client.post(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": f"SM-{quote_no}",
            "sample_type": "confirm_sample",
            "status": "registered",
            "product_id": "product-bag",
            "product_code": "BAG-40",
            "product_name": "Eco Shopping Bag",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "supplier_id": "supplier-pack",
            "supplier_name": "华东包装制品厂",
            "received_at": "2026-06-22",
            "submitted_at": "2026-06-23",
            "quantity": "5",
            "unit": "pcs",
            "description": "报价前寄样",
            "images": [],
        },
    )
    assert sample_response.status_code == 201
    sample_record = sample_response.json()["data"]
    delivery_response = await api_client.post(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": f"SD-{quote_no}",
            "delivery_date": "2026-06-25",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "supplier_id": "supplier-pack",
            "supplier_name": "华东包装制品厂",
            "factory_id": "factory-pack",
            "factory_name": "华东包装制品厂",
            "recipient_name": "Anna Schmidt",
            "recipient_company": "Euro Home Retail Ltd.",
            "recipient_address": "Hamburg Trade Center",
            "express_company": "DHL",
            "tracking_no": f"DHL-{quote_no}",
            "quote_id": "quote-e2e",
            "quote_no": quote_no,
            "remark": "报价前寄确认样",
            "lines": [
                {
                    "sample_record_id": sample_record["id"],
                    "sample_code": sample_record["code"],
                    "sample_type": "confirm_sample",
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "quantity": "2",
                    "unit": "pcs",
                    "remark": "寄客户确认",
                }
            ],
            "fees": [
                {
                    "fee_type": "express",
                    "amount": "18.50",
                    "currency": "USD",
                    "payer_type": "company",
                    "remark": "DHL 寄样费",
                }
            ],
        },
    )
    assert delivery_response.status_code == 201
    delivery_id = delivery_response.json()["data"]["id"]
    submit_response = await api_client.post(
        f"/api/v1/sample/deliveries/{delivery_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/sample/deliveries/{delivery_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-06-25"},
    )
    assert approve_response.status_code == 200


async def test_export_quotation_flow_history_references_samples_export_and_contract(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    quote_no = "QT-E2E-001"
    await _create_sample_delivery_for_quote(api_client, token, quote_no=quote_no)

    create_response = await api_client.post(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json=_quotation_payload(quote_no),
    )
    assert create_response.status_code == 201
    quotation = create_response.json()["data"]
    assert quotation["code"] == quote_no
    assert quotation["approval_status"] == "draft"
    assert quotation["lines"][0]["amount"] == "1250.00"
    assert quotation["lines"][0]["freight_amount"] == "120.00"
    assert quotation["total_amount"] == "1370.00"

    quotation_id = quotation["id"]
    payload = _quotation_payload(quote_no)
    payload["description"] = "草稿编辑后的报价说明"
    payload["lines"][0]["unit_price"] = "1.30"
    update_response = await api_client.put(
        f"/api/v1/sales/quotations/{quotation_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["description"] == "草稿编辑后的报价说明"
    assert updated["lines"][0]["amount"] == "1300.00"
    assert updated["total_amount"] == "1420.00"

    submit_response = await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["data"]["approval_status"] == "submitted"

    approve_response = await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-07-02"},
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["data"]["approval_status"] == "approved"

    history_response = await api_client.get(
        "/api/v1/sales/quotations/history",
        headers={"Authorization": f"Bearer {token}"},
        params={"customer_id": "customer-euro-home", "product_id": "product-bag"},
    )
    assert history_response.status_code == 200
    assert history_response.json()["data"]["items"][0]["code"] == quote_no

    references_response = await api_client.get(
        "/api/v1/sales/quotations/purchase-references",
        headers={"Authorization": f"Bearer {token}"},
        params={"product_id": "product-bag"},
    )
    assert references_response.status_code == 200
    assert references_response.json()["data"]["items"][0]["supplier_name"] == "华东包装制品厂"
    assert references_response.json()["data"]["items"][0]["reference_price"] == "0.82"

    sample_response = await api_client.get(
        f"/api/v1/sales/quotations/{quotation_id}/sample-deliveries",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert sample_response.status_code == 200
    assert sample_response.json()["data"]["items"][0]["quote_no"] == quote_no

    export_response = await api_client.get(
        f"/api/v1/sales/quotations/{quotation_id}/export",
        headers={"Authorization": f"Bearer {token}"},
        params={"format": "pdf"},
    )
    assert export_response.status_code == 200
    export = export_response.json()["data"]
    assert export["filename"] == "QT-E2E-001.pdf"
    assert export["content_type"] == "application/pdf"
    assert quote_no in export["content"]

    contract_response = await api_client.post(
        f"/api/v1/sales/quotations/{quotation_id}/confirm-contract",
        headers={"Authorization": f"Bearer {token}"},
        json={"confirmed_at": "2026-07-03", "contract_no": "EC-E2E-001"},
    )
    assert contract_response.status_code == 200
    contract = contract_response.json()["data"]
    assert contract["quotation_id"] == quotation_id
    assert contract["contract_no"] == "EC-E2E-001"
    assert contract["total_amount"] == "1420.00"


async def test_export_quotation_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/sales/quotations")

    assert response.status_code == 401


async def test_export_quotation_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
