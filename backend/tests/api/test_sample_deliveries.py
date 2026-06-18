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


async def _create_sample_record(api_client: AsyncClient, token: str) -> dict[str, object]:
    response = await api_client.post(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SM-DEL-001",
            "sample_type": "confirm_sample",
            "status": "registered",
            "product_id": "product-bag",
            "product_code": "BAG-40",
            "product_name": "Eco Shopping Bag",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "supplier_id": "supplier-pack",
            "supplier_name": "华东包装制品厂",
            "customer_sku": "CUST-BAG-40",
            "supplier_sku": "SUP-BAG-40",
            "purchase_contract_id": "pc-2026-001",
            "purchase_contract_no": "PC-2026-001",
            "received_at": "2026-06-22",
            "submitted_at": "2026-06-23",
            "quantity": "5",
            "unit": "pcs",
            "description": "寄样测试确认样",
            "images": [],
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


def _delivery_payload(
    sample_record: dict[str, object],
    code: str = "SD-E2E-001",
) -> dict[str, object]:
    return {
        "code": code,
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
        "tracking_no": "DHL-2026-001",
        "quote_id": "quote-2026-001",
        "quote_no": "QT-2026-001",
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
    }


async def test_sample_delivery_review_stock_fee_statistics_and_histories(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    sample_record = await _create_sample_record(api_client, token)

    create_response = await api_client.post(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
        json=_delivery_payload(sample_record),
    )
    assert create_response.status_code == 201
    delivery = create_response.json()["data"]
    assert delivery["code"] == "SD-E2E-001"
    assert delivery["status"] == "draft"
    assert delivery["lines"][0]["sample_record_id"] == sample_record["id"]
    assert delivery["fees"][0]["amount"] == "18.50"
    assert delivery["fee_total"] == "18.50"

    delivery_id = delivery["id"]
    submit_response = await api_client.post(
        f"/api/v1/sample/deliveries/{delivery_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["data"]["status"] == "submitted"

    approve_response = await api_client.post(
        f"/api/v1/sample/deliveries/{delivery_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-06-25"},
    )
    assert approve_response.status_code == 200
    approved = approve_response.json()["data"]
    assert approved["status"] == "approved"
    assert approved["reviewer_name"] == "演示业务主管"

    tracking_response = await api_client.post(
        f"/api/v1/sample/deliveries/{delivery_id}/tracking",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "express_company": "DHL",
            "tracking_no": "DHL-2026-001",
            "status": "shipped",
        },
    )
    assert tracking_response.status_code == 200
    assert tracking_response.json()["data"]["status"] == "shipped"

    sample_response = await api_client.get(
        f"/api/v1/sample/records/{sample_record['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    sample_detail = sample_response.json()["data"]
    assert sample_detail["stock_summary"]["delivered_quantity"] == "2"
    assert sample_detail["stock_summary"]["retained_quantity"] == "3"
    assert sample_detail["stock_events"][0]["delivery_no"] == "SD-E2E-001"

    stats_response = await api_client.get(
        "/api/v1/sample/deliveries/fee-statistics",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "customer_id": "customer-euro-home",
            "date_from": "2026-06-01",
            "date_to": "2026-06-30",
            "express_company": "DHL",
        },
    )
    assert stats_response.status_code == 200
    stats = stats_response.json()["data"]
    assert stats["total_amount"] == "18.50"
    assert stats["items"][0]["customer_name"] == "欧陆家居用品有限公司"
    assert stats["items"][0]["express_company"] == "DHL"

    list_in_range_response = await api_client.get(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
        params={"date_from": "2026-06-01", "date_to": "2026-06-30"},
    )
    assert list_in_range_response.status_code == 200
    assert list_in_range_response.json()["data"]["total"] == 1

    list_out_of_range_response = await api_client.get(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
        params={"date_from": "2026-07-01", "date_to": "2026-07-31"},
    )
    assert list_out_of_range_response.status_code == 200
    assert list_out_of_range_response.json()["data"]["total"] == 0

    sample_history_response = await api_client.get(
        f"/api/v1/sample/deliveries/history/sample/{sample_record['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert sample_history_response.status_code == 200
    assert sample_history_response.json()["data"]["items"][0]["code"] == "SD-E2E-001"

    quote_history_response = await api_client.get(
        "/api/v1/sample/deliveries/quote-history",
        headers={"Authorization": f"Bearer {token}"},
        params={"customer_id": "customer-euro-home", "product_id": "product-bag"},
    )
    assert quote_history_response.status_code == 200
    assert quote_history_response.json()["data"]["items"][0]["quote_no"] == "QT-2026-001"

    statistics_response = await api_client.get(
        "/api/v1/sample/deliveries/statistics",
        headers={"Authorization": f"Bearer {token}"},
        params={"date_from": "2026-06-01", "date_to": "2026-06-30"},
    )
    assert statistics_response.status_code == 200
    statistics = statistics_response.json()["data"]
    assert statistics["total_deliveries"] == 1
    assert statistics["total_quantity"] == "2"
    assert statistics["by_status"][0]["status"] == "shipped"
    assert statistics["by_customer"][0]["customer_name"] == "欧陆家居用品有限公司"

    export_response = await api_client.get(
        "/api/v1/sample/deliveries/export",
        headers={"Authorization": f"Bearer {token}"},
        params={"date_from": "2026-06-01", "date_to": "2026-06-30"},
    )
    assert export_response.status_code == 200
    exported = export_response.json()["data"]
    assert exported["filename"].endswith(".csv")
    assert exported["total"] == 1
    assert "SD-E2E-001" in exported["content"]
    assert "DHL" in exported["content"]


async def test_sample_delivery_can_update_draft_before_submit(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    sample_record = await _create_sample_record(api_client, token)

    create_response = await api_client.post(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
        json=_delivery_payload(sample_record, code="SD-E2E-EDIT-001"),
    )
    assert create_response.status_code == 201
    delivery_id = create_response.json()["data"]["id"]

    payload = _delivery_payload(sample_record, code="SD-E2E-EDIT-001")
    payload["recipient_address"] = "Hamburg Trade Center, Floor 8"
    payload["remark"] = "草稿编辑后寄样"
    payload["lines"][0]["quantity"] = "3"
    payload["fees"][0]["amount"] = "21.00"
    update_response = await api_client.put(
        f"/api/v1/sample/deliveries/{delivery_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["recipient_address"] == "Hamburg Trade Center, Floor 8"
    assert updated["remark"] == "草稿编辑后寄样"
    assert updated["lines"][0]["quantity"] == "3"
    assert updated["fee_total"] == "21.00"

    submit_response = await api_client.post(
        f"/api/v1/sample/deliveries/{delivery_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200

    submitted_update_response = await api_client.put(
        f"/api/v1/sample/deliveries/{delivery_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert submitted_update_response.status_code == 422


async def test_sample_delivery_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/sample/deliveries")

    assert response.status_code == 401


async def test_sample_delivery_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
