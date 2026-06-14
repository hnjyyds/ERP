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


def _purchase_contract_payload(code: str = "PC-INP-API") -> dict[str, object]:
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
        "remarks": "入库计划 API 测试",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "1000",
                "unit": "pcs",
                "unit_price": "1.2",
                "source_export_contract_id": None,
                "source_export_contract_no": None,
                "source_export_contract_line_id": None,
                "remark": "入库计划 API 测试",
            }
        ],
    }


async def test_inbound_plan_api_auto_generates_on_purchase_approval_and_schedules_location(
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
    contract = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers=headers,
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers=headers,
        json={"reviewer_name": "演示业务主管", "approved_at": "2026-08-05"},
    )
    assert approve_response.status_code == 200

    list_response = await api_client.get(
        "/api/v1/warehouse/inbound-plans",
        headers=headers,
        params={"q": "PC-INP-API"},
    )
    assert list_response.status_code == 200
    plans = list_response.json()["data"]
    assert plans["total"] == 1
    plan = plans["items"][0]
    assert plan["purchase_contract_no"] == "PC-INP-API"
    assert plan["planned_date"] == "2026-08-30"
    assert plan["inbound_type"] == "purchase_inbound"
    assert plan["status"] == "planned"
    assert plan["lines"][0]["planned_quantity"] == "1000"

    schedule_response = await api_client.post(
        f"/api/v1/warehouse/inbound-plans/{plan['id']}/schedule",
        headers=headers,
        json={
            "planned_date": "2026-08-28",
            "warehouse_id": "wh-ningbo",
            "warehouse_name": "宁波总仓",
            "location_id": "loc-a-01",
            "location_name": "A-01",
            "operator_name": "仓库主管",
        },
    )
    assert schedule_response.status_code == 200
    scheduled = schedule_response.json()["data"]
    assert scheduled["status"] == "scheduled"
    assert scheduled["warehouse_name"] == "宁波总仓"
    assert scheduled["location_name"] == "A-01"


async def test_inbound_plan_api_rejects_invalid_type_unauthorized_and_finance_role(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    unauthorized_response = await api_client.get("/api/v1/warehouse/inbound-plans")
    assert unauthorized_response.status_code == 401

    finance_token = await _login_token(api_client, username="finance", password="finance123")
    finance_response = await api_client.get(
        "/api/v1/warehouse/inbound-plans",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert finance_response.status_code == 403

    token = await _login_token(api_client)
    invalid_response = await api_client.post(
        "/api/v1/warehouse/inbound-plans/from-purchase-contract",
        headers={"Authorization": f"Bearer {token}"},
        json={"purchase_contract_id": "missing", "inbound_type": "bad_type"},
    )
    assert invalid_response.status_code == 422
