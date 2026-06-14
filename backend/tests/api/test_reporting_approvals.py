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


def _export_contract_payload(code: str) -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2027-02-01",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "planned_ship_date": "2027-03-01",
        "payment_terms": "30% T/T in advance, balance before shipment",
        "source_quotation_id": None,
        "source_quotation_no": None,
        "remarks": "经理查询待审批出口合同",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "100",
                "unit": "pcs",
                "unit_price": "12.00",
                "purchased_quantity": "0",
                "shipped_quantity": "0",
                "image_url": None,
                "remark": "经理查询测试合同",
            }
        ],
    }


def _purchase_contract_payload(code: str) -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2027-02-03",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "currency": "USD",
        "delivery_date": "2027-02-25",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "stock_purchase",
        "remarks": "经理查询待审批采购合同",
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
                "remark": "经理查询测试采购",
            }
        ],
    }


async def _submitted_export_contract(
    api_client: AsyncClient,
    token: str,
    code: str,
) -> dict[str, object]:
    create_response = await api_client.post(
        "/api/v1/sales/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=_export_contract_payload(code),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    return submit_response.json()["data"]


async def _submitted_purchase_contract(
    api_client: AsyncClient,
    token: str,
    code: str,
) -> dict[str, object]:
    create_response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=_purchase_contract_payload(code),
    )
    assert create_response.status_code == 201
    contract = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    return submit_response.json()["data"]


async def test_reporting_approval_query_aggregates_pending_documents(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    export_contract = await _submitted_export_contract(
        api_client,
        token,
        "EC-REPORT-APPROVAL-001",
    )
    purchase_contract = await _submitted_purchase_contract(
        api_client,
        token,
        "PC-REPORT-APPROVAL-001",
    )

    response = await api_client.get(
        "/api/v1/reporting/approvals",
        headers={"Authorization": f"Bearer {token}"},
        params={"status": "submitted"},
    )

    assert response.status_code == 200
    approvals = response.json()["data"]
    assert approvals["total"] == 2
    assert approvals["pending_count"] == 2
    assert approvals["approved_count"] == 0
    document_numbers = {item["document_no"] for item in approvals["items"]}
    assert document_numbers == {export_contract["code"], purchase_contract["code"]}
    document_types = {item["document_type"] for item in approvals["items"]}
    assert document_types == {"export_contract", "purchase_contract"}
    assert approvals["items"][0]["submitted_at"] >= approvals["items"][1]["submitted_at"]
    type_summaries = {item["document_type"]: item for item in approvals["type_summaries"]}
    assert type_summaries["export_contract"]["pending_count"] == 1
    assert type_summaries["purchase_contract"]["pending_count"] == 1


async def test_reporting_approval_query_filters_approved_documents_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    manager_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")
    submitted = await _submitted_export_contract(
        api_client,
        manager_token,
        "EC-REPORT-APPROVAL-002",
    )
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{submitted['id']}/approve",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2027-02-06"},
    )
    assert approve_response.status_code == 200

    approved_response = await api_client.get(
        "/api/v1/reporting/approvals",
        headers={"Authorization": f"Bearer {manager_token}"},
        params={
            "status": "approved",
            "document_type": "export_contract",
            "applicant_user_id": "u-001",
            "date_from": "2027-02-06",
            "date_to": "2027-02-06",
        },
    )
    assert approved_response.status_code == 200
    approvals = approved_response.json()["data"]
    assert approvals["total"] == 1
    assert approvals["pending_count"] == 0
    assert approvals["approved_count"] == 1
    assert approvals["items"][0]["document_no"] == "EC-REPORT-APPROVAL-002"
    assert approvals["items"][0]["status"] == "approved"
    assert approvals["items"][0]["approved_at"] == "2027-02-06"
    assert approvals["items"][0]["source_path"] == f"/sales/contracts/{submitted['id']}"

    denied_response = await api_client.get(
        "/api/v1/reporting/approvals",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert denied_response.status_code == 403

    unauthorized_response = await api_client.get("/api/v1/reporting/approvals")
    assert unauthorized_response.status_code == 401
