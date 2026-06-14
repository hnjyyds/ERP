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


def _generation_payload() -> dict[str, object]:
    return {
        "customs_declaration_id": "cd-api-001",
        "customs_declaration_no": "CD-API-001",
        "declaration_date": "2026-09-03",
        "notice_date": "2026-09-04",
        "currency": "CNY",
        "remarks": "报关完成后通知供应商开票",
        "lines": [
            {
                "supplier_id": "supplier-pack-a",
                "supplier_name": "华东包装制品厂",
                "purchase_contract_id": "pc-api-001",
                "purchase_contract_no": "PC-API-001",
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "customs_name": "环保购物袋",
                "invoice_name": "无纺布购物袋",
                "quantity": "1000",
                "unit": "pcs",
                "amount": "5200.00",
                "remark": "主供应商",
            },
            {
                "supplier_id": "supplier-pack-a",
                "supplier_name": "华东包装制品厂",
                "purchase_contract_id": "pc-api-002",
                "purchase_contract_no": "PC-API-002",
                "product_id": "product-rope",
                "product_code": "ACC-ROPE",
                "product_name": "棉绳",
                "customs_name": "棉绳",
                "invoice_name": "棉绳",
                "quantity": "450",
                "unit": "m",
                "amount": "360.00",
                "remark": "同一供应商合并",
            },
            {
                "supplier_id": "supplier-label-a",
                "supplier_name": "杭州标签厂",
                "purchase_contract_id": "pc-api-003",
                "purchase_contract_no": "PC-API-003",
                "product_id": "product-label",
                "product_code": "ACC-LABEL",
                "product_name": "洗标",
                "customs_name": "织唛",
                "invoice_name": "织唛",
                "quantity": "1000",
                "unit": "pcs",
                "amount": "120.00",
                "remark": "第二供应商",
            },
        ],
    }


async def test_purchase_invoice_notice_flow_generate_send_receive_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    generate_response = await api_client.post(
        "/api/v1/purchase/invoice-notices/from-customs-declaration",
        headers={"Authorization": f"Bearer {token}"},
        json=_generation_payload(),
    )
    assert generate_response.status_code == 201
    generated = generate_response.json()["data"]
    assert generated["total"] == 2
    pack_notice = next(
        item for item in generated["items"] if item["supplier_id"] == "supplier-pack-a"
    )
    assert pack_notice["total_quantity"] == "1450"
    assert pack_notice["total_amount"] == "5560.00"
    assert len(pack_notice["lines"]) == 2

    list_response = await api_client.get(
        "/api/v1/purchase/invoice-notices",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "无纺布", "supplier_id": "supplier-pack-a"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1

    send_response = await api_client.post(
        f"/api/v1/purchase/invoice-notices/{pack_notice['id']}/send",
        headers={"Authorization": f"Bearer {token}"},
        json={"sender_name": "演示业务主管", "sent_at": "2026-09-05"},
    )
    assert send_response.status_code == 200
    sent = send_response.json()["data"]
    assert sent["status"] == "sent"
    assert sent["reminders"][0]["status"] == "open"

    reminders_response = await api_client.get(
        "/api/v1/purchase/invoice-notices/reminders",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert reminders_response.status_code == 200
    assert reminders_response.json()["data"]["total"] == 1

    receive_response = await api_client.post(
        f"/api/v1/purchase/invoice-notices/{pack_notice['id']}/receive-tax-invoice",
        headers={"Authorization": f"Bearer {token}"},
        json={"tax_invoice_no": "VAT-API-001", "received_at": "2026-09-09"},
    )
    assert receive_response.status_code == 200
    received = receive_response.json()["data"]
    assert received["status"] == "received"
    assert received["tax_invoice_no"] == "VAT-API-001"
    assert received["reminders"][0]["status"] == "done"

    unauthorized_response = await api_client.get("/api/v1/purchase/invoice-notices")
    assert unauthorized_response.status_code == 401

    finance_token = await _login_token(api_client, "finance", "finance123")
    finance_response = await api_client.get(
        "/api/v1/purchase/invoice-notices",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert finance_response.status_code == 403
