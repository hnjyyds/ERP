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


def _sample_request_payload(code: str = "SR-E2E-001") -> dict[str, object]:
    return {
        "code": code,
        "request_date": "2026-06-20",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "product_id": "product-bag",
        "product_code": "BAG-40",
        "product_name": "Eco Shopping Bag",
        "supplier_id": "supplier-pack",
        "supplier_name": "华东包装制品厂",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "destination": "factory",
        "requirements": "客户要求环保材质，先做确认样。",
        "due_date": "2026-06-28",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "quantity": "3",
                "unit": "pcs",
                "requirement": "绿色样、自然色各一，另加留样。",
            }
        ],
    }


def _sample_record_payload_from_request(
    code: str = "SM-FROM-SR-001",
) -> dict[str, object]:
    return {
        "code": code,
        "sample_type": "confirm_sample",
        "status": "registered",
        "received_at": "2026-06-24",
        "submitted_at": "2026-06-25",
        "quantity": "3",
        "unit": "pcs",
        "description": "打样完成后转确认样",
        "images": [
            {
                "file_id": "sample-finished-front",
                "filename": "finished-front.jpg",
                "url": "https://assets.example.test/finished-front.jpg",
                "caption": "完成样正面",
                "is_primary": True,
            }
        ],
    }


async def test_sample_request_create_search_progress_fee_and_payment(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)

    create_response = await api_client.post(
        "/api/v1/sample/requests",
        headers={"Authorization": f"Bearer {token}"},
        json=_sample_request_payload(),
    )
    assert create_response.status_code == 201
    request_data = create_response.json()["data"]
    assert request_data["code"] == "SR-E2E-001"
    assert request_data["status"] == "draft"
    assert request_data["lines"][0]["product_code"] == "BAG-40"
    assert request_data["progress_events"] == []
    assert request_data["fees"] == []

    request_id = request_data["id"]
    detail_response = await api_client.get(
        f"/api/v1/sample/requests/{request_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["id"] == request_id

    list_response = await api_client.get(
        "/api/v1/sample/requests",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "q": "Eco",
            "status": "draft",
            "customer_id": "customer-euro-home",
        },
    )
    assert list_response.status_code == 200
    list_data = list_response.json()["data"]
    assert list_data["total"] == 1
    assert list_data["items"][0]["code"] == "SR-E2E-001"

    progress_response = await api_client.post(
        f"/api/v1/sample/requests/{request_id}/progress",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "stage": "sent_to_factory",
            "status": "in_progress",
            "occurred_at": "2026-06-21",
            "note": "已外发工厂打样。",
            "handler_name": "Li Wei",
        },
    )
    assert progress_response.status_code == 201
    progress = progress_response.json()["data"]
    assert progress["stage"] == "sent_to_factory"
    assert progress["status"] == "in_progress"

    fee_response = await api_client.post(
        f"/api/v1/sample/requests/{request_id}/fees",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "fee_type": "sample_making",
            "amount": "120.50",
            "currency": "USD",
            "payee_type": "supplier",
            "payee_name": "华东包装制品厂",
            "remark": "外发工厂打样费",
        },
    )
    assert fee_response.status_code == 201
    fee = fee_response.json()["data"]
    assert fee["amount"] == "120.50"
    assert fee["payment_status"] == "not_requested"

    payment_response = await api_client.post(
        f"/api/v1/sample/requests/{request_id}/fees/{fee['id']}/payment-request",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert payment_response.status_code == 200
    paid_fee = payment_response.json()["data"]
    assert paid_fee["payment_status"] == "requested"
    assert paid_fee["payment_request_no"].startswith("SAMPLE-FEE-")

    refreshed_response = await api_client.get(
        f"/api/v1/sample/requests/{request_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    refreshed = refreshed_response.json()["data"]
    assert refreshed["status"] == "in_progress"
    assert refreshed["progress_events"][0]["stage"] == "sent_to_factory"
    assert refreshed["fees"][0]["payment_status"] == "requested"
    assert refreshed["fees"][0]["finance_invoice_no"].startswith("SAMPLE-FEE-INV-")
    assert refreshed["fees"][0]["payment_request_no"].startswith("SAMPLE-FEE-")


async def test_sample_request_filters_by_date_range_and_converts_completed_request_to_record(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = await api_client.post(
        "/api/v1/sample/requests",
        headers=headers,
        json=_sample_request_payload(code="SR-COMPLETE-001"),
    )
    assert create_response.status_code == 201
    request_id = create_response.json()["data"]["id"]

    await api_client.post(
        f"/api/v1/sample/requests/{request_id}/progress",
        headers=headers,
        json={
            "stage": "finished",
            "status": "completed",
            "occurred_at": "2026-06-24",
            "note": "打样完成，转确认样。",
            "handler_name": "Li Wei",
        },
    )

    list_response = await api_client.get(
        "/api/v1/sample/requests",
        headers=headers,
        params={"date_from": "2026-06-19", "date_to": "2026-06-21"},
    )
    assert list_response.status_code == 200
    assert [item["code"] for item in list_response.json()["data"]["items"]] == ["SR-COMPLETE-001"]

    excluded_response = await api_client.get(
        "/api/v1/sample/requests",
        headers=headers,
        params={"date_from": "2026-06-21", "date_to": "2026-06-30"},
    )
    assert excluded_response.status_code == 200
    assert excluded_response.json()["data"]["total"] == 0

    convert_response = await api_client.post(
        f"/api/v1/sample/requests/{request_id}/sample-record",
        headers=headers,
        json=_sample_record_payload_from_request(),
    )
    assert convert_response.status_code == 201
    record = convert_response.json()["data"]
    assert record["code"] == "SM-FROM-SR-001"
    assert record["source_type"] == "sample_request"
    assert record["source_id"] == request_id
    assert record["source_code"] == "SR-COMPLETE-001"
    assert record["product_code"] == "BAG-40"
    assert record["customer_name"] == "欧陆家居用品有限公司"
    assert record["stock_summary"]["received_quantity"] == "3"
    assert record["images"][0]["filename"] == "finished-front.jpg"

    duplicate_response = await api_client.post(
        f"/api/v1/sample/requests/{request_id}/sample-record",
        headers=headers,
        json=_sample_record_payload_from_request(code="SM-FROM-SR-DUP"),
    )
    assert duplicate_response.status_code == 422


async def test_sample_request_rejects_unknown_status(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/sample/requests",
        headers={"Authorization": f"Bearer {token}"},
        json=_sample_request_payload(code="SR-BAD-001") | {"status": "unknown"},
    )

    assert response.status_code == 422


async def test_sample_request_endpoints_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    response = await api_client.get("/api/v1/sample/requests")

    assert response.status_code == 401


async def test_sample_request_endpoints_enforce_menu_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/sample/requests",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
