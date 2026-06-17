from httpx import AsyncClient

REPORT_ENDPOINTS = [
    ("/api/v1/finance/reports/receipt-usage", ["rows", "currency_summaries", "total_count"]),
    (
        "/api/v1/finance/reports/bank-receipt-summary",
        ["currency_summaries", "operator_summaries", "receipt_count"],
    ),
    ("/api/v1/finance/reports/goods-payment", ["rows", "currency_summaries", "total_count"]),
    ("/api/v1/finance/reports/fee-payment", ["rows", "currency_summaries", "total_count"]),
    (
        "/api/v1/finance/reports/customs-receipt-collection",
        ["rows", "status_summaries", "total_count"],
    ),
    (
        "/api/v1/finance/reports/tax-refund-statistics",
        ["status_summaries", "currency_totals", "document_count", "refund_record_count"],
    ),
]


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


async def test_finance_reports_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    for endpoint, _ in REPORT_ENDPOINTS:
        response = await api_client.get(endpoint)
        assert response.status_code == 401, endpoint


async def test_finance_reports_require_finance_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    for endpoint, _ in REPORT_ENDPOINTS:
        response = await api_client.get(
            endpoint,
            headers={"Authorization": f"Bearer {business_token}"},
        )
        assert response.status_code == 403, endpoint


async def test_finance_reports_return_empty_structure_for_finance_user(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    for endpoint, expected_keys in REPORT_ENDPOINTS:
        response = await api_client.get(
            endpoint,
            headers={"Authorization": f"Bearer {finance_token}"},
        )
        assert response.status_code == 200, endpoint
        data = response.json()["data"]
        for key in expected_keys:
            assert key in data, f"{endpoint} missing {key}"
        for list_key in ("rows", "currency_summaries", "operator_summaries",
                         "status_summaries", "currency_totals"):
            if list_key in data:
                assert isinstance(data[list_key], list), f"{endpoint}.{list_key}"


async def test_finance_reports_accept_filter_params_for_finance_user(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    response = await api_client.get(
        "/api/v1/finance/reports/goods-payment",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={
            "date_from": "2026-01-01",
            "date_to": "2026-12-31",
            "currency": "USD",
            "status": "submitted",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["rows"] == []
    assert data["currency_summaries"] == []
    assert data["total_count"] == 0
