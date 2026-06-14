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


def _purchase_contract_payload(code: str = "PC-FUP-API") -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2026-08-05",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "currency": "USD",
        "delivery_date": "2026-08-30",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "stock_purchase",
        "remarks": "采购跟单 API 测试",
        "lines": [
            {
                "product_id": "accessory-cotton-rope",
                "product_code": "ACC-ROPE",
                "product_name": "棉绳",
                "specification": "5mm",
                "model": "ROPE-5",
                "quantity": "450",
                "unit": "m",
                "unit_price": "0.12",
                "source_export_contract_id": None,
                "source_export_contract_no": None,
                "source_export_contract_line_id": None,
                "remark": "跟单计划测试",
            }
        ],
    }


async def test_followup_api_generates_plan_on_purchase_approval_and_syncs_sources(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers=headers,
        json=_purchase_contract_payload(),
    )
    assert create_response.status_code == 201
    contract_id = create_response.json()["data"]["id"]
    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/submit",
        headers=headers,
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract_id}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-05"},
    )
    assert approve_response.status_code == 200

    list_response = await api_client.get(
        "/api/v1/followup/plans",
        headers=headers,
        params={"q": "PC-FUP-API"},
    )
    assert list_response.status_code == 200
    plans = list_response.json()["data"]
    assert plans["total"] == 1
    plan = plans["items"][0]
    assert plan["purchase_contract_no"] == "PC-FUP-API"
    assert len(plan["nodes"]) == 6
    assert plan["nodes"][0]["status"] == "completed"

    event_response = await api_client.post(
        "/api/v1/followup/source-events",
        headers=headers,
        json={
            "purchase_contract_id": contract_id,
            "node_code": "confirm_sample_submitted",
            "source_record_type": "sample_followup_event",
            "source_record_id": "sample-event-api-001",
            "actual_date": "2026-08-08",
            "source_summary": "确认样提交",
        },
    )
    assert event_response.status_code == 200
    synced = event_response.json()["data"]
    confirm_node = next(
        node for node in synced["nodes"] if node["node_code"] == "confirm_sample_submitted"
    )
    assert confirm_node["actual_date"] == "2026-08-08"
    assert confirm_node["source_record_type"] == "sample_followup_event"

    overdue_response = await api_client.get(
        "/api/v1/followup/overdue-nodes",
        headers=headers,
        params={"as_of": "2026-09-05"},
    )
    assert overdue_response.status_code == 200
    overdue = overdue_response.json()["data"]
    assert overdue["total"] >= 1
    assert any(item["purchase_contract_no"] == "PC-FUP-API" for item in overdue["items"])


async def test_followup_api_rejects_finance_role(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, username="finance", password="finance123")

    response = await api_client.get(
        "/api/v1/followup/plans",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
