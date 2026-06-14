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
        "contract_date": "2027-03-01",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "planned_ship_date": "2027-03-25",
        "payment_terms": "30% T/T in advance, balance before shipment",
        "source_quotation_id": None,
        "source_quotation_no": None,
        "remarks": "经理统计出口合同",
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
                "remark": "经理统计测试合同",
            }
        ],
    }


def _purchase_contract_payload(code: str) -> dict[str, object]:
    return {
        "code": code,
        "contract_date": "2027-03-02",
        "supplier_id": "supplier-pack-a",
        "supplier_name": "华东包装制品厂",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "currency": "USD",
        "delivery_date": "2027-03-28",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "stock_purchase",
        "remarks": "经理统计采购合同",
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
                "remark": "经理统计采购",
            }
        ],
    }


async def _approved_export_contract(
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
    approve_response = await api_client.post(
        f"/api/v1/sales/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2027-03-03"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


async def _approved_purchase_contract(
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
    approve_response = await api_client.post(
        f"/api/v1/purchase/contracts/{contract['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2027-03-04"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


async def _approved_shipment(
    api_client: AsyncClient,
    token: str,
    contract: dict[str, object],
) -> dict[str, object]:
    create_response = await api_client.post(
        "/api/v1/sales/shipments/from-contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "SP-REPORT-STAT-001",
            "shipment_date": "2027-03-15",
            "planned_ship_date": "2027-03-25",
            "shipping_method": "sea",
            "port_of_loading": "Ningbo",
            "port_of_destination": "Hamburg",
            "vessel_name": "COSCO Star",
            "container_no": "CONT-REPORT-STAT-001",
            "booking_no": "BOOK-REPORT-STAT-001",
            "document_owner_name": "单证部",
            "estimated_payable_amount": "320.00",
            "remarks": "经理统计前置出货单",
            "selections": [{"contract_id": contract["id"], "quantity": "50"}],
        },
    )
    assert create_response.status_code == 201
    shipment = create_response.json()["data"]
    submit_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_response.status_code == 200
    approve_response = await api_client.post(
        f"/api/v1/sales/shipments/{shipment['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={"reviewer_name": "演示业务主管", "approved_at": "2027-03-16"},
    )
    assert approve_response.status_code == 200
    return approve_response.json()["data"]


async def test_reporting_statistics_aggregates_business_reports(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client)
    export_contract = await _approved_export_contract(
        api_client,
        token,
        "EC-REPORT-STAT-001",
    )
    purchase_contract = await _approved_purchase_contract(
        api_client,
        token,
        "PC-REPORT-STAT-001",
    )
    shipment = await _approved_shipment(api_client, token, export_contract)

    response = await api_client.get(
        "/api/v1/reporting/statistics",
        headers={"Authorization": f"Bearer {token}"},
        params={"date_from": "2027-03-01", "date_to": "2027-03-31"},
    )

    assert response.status_code == 200
    statistics = response.json()["data"]
    assert statistics["summary"]["export_contract_count"] == 1
    assert statistics["summary"]["export_contract_amount"] == "1200.00"
    assert statistics["summary"]["purchase_contract_count"] == 1
    assert statistics["summary"]["purchase_contract_amount"] == "54.00"
    assert statistics["summary"]["shipment_count"] == 1
    assert statistics["summary"]["shipment_receivable_amount"] == "600.00"
    assert statistics["summary"]["shipment_profit_amount"] == "280.00"
    assert statistics["summary"]["currency_label"] == "USD"

    export_statuses = {
        item["status"]: item for item in statistics["export_contract_statuses"]
    }
    assert export_statuses["approved"]["count"] == 1
    assert export_statuses["approved"]["amount"] == "1200.00"
    assert export_statuses["approved"]["source_path"] == "/sales/contracts?approval_status=approved"

    purchase_statuses = {
        item["status"]: item for item in statistics["purchase_contract_statuses"]
    }
    assert purchase_statuses["approved"]["count"] == 1
    assert purchase_statuses["approved"]["amount"] == "54.00"
    assert purchase_statuses["approved"]["source_path"] == (
        "/purchase/contracts?approval_status=approved"
    )

    assert statistics["customer_shipments"] == [
        {
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "currency": "USD",
            "shipment_count": 1,
            "receivable_amount": "600.00",
            "profit_amount": "280.00",
            "source_path": "/sales/shipments?customer_id=customer-euro-home",
        }
    ]
    assert statistics["sales_monthly_shipments"] == [
        {
            "period": "2027-03",
            "sales_user_id": "u-001",
            "sales_user_name": "演示业务主管",
            "currency": "USD",
            "shipment_count": 1,
            "shipped_amount": "600.00",
            "source_path": "/sales/shipments?sales_user_id=u-001&period=2027-03",
        }
    ]
    assert statistics["shipment_items"][0]["shipment_no"] == shipment["code"]
    assert statistics["shipment_items"][0]["source_path"] == f"/sales/shipments/{shipment['id']}"
    assert statistics["export_contract_items"][0]["source_path"] == (
        f"/sales/contracts/{export_contract['id']}"
    )
    assert statistics["purchase_contract_items"][0]["source_path"] == (
        f"/purchase/contracts/{purchase_contract['id']}"
    )


async def test_reporting_statistics_permissions_and_invalid_dates(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    manager_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")

    denied_response = await api_client.get(
        "/api/v1/reporting/statistics",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert denied_response.status_code == 403

    invalid_response = await api_client.get(
        "/api/v1/reporting/statistics",
        headers={"Authorization": f"Bearer {manager_token}"},
        params={"date_from": "2027-04-01", "date_to": "2027-03-01"},
    )
    assert invalid_response.status_code == 422

    unauthorized_response = await api_client.get("/api/v1/reporting/statistics")
    assert unauthorized_response.status_code == 401
