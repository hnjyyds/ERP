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


def _purchase_contract_payload(code: str = "PC-QC-API") -> dict[str, object]:
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
        "remarks": "QC 查验 API 测试",
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
                "remark": "QC 查验 API 测试",
            }
        ],
    }


async def test_quality_inspection_api_creates_record_and_updates_followup(
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

    inspection_response = await api_client.post(
        "/api/v1/quality/inspections",
        headers=headers,
        json={
            "code": "QC-API-001",
            "purchase_contract_id": contract["id"],
            "inspected_at": "2026-08-19",
            "result": "passed",
            "inspector_id": "u-qc-001",
            "inspector_name": "QC 张工",
            "issue_summary": None,
            "attachment_group_id": "attach-qc-api",
            "lines": [
                {
                    "purchase_contract_line_id": contract["lines"][0]["id"],
                    "product_id": "product-bag",
                    "product_code": "BAG-40",
                    "product_name": "Eco Shopping Bag",
                    "inspected_quantity": "120",
                    "failed_quantity": "0",
                    "unit": "pcs",
                    "result": "passed",
                    "remark": "首检通过",
                }
            ],
            "issues": [],
        },
    )
    assert inspection_response.status_code == 201
    inspection = inspection_response.json()["data"]
    assert inspection["result"] == "passed"
    assert inspection["purchase_contract_no"] == "PC-QC-API"
    assert inspection["lines"][0]["inspected_quantity"] == "120"

    list_response = await api_client.get(
        "/api/v1/quality/inspections",
        headers=headers,
        params={"q": "QC-API-001"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1

    eligibility_response = await api_client.get(
        "/api/v1/quality/inspections/inbound-eligibility",
        headers=headers,
        params={"purchase_contract_id": contract["id"]},
    )
    assert eligibility_response.status_code == 200
    eligibility = eligibility_response.json()["data"]
    assert eligibility["eligible"] is True
    assert eligibility["latest_result"] == "passed"

    followup_response = await api_client.get(
        "/api/v1/followup/plans",
        headers=headers,
        params={"q": "PC-QC-API"},
    )
    assert followup_response.status_code == 200
    plan = followup_response.json()["data"]["items"][0]
    qc_node = next(node for node in plan["nodes"] if node["node_code"] == "quality_inspection")
    assert qc_node["actual_date"] == "2026-08-19"
    assert qc_node["source_record_type"] == "quality_inspection"
    assert qc_node["source_record_id"] == inspection["id"]


async def test_quality_inspection_api_rejects_unauthorized_and_finance_role(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    unauthorized_response = await api_client.get("/api/v1/quality/inspections")
    assert unauthorized_response.status_code == 401

    token = await _login_token(api_client, username="finance", password="finance123")
    response = await api_client.get(
        "/api/v1/quality/inspections",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
