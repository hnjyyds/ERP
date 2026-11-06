"""英文契约测试：各业务域错误响应在 Accept-Language: en-US 下输出英文文案。"""

import pytest
from httpx import AsyncClient

ENGLISH = {"Accept-Language": "en-US"}


async def _login(
    api_client: AsyncClient,
    username: str = "demo",
    password: str = "demo123",
) -> dict[str, str]:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}", **ENGLISH}


async def _get(
    api_client: AsyncClient,
    path: str,
    headers: dict[str, str],
) -> dict[str, object]:
    response = await api_client.get(path, headers=headers)
    return response.json()


async def test_auth_domain_error_is_english(api_client: AsyncClient, seeded_system: None) -> None:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "wrong"},
        headers=ENGLISH,
    )

    body = response.json()
    assert response.status_code == 401
    assert body["code"] == "INVALID_CREDENTIALS"
    assert body["message"] == "Invalid username or password"


async def test_masterdata_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    body = await _get(api_client, "/api/v1/masterdata/products/missing-product", headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Product not found"


async def test_purchase_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    body = await _get(api_client, "/api/v1/purchase/contracts/missing-contract", headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Purchase contract not found"


async def test_quality_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    body = await _get(api_client, "/api/v1/quality/inspections/missing-inspection", headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "QC task not found"


async def test_warehouse_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    body = await _get(api_client, "/api/v1/warehouse/inbound-orders/missing-order", headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Inbound order not found"


async def test_sales_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    body = await _get(api_client, "/api/v1/sales/quotations/missing-quotation", headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Export quotation not found"


async def test_finance_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client, "finance", "finance123")
    body = await _get(
        api_client,
        "/api/v1/finance/reports/unknown-report/explain",
        headers,
    )

    assert body["code"] == "VALIDATION_ERROR"
    assert body["message"] == "Financial report not found"


async def test_sample_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    body = await _get(api_client, "/api/v1/sample/deliveries/missing-delivery", headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Sample delivery not found"


async def test_followup_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    body = await _get(api_client, "/api/v1/followup/missing-plan", headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Follow-up task not found"


async def test_reporting_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    response = await api_client.get(
        "/api/v1/reporting/approvals",
        params={"document_type": "unknown-type"},
        headers=headers,
    )

    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert body["message"] == "Invalid approval document type"


async def test_dashboard_domain_error_is_english(
    api_client: AsyncClient,
    seeded_system: None,
) -> None:
    headers = await _login(api_client)
    response = await api_client.delete(
        "/api/v1/schedules/missing-schedule",
        headers=headers,
    )

    body = response.json()
    assert response.status_code == 404
    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Schedule not found"


@pytest.mark.parametrize("accept_language", ["zh-CN", None])
async def test_default_language_keeps_chinese_domain_message(
    api_client: AsyncClient,
    seeded_system: None,
    accept_language: str | None,
) -> None:
    headers: dict[str, str] = {}
    login_response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
        headers=headers,
    )
    token = login_response.json()["data"]["access_token"]
    request_headers = {"Authorization": f"Bearer {token}"}
    if accept_language is not None:
        request_headers["Accept-Language"] = accept_language

    body = await _get(api_client, "/api/v1/masterdata/products/missing-product", request_headers)

    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "商品不存在"
