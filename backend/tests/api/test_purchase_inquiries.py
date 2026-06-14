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


def _inquiry_payload(code: str = "PI-API-001") -> dict[str, object]:
    return {
        "code": code,
        "inquiry_date": "2026-08-01",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "remarks": "环保袋供应商询价",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "1000",
                "unit": "pcs",
            }
        ],
    }


async def _create_supplier_sample(api_client: AsyncClient, token: str) -> None:
    response = await api_client.post(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SM-PI-API-001",
            "sample_type": "confirm_sample",
            "status": "registered",
            "product_id": "product-bag",
            "product_code": "BAG-40",
            "product_name": "Eco Shopping Bag",
            "customer_id": None,
            "customer_name": None,
            "supplier_id": "supplier-pack-a",
            "supplier_name": "华东包装制品厂",
            "received_at": "2026-07-28",
            "submitted_at": None,
            "quantity": "3",
            "unit": "pcs",
            "description": "供应商询价样品",
            "images": [],
        },
    )
    assert response.status_code == 201


async def test_purchase_inquiry_flow_quotes_samples_template_and_sales_reference(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    await _create_supplier_sample(api_client, token)

    create_response = await api_client.post(
        "/api/v1/purchase/inquiries",
        headers={"Authorization": f"Bearer {token}"},
        json=_inquiry_payload(),
    )
    assert create_response.status_code == 201
    inquiry = create_response.json()["data"]
    assert inquiry["code"] == "PI-API-001"
    assert inquiry["status"] == "draft"
    assert inquiry["lines"][0]["quantity"] == "1000"
    inquiry_id = inquiry["id"]
    line_id = inquiry["lines"][0]["id"]

    update_payload = _inquiry_payload()
    update_payload["inquiry_date"] = "2026-08-03"
    update_payload["buyer_user_id"] = "u-002"
    update_payload["buyer_user_name"] = "采购专员"
    update_payload["remarks"] = "编辑后的环保袋采购询价"
    update_lines = update_payload["lines"]
    assert isinstance(update_lines, list)
    update_line = update_lines[0]
    assert isinstance(update_line, dict)
    update_line["quantity"] = "1200"
    update_response = await api_client.put(
        f"/api/v1/purchase/inquiries/{inquiry_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=update_payload,
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["buyer_user_name"] == "采购专员"
    assert updated["lines"][0]["quantity"] == "1200"
    line_id = updated["lines"][0]["id"]

    template_response = await api_client.post(
        f"/api/v1/purchase/inquiries/{inquiry_id}/send-template",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "template_name": "标准采购询价模板",
            "recipient_emails": ["supplier@example.com"],
        },
    )
    assert template_response.status_code == 200
    template = template_response.json()["data"]
    assert template["filename"] == "PI-API-001-inquiry.txt"
    assert "Eco Shopping Bag" in template["content"]

    quote_response = await api_client.post(
        f"/api/v1/purchase/inquiries/{inquiry_id}/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "inquiry_line_id": line_id,
            "supplier_id": "supplier-pack-a",
            "supplier_name": "华东包装制品厂",
            "quoted_at": "2026-08-02",
            "unit_price": "0.78",
            "currency": "USD",
            "lead_time_days": 18,
            "min_order_quantity": "800",
            "sample_available": True,
            "remark": "含环保包装",
        },
    )
    assert quote_response.status_code == 201
    quoted = quote_response.json()["data"]
    assert quoted["status"] == "quoted"
    assert quoted["quotations"][0]["has_sample"] is True

    second_quote_response = await api_client.post(
        f"/api/v1/purchase/inquiries/{inquiry_id}/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "inquiry_line_id": line_id,
            "supplier_id": "supplier-pack-b",
            "supplier_name": "宁波成品包装厂",
            "quoted_at": "2026-08-02",
            "unit_price": "0.82",
            "currency": "USD",
            "lead_time_days": 15,
            "min_order_quantity": "1000",
            "sample_available": False,
            "remark": "交期更短",
        },
    )
    assert second_quote_response.status_code == 201
    assert len(second_quote_response.json()["data"]["quotations"]) == 2

    blocked_update_response = await api_client.put(
        f"/api/v1/purchase/inquiries/{inquiry_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=update_payload,
    )
    assert blocked_update_response.status_code == 422

    list_response = await api_client.get(
        "/api/v1/purchase/inquiries",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": "环保袋", "status": "quoted", "supplier_id": "supplier-pack-a"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1

    samples_response = await api_client.get(
        "/api/v1/purchase/inquiries/supplier-samples",
        headers={"Authorization": f"Bearer {token}"},
        params={"product_id": "product-bag", "supplier_id": "supplier-pack-a"},
    )
    assert samples_response.status_code == 200
    assert samples_response.json()["data"]["items"][0]["sample_code"] == "SM-PI-API-001"

    sales_references_response = await api_client.get(
        "/api/v1/sales/quotations/purchase-references",
        headers={"Authorization": f"Bearer {token}"},
        params={"product_id": "product-bag"},
    )
    assert sales_references_response.status_code == 200
    reference = sales_references_response.json()["data"]["items"][0]
    assert reference["supplier_name"] == "华东包装制品厂"
    assert reference["reference_price"] == "0.78"
    assert reference["source_quotation_no"] == "PI-API-001"


async def test_purchase_inquiry_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/purchase/inquiries")

    assert response.status_code == 401


async def test_purchase_inquiry_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/purchase/inquiries",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
