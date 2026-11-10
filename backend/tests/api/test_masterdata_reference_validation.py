import json

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.customers.models import Customer
from app.modules.masterdata.products.models import Product

pytestmark = pytest.mark.usefixtures("seeded_system", "reference_master_data")


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


def _quotation_payload(
    *,
    customer_id: str = "customer-a",
    product_id: str = "product-a",
    description: str = "主数据校验",
) -> dict[str, object]:
    return {
        "quote_date": "2026-07-01",
        "customer_id": customer_id,
        "customer_name": "客户 A",
        "sales_user_id": "u-001",
        "sales_user_name": "演示业务主管",
        "currency": "USD",
        "trade_term": "FOB Ningbo",
        "valid_until": "2026-07-15",
        "description": description,
        "lines": [
            {
                "product_id": product_id,
                "product_code": "BAG-40",
                "product_name": "Eco Bag",
                "quantity": "1000",
                "unit": "pcs",
                "unit_price": "1.25",
                "freight_method": "sea",
            }
        ],
    }


def _purchase_contract_payload(supplier_id: str) -> dict[str, object]:
    return {
        "contract_date": "2026-08-05",
        "supplier_id": supplier_id,
        "supplier_name": "工厂甲",
        "buyer_user_id": "u-001",
        "buyer_user_name": "演示业务主管",
        "currency": "USD",
        "delivery_date": "2026-08-28",
        "payment_terms": "30% 预付，70% 出货前",
        "source_type": "stock_purchase",
        "lines": [
            {
                "product_id": "product-a",
                "product_code": "BAG-40",
                "product_name": "Eco Bag",
                "quantity": "100",
                "unit": "pcs",
                "unit_price": "1.00",
            }
        ],
    }


async def _add_customer(
    session_factory: async_sessionmaker[AsyncSession],
    record_id: str,
    status: str,
) -> None:
    async with session_factory() as session:
        session.add(
            Customer(
                id=record_id,
                code=f"TEST-{record_id}",
                cn_name=f"客户 {record_id}",
                en_name=f"Customer {record_id}",
                country="US",
                status=status,
                owner_user_id="u-001",
            )
        )
        await session.commit()


async def _set_customer_status(
    session_factory: async_sessionmaker[AsyncSession],
    record_id: str,
    status: str,
) -> None:
    async with session_factory() as session:
        customer = await session.get(Customer, record_id)
        assert customer is not None
        customer.status = status
        await session.commit()


async def _add_inactive_product(
    session_factory: async_sessionmaker[AsyncSession],
    record_id: str,
) -> None:
    async with session_factory() as session:
        session.add(
            Product(
                id=record_id,
                code=f"INACTIVE-{record_id}",
                cn_name=f"停用商品 {record_id}",
                en_name=f"Inactive Product {record_id}",
                customs_code="4202220000",
                tax_rate="0.13",
                rebate_rate="0.13",
                package_info="100pcs/carton",
                unit="pcs",
                status="inactive",
            )
        )
        await session.commit()


def _assert_error(response, status_code: int, code: str) -> None:
    assert response.status_code == status_code, response.json()
    assert code in json.dumps(response.json(), ensure_ascii=False)


@pytest.mark.asyncio
async def test_quotation_rejects_missing_customer(api_client: AsyncClient) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json=_quotation_payload(customer_id="missing-customer"),
    )
    _assert_error(response, 422, "VALIDATION_ERROR")


@pytest.mark.asyncio
async def test_quotation_rejects_inactive_product(
    api_client: AsyncClient,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await _add_inactive_product(session_factory, "inactive-product")
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"},
        json=_quotation_payload(product_id="inactive-product"),
    )
    _assert_error(response, 409, "CONFLICT")


@pytest.mark.asyncio
async def test_edit_keeps_inactive_existing_reference(
    api_client: AsyncClient,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await _add_customer(session_factory, "legacy-customer", "active")
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = await api_client.post(
        "/api/v1/sales/quotations",
        headers=headers,
        json=_quotation_payload(customer_id="legacy-customer"),
    )
    assert create_response.status_code == 201, create_response.json()
    quotation_id = create_response.json()["data"]["id"]
    await _set_customer_status(session_factory, "legacy-customer", "inactive")

    update_response = await api_client.put(
        f"/api/v1/sales/quotations/{quotation_id}",
        headers=headers,
        json=_quotation_payload(customer_id="legacy-customer", description="仅修改描述"),
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["customer_id"] == "legacy-customer"


@pytest.mark.asyncio
async def test_edit_rejects_switching_to_inactive_customer(
    api_client: AsyncClient,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await _add_customer(session_factory, "another-inactive", "inactive")
    token = await _login_token(api_client)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = await api_client.post(
        "/api/v1/sales/quotations",
        headers=headers,
        json=_quotation_payload(customer_id="customer-a"),
    )
    assert create_response.status_code == 201, create_response.json()
    quotation_id = create_response.json()["data"]["id"]

    update_response = await api_client.put(
        f"/api/v1/sales/quotations/{quotation_id}",
        headers=headers,
        json=_quotation_payload(customer_id="another-inactive"),
    )
    _assert_error(update_response, 409, "CONFLICT")


@pytest.mark.asyncio
async def test_purchase_contract_rejects_missing_supplier(api_client: AsyncClient) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/purchase/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json=_purchase_contract_payload("missing-supplier"),
    )
    _assert_error(response, 422, "VALIDATION_ERROR")


@pytest.mark.asyncio
async def test_document_party_rejects_missing_customer(api_client: AsyncClient) -> None:
    token = await _login_token(api_client)
    response = await api_client.post(
        "/api/v1/masterdata/document-parties",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "DP-MD-001",
            "party_type": "consignee",
            "display_name": "收货人",
            "customer_id": "missing-customer",
            "customer_name": "客户",
            "country": "Germany",
            "status": "active",
        },
    )
    _assert_error(response, 422, "VALIDATION_ERROR")


@pytest.mark.asyncio
async def test_receipt_rejects_missing_customer(api_client: AsyncClient) -> None:
    token = await _login_token(api_client, "finance", "finance123")
    response = await api_client.post(
        "/api/v1/finance/receipts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "received_at": "2026-08-01",
            "payer_name": "Customer",
            "customer_id": "missing-customer",
            "customer_name": "客户",
            "amount": "100.00",
            "currency": "USD",
            "bank_account": "BOC 6222 ****",
            "reference_no": "SWIFT-MD-001",
            "receipt_type": "advance",
        },
    )
    _assert_error(response, 422, "VALIDATION_ERROR")
