"""报表、导出与打印的英文契约：Accept-Language 决定表头与说明文案。"""

import pytest
from httpx import AsyncClient

ENGLISH = {"Accept-Language": "en-US"}

_FINANCE_EXPORTS = [
    ("/api/v1/finance/reports/receipt-usage/export", "Bank slip no."),
    ("/api/v1/finance/reports/bank-receipt-summary/export", "Summary type"),
    ("/api/v1/finance/reports/goods-payment/export", "Payment no."),
    ("/api/v1/finance/reports/fee-payment/export", "Fee payment no."),
    ("/api/v1/finance/reports/customs-receipt-collection/export", "Write-off form no."),
    ("/api/v1/finance/reports/tax-refund-statistics/export", "Summary type"),
]


async def _login_token(
    api_client: AsyncClient,
    username: str = "demo",
    password: str = "demo123",
    headers: dict[str, str] | None = None,
) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
        headers=headers,
    )
    return response.json()["data"]["access_token"]


@pytest.mark.parametrize(("endpoint", "expected_header"), _FINANCE_EXPORTS)
async def test_finance_report_export_headers_are_english(
    api_client: AsyncClient,
    seeded_system: None,
    endpoint: str,
    expected_header: str,
) -> None:
    token = await _login_token(api_client, "finance", "finance123", ENGLISH)

    response = await api_client.get(
        endpoint,
        headers={"Authorization": f"Bearer {token}", **ENGLISH},
        params={"date_from": "2026-01-01", "date_to": "2026-12-31"},
    )

    assert response.status_code == 200
    content = response.json()["data"]["content"]
    assert content.splitlines()[0].startswith(expected_header)


async def test_sample_delivery_export_headers_are_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, headers=ENGLISH)

    response = await api_client.get(
        "/api/v1/sample/deliveries/export",
        headers={"Authorization": f"Bearer {token}", **ENGLISH},
        params={"date_from": "2026-01-01", "date_to": "2026-12-31"},
    )

    assert response.status_code == 200
    content = response.json()["data"]["content"]
    assert content.splitlines()[0].startswith("Sample delivery no.,")


async def test_finance_report_explanation_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, "finance", "finance123", ENGLISH)

    response = await api_client.get(
        "/api/v1/finance/reports/receipt-usage/explain",
        headers={"Authorization": f"Bearer {token}", **ENGLISH},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["title"] == "Bank receipt usage details"
    assert data["fields"][0]["label"] == "Bank slip no."
    assert data["metric_rules"][0] == "Filtered by bank slip allocation date."


async def test_default_language_keeps_chinese_export_headers(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    token = await _login_token(api_client, "finance", "finance123")

    response = await api_client.get(
        "/api/v1/finance/reports/receipt-usage/export",
        headers={"Authorization": f"Bearer {token}"},
        params={"date_from": "2026-01-01", "date_to": "2026-12-31"},
    )

    content = response.json()["data"]["content"]
    assert content.splitlines()[0].startswith("水单号,")
