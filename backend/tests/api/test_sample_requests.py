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
