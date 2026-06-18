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


def _sample_record_payload(code: str = "SM-E2E-001") -> dict[str, object]:
    return {
        "code": code,
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
        "source_type": "sample_request",
        "source_id": "sr-001",
        "source_code": "SR-2026-001",
        "source_note": "来自打样确认样",
        "received_at": "2026-06-22",
        "submitted_at": "2026-06-23",
        "quantity": "5",
        "unit": "pcs",
        "description": "客户确认样，等待采购跟单节点回写。",
        "images": [
            {
                "file_id": "file-sample-front",
                "filename": "confirm-sample-front.jpg",
                "url": "https://assets.example.test/confirm-sample-front.jpg",
                "caption": "正面图片",
                "is_primary": True,
            }
        ],
    }


async def test_sample_record_create_search_image_stock_and_delivery_link(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    create_response = await api_client.post(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
        json=_sample_record_payload(),
    )
    assert create_response.status_code == 201
    record = create_response.json()["data"]
    assert record["code"] == "SM-E2E-001"
    assert record["sample_type"] == "confirm_sample"
    assert record["stock_summary"]["received_quantity"] == "5"
    assert record["stock_summary"]["delivered_quantity"] == "0"
    assert record["stock_summary"]["retained_quantity"] == "5"
    assert record["images"][0]["is_primary"] is True
    assert record["followup_events"][0]["node_code"] == "confirm_sample_submitted"
    assert record["followup_events"][0]["actual_date"] == "2026-06-23"

    record_id = record["id"]
    detail_response = await api_client.get(
        f"/api/v1/sample/records/{record_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["id"] == record_id

    list_response = await api_client.get(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "q": "Eco",
            "sample_type": "confirm_sample",
            "purchase_contract_id": "pc-2026-001",
            "customer_id": "customer-euro-home",
        },
    )
    assert list_response.status_code == 200
    list_data = list_response.json()["data"]
    assert list_data["total"] == 1
    assert list_data["items"][0]["code"] == "SM-E2E-001"

    image_response = await api_client.post(
        f"/api/v1/sample/records/{record_id}/images",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "file_id": "file-sample-side",
            "filename": "confirm-sample-side.jpg",
            "url": "https://assets.example.test/confirm-sample-side.jpg",
            "caption": "侧面图片",
            "is_primary": False,
        },
    )
    assert image_response.status_code == 201
    assert image_response.json()["data"]["filename"] == "confirm-sample-side.jpg"

    delivery_response = await api_client.post(
        f"/api/v1/sample/records/{record_id}/stock-events",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "event_type": "delivered",
            "quantity": "2",
            "unit": "pcs",
            "occurred_at": "2026-06-24",
            "delivery_no": "SD-2026-001",
            "recipient": "欧陆家居用品有限公司",
            "note": "寄送客户确认。",
        },
    )
    assert delivery_response.status_code == 201
    delivery = delivery_response.json()["data"]
    assert delivery["delivery_no"] == "SD-2026-001"
    assert delivery["event_type"] == "delivered"

    refreshed_response = await api_client.get(
        f"/api/v1/sample/records/{record_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    refreshed = refreshed_response.json()["data"]
    assert refreshed["stock_summary"]["delivered_quantity"] == "2"
    assert refreshed["stock_summary"]["retained_quantity"] == "3"
    assert refreshed["stock_events"][0]["delivery_no"] == "SD-2026-001"


async def test_sample_record_import_export_and_followup_sync(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    contract_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json={
            "code": "PC-SAMPLE-SYNC",
            "contract_date": "2026-06-20",
            "supplier_id": "supplier-pack",
            "supplier_name": "华东包装制品厂",
            "buyer_user_id": "u-001",
            "buyer_user_name": "演示业务主管",
            "currency": "USD",
            "delivery_date": "2026-07-15",
            "payment_terms": "30% 预付，70% 出货前",
            "source_type": "stock_purchase",
            "remarks": "样品跟单同步测试",
            "lines": [
                {
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "specification": "40x35cm",
                    "model": "BAG-40",
                    "quantity": "100",
                    "unit": "pcs",
                    "unit_price": "1.20",
                    "source_export_contract_id": None,
                    "source_export_contract_no": None,
                    "source_export_contract_line_id": None,
                    "remark": "样品跟单测试",
                }
            ],
        },
    )
    assert contract_response.status_code == 201
    contract_id = contract_response.json()["data"]["id"]
    await api_client.post(f"/api/v1/purchase/contracts/{contract_id}/submit", headers=headers)
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-06-20"},
    )
    assert approve_response.status_code == 200

    import_response = await api_client.post(
        "/api/v1/sample/records/import",
        headers=headers,
        json={
            "records": [
                _sample_record_payload(code="SM-IMPORT-001")
                | {
                    "purchase_contract_id": contract_id,
                    "purchase_contract_no": "PC-SAMPLE-SYNC",
                },
                _sample_record_payload(code="SM-IMPORT-002")
                | {
                    "sample_type": "bulk_sample",
                    "purchase_contract_id": contract_id,
                    "purchase_contract_no": "PC-SAMPLE-SYNC",
                    "submitted_at": "2026-06-28",
                },
            ]
        },
    )
    assert import_response.status_code == 201
    imported = import_response.json()["data"]
    assert imported["created_count"] == 2
    assert imported["records"][0]["code"] == "SM-IMPORT-001"
    assert imported["records"][1]["followup_events"][0]["node_code"] == "bulk_sample_submitted"

    export_response = await api_client.get(
        "/api/v1/sample/records/export",
        headers=headers,
        params={"purchase_contract_id": contract_id},
    )
    assert export_response.status_code == 200
    exported = export_response.json()["data"]
    assert exported["filename"].endswith(".csv")
    assert exported["content_type"] == "text/csv"
    assert exported["total"] == 2
    assert "SM-IMPORT-001" in exported["content"]
    assert "确认样" in exported["content"]

    followup_response = await api_client.post(
        "/api/v1/followup/sample-events",
        headers=headers,
        json={"purchase_contract_id": contract_id},
    )
    assert followup_response.status_code == 200
    plan = followup_response.json()["data"]
    confirm_node = next(
        node for node in plan["nodes"] if node["node_code"] == "confirm_sample_submitted"
    )
    bulk_node = next(node for node in plan["nodes"] if node["node_code"] == "bulk_sample_submitted")
    assert confirm_node["status"] == "completed"
    assert confirm_node["actual_date"] == "2026-06-23"
    assert bulk_node["status"] == "completed"
    assert bulk_node["actual_date"] == "2026-06-28"


async def test_sample_record_rejects_unknown_sample_type(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
        json=_sample_record_payload(code="SM-BAD-001") | {"sample_type": "unknown"},
    )

    assert response.status_code == 422


async def test_sample_record_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/sample/records")

    assert response.status_code == 401


async def test_sample_record_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
