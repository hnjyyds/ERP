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


def _batch_payload(
    *,
    batch_no: str = "PORT-API-001",
    record_count: int = 2,
) -> dict[str, object]:
    return {
        "batch_no": batch_no,
        "source": "宁波海关",
        "imported_at": "2026-12-20",
        "record_count": record_count,
        "remark": "口岸进出口报关数据导入",
        "records": [
            {
                "declaration_no": "BG-2026-0001",
                "customs_receipt_no": "HD-2026-0001",
                "trade_type": "export",
                "export_contract_no": "EC-PORT-001",
                "customs_date": "2026-12-18",
                "product_name": "Eco Shopping Bag",
                "hs_code": "6305330090",
                "quantity": "100",
                "unit": "pcs",
                "amount": "1200.00",
                "currency": "USD",
                "customer_or_supplier": "欧陆家居用品有限公司",
            },
            {
                "declaration_no": "BG-2026-0002",
                "customs_receipt_no": None,
                "trade_type": "import",
                "product_name": "无纺布原料",
                "amount": "800.00",
                "currency": "CNY",
            },
        ],
    }


async def test_finance_port_data_import_and_query(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")

    import_response = await api_client.post(
        "/api/v1/finance/port-import-batches",
        headers={"Authorization": f"Bearer {finance_token}"},
        json=_batch_payload(),
    )
    assert import_response.status_code == 201
    batch = import_response.json()["data"]
    assert batch["batch_no"] == "PORT-API-001"
    assert batch["status"] == "imported"
    assert batch["record_count"] == 2
    assert len(batch["records"]) == 2

    batches_response = await api_client.get(
        "/api/v1/finance/port-import-batches",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"source": "宁波海关"},
    )
    assert batches_response.status_code == 200
    batches = batches_response.json()["data"]
    assert batches["total"] == 1
    assert batches["items"][0]["batch_no"] == "PORT-API-001"

    records_response = await api_client.get(
        "/api/v1/finance/customs-declaration-records",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert records_response.status_code == 200
    records = records_response.json()["data"]
    assert records["total"] == 2

    export_response = await api_client.get(
        "/api/v1/finance/customs-declaration-records",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"trade_type": "export"},
    )
    assert export_response.status_code == 200
    export_records = export_response.json()["data"]
    assert export_records["total"] == 1
    assert export_records["items"][0]["declaration_no"] == "BG-2026-0001"

    receipt_response = await api_client.get(
        "/api/v1/finance/customs-declaration-records",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"customs_receipt_no": "HD-2026-0001"},
    )
    assert receipt_response.status_code == 200
    receipt_records = receipt_response.json()["data"]
    assert receipt_records["total"] == 1
    assert receipt_records["items"][0]["customs_receipt_no"] == "HD-2026-0001"


async def test_finance_port_data_rejects_invalid_and_permissions(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    finance_token = await _login_token(api_client, "finance", "finance123")

    denied_response = await api_client.post(
        "/api/v1/finance/port-import-batches",
        headers={"Authorization": f"Bearer {business_token}"},
        json=_batch_payload(batch_no="PORT-DENIED"),
    )
    assert denied_response.status_code == 403

    mismatch_response = await api_client.post(
        "/api/v1/finance/port-import-batches",
        headers={"Authorization": f"Bearer {finance_token}"},
        json=_batch_payload(batch_no="PORT-MISMATCH", record_count=5),
    )
    assert mismatch_response.status_code == 422

    unauthorized_response = await api_client.get("/api/v1/finance/customs-declaration-records")
    assert unauthorized_response.status_code == 401
