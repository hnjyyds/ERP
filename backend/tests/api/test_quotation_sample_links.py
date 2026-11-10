import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.usefixtures("reference_master_data", "seeded_system")

AUTH = {"Authorization": "Bearer test"}


async def _login_token(api_client: AsyncClient) -> str:
    response = await api_client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo123"},
    )
    return response.json()["data"]["access_token"]


def _quotation_payload(code: str = "QT-LINK-E2E") -> dict[str, object]:
    return {
        "code": code,
        "quote_date": "2026-07-01",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "valid_until": "2026-07-15",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "specification": "40x35cm",
                "model": "BAG-40",
                "quantity": "1000",
                "unit": "pcs",
                "unit_price": "1.25",
                "freight_method": "sea",
                "freight_amount": "120.00",
            }
        ],
    }


async def _create_quotation(api_client: AsyncClient, token: str) -> dict:
    response = await api_client.post(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json=_quotation_payload(),
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]


def _sample_request_payload() -> dict[str, object]:
    return {
        "request_date": "2026-07-02",
        "customer_id": "customer-euro-home",
        "customer_name": "欧陆家居用品有限公司",
        "product_id": "product-bag",
        "product_code": "BAG-40",
        "product_name": "Eco Shopping Bag",
        "destination": "in_house",
        "requirements": "确认颜色",
        "lines": [
            {
                "product_id": "product-bag",
                "product_code": "BAG-40",
                "product_name": "Eco Shopping Bag",
                "quantity": "3",
                "unit": "pcs",
            }
        ],
    }


async def test_create_sample_request_from_quotation(api_client: AsyncClient) -> None:
    token = await _login_token(api_client)
    quotation = await _create_quotation(api_client, token)

    created = await api_client.post(
        f"/api/v1/sales/quotations/{quotation['id']}/sample-requests",
        headers={"Authorization": f"Bearer {token}"},
        json=_sample_request_payload(),
    )
    listed = await api_client.get(
        f"/api/v1/sales/quotations/{quotation['id']}/sample-requests",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert created.status_code == 201, created.text
    data = created.json()["data"]
    assert data["quotation_id"] == quotation["id"]
    assert data["quotation_no"] == quotation["code"]
    assert data["customer_id"] == quotation["customer_id"]
    assert listed.status_code == 200, listed.text
    assert listed.json()["data"]["total"] == 1
    assert listed.json()["data"]["items"][0]["id"] == data["id"]


async def test_sample_request_rejects_unknown_quotation(api_client: AsyncClient) -> None:
    token = await _login_token(api_client)
    payload = _sample_request_payload() | {"quotation_id": "missing-quotation"}

    response = await api_client.post(
        "/api/v1/sample/requests",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert response.status_code == 422


async def test_quotation_sample_deliveries_are_queried_by_id(
    api_client: AsyncClient,
) -> None:
    token = await _login_token(api_client)
    quotation = await _create_quotation(api_client, token)
    record = await api_client.post(
        "/api/v1/sample/records",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "sample_type": "confirm_sample",
            "status": "registered",
            "product_id": "product-bag",
            "product_code": "BAG-40",
            "product_name": "Eco Shopping Bag",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "received_at": "2026-06-22",
            "quantity": "5",
            "unit": "pcs",
        },
    )
    assert record.status_code == 201, record.text
    sample_record = record.json()["data"]

    delivery = await api_client.post(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "delivery_date": "2026-06-25",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "recipient_name": "Anna Schmidt",
            "recipient_address": "Hamburg Trade Center",
            "express_company": "DHL",
            "quotation_id": quotation["id"],
            "quotation_no": "手工错误报价号",
            "lines": [
                {
                    "sample_record_id": sample_record["id"],
                    "quantity": "2",
                }
            ],
        },
    )
    listed = await api_client.get(
        f"/api/v1/sales/quotations/{quotation['id']}/sample-deliveries",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert delivery.status_code == 201, delivery.text
    assert delivery.json()["data"]["quotation_no"] == quotation["code"]
    assert listed.status_code == 200, listed.text
    assert listed.json()["data"]["total"] == 1
    assert listed.json()["data"]["items"][0]["id"] == delivery.json()["data"]["id"]


async def test_sample_delivery_rejects_missing_sample_record(
    api_client: AsyncClient,
) -> None:
    token = await _login_token(api_client)

    response = await api_client.post(
        "/api/v1/sample/deliveries",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "delivery_date": "2026-06-25",
            "customer_id": "customer-euro-home",
            "customer_name": "欧陆家居用品有限公司",
            "recipient_name": "Anna Schmidt",
            "recipient_address": "Hamburg Trade Center",
            "express_company": "DHL",
            "lines": [{"sample_record_id": "missing-record", "quantity": "2"}],
        },
    )

    assert response.status_code == 422
