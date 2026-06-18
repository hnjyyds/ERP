from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.auth.models import RolePermission

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

REPORT_EXPORT_ENDPOINTS = [
    ("/api/v1/finance/reports/receipt-usage/export", "水单号", "finance-receipt-usage"),
    (
        "/api/v1/finance/reports/bank-receipt-summary/export",
        "汇总类型",
        "finance-bank-receipt-summary",
    ),
    ("/api/v1/finance/reports/goods-payment/export", "付款单号", "finance-goods-payment"),
    ("/api/v1/finance/reports/fee-payment/export", "付费单号", "finance-fee-payment"),
    (
        "/api/v1/finance/reports/customs-receipt-collection/export",
        "核销单号",
        "finance-customs-receipt-collection",
    ),
    (
        "/api/v1/finance/reports/tax-refund-statistics/export",
        "汇总类型",
        "finance-tax-refund-statistics",
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


async def test_finance_report_exports_require_login(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    for endpoint, _, _ in REPORT_EXPORT_ENDPOINTS:
        response = await api_client.get(endpoint)
        assert response.status_code == 401, endpoint


async def test_finance_report_exports_require_finance_permission(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    business_token = await _login_token(api_client)
    for endpoint, _, _ in REPORT_EXPORT_ENDPOINTS:
        response = await api_client.get(
            endpoint,
            headers={"Authorization": f"Bearer {business_token}"},
        )
        assert response.status_code == 403, endpoint


async def test_finance_report_exports_require_export_permission(
    api_client: AsyncClient,
    session_factory: async_sessionmaker[AsyncSession],
    seeded_system: None,
) -> None:
    async with session_factory() as session:
        await session.execute(
            delete(RolePermission).where(
                RolePermission.role_id == "role-finance",
                RolePermission.permission_id == "perm-finance-report-export",
            )
        )
        await session.commit()

    finance_token = await _login_token(api_client, "finance", "finance123")
    response = await api_client.get(
        "/api/v1/finance/reports/receipt-usage/export",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert response.status_code == 403


async def test_finance_report_exports_return_csv_for_finance_export_user(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    for endpoint, expected_header, filename_prefix in REPORT_EXPORT_ENDPOINTS:
        response = await api_client.get(
            endpoint,
            headers={"Authorization": f"Bearer {finance_token}"},
            params={
                "date_from": "2026-01-01",
                "date_to": "2026-12-31",
                "currency": "USD",
            },
        )
        assert response.status_code == 200, endpoint
        data = response.json()["data"]
        assert data["filename"] == f"{filename_prefix}.csv"
        assert data["content_type"] == "text/csv"
        assert isinstance(data["total"], int)
        assert expected_header in data["content"]


async def test_finance_report_exports_reject_format_parameter(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    response = await api_client.get(
        "/api/v1/finance/reports/receipt-usage/export",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"format": "pdf"},
    )
    assert response.status_code == 422


async def test_finance_reports_explain_metric_and_return_drilldown_contract(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")

    explain_response = await api_client.get(
        "/api/v1/finance/reports/receipt-usage/explain",
        headers={"Authorization": f"Bearer {finance_token}"},
    )
    assert explain_response.status_code == 200
    explain = explain_response.json()["data"]
    assert explain["report_key"] == "receipt-usage"
    assert "finance_bank_receipts" in explain["source_tables"]
    assert explain["fields"][0]["label"] == "水单号"

    drilldown_response = await api_client.get(
        "/api/v1/finance/reports/receipt-usage/drilldown",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"source_no": "BR-NOT-EXISTS"},
    )
    assert drilldown_response.status_code == 200
    drilldown = drilldown_response.json()["data"]
    assert drilldown["report_key"] == "receipt-usage"
    assert drilldown["source_type"] == "bank_receipt"
    assert drilldown["source_no"] == "BR-NOT-EXISTS"
    assert drilldown["items"] == []

    alias_response = await api_client.get(
        "/api/v1/finance/reports/receipt-usage/drilldown",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"receipt_no": "BR-NOT-EXISTS"},
    )
    assert alias_response.status_code == 422

    summary_response = await api_client.get(
        "/api/v1/finance/reports/bank-receipt-summary/drilldown",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={"source_no": "USD"},
    )
    assert summary_response.status_code == 422


async def test_finance_report_special_filters_are_exposed_by_api(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    finance_token = await _login_token(api_client, "finance", "finance123")
    response = await api_client.get(
        "/api/v1/finance/reports/fee-payment",
        headers={"Authorization": f"Bearer {finance_token}"},
        params={
            "date_from": "2026-01-01",
            "date_to": "2026-12-31",
            "currency": "USD",
            "partner_name": "宁波远景物流",
            "fee_type": "ocean_freight",
            "sales_user_id": "u-001",
            "status": "submitted",
        },
    )
    assert response.status_code == 200
    assert response.json()["data"]["rows"] == []
