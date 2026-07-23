from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.mcp.crud_service import ConfirmationRequiredError, ErpMcpCrudService
from app.modules.masterdata.customers.schemas import CustomerCreate, CustomerUpdate
from app.modules.masterdata.products.schemas import ProductCreate, ProductUpdate
from app.modules.sales.contracts.schemas import ExportContractCreate, ExportContractLineCreate
from app.modules.sales.contracts.services import ExportContractNotFoundError
from app.modules.system.auth.seed import seed_system_demo_data
from app.modules.system.auth.services import InvalidTokenError, TokenService


async def _user_id(session_factory: async_sessionmaker[AsyncSession]) -> str:
    async with session_factory() as session:
        await seed_system_demo_data(session)
    return "u-001"


@pytest.mark.asyncio
async def test_mcp_service_requires_valid_access_token(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    service = ErpMcpCrudService(
        session_factory=session_factory,
        token_service=TokenService(secret_key="test-secret"),
    )

    with pytest.raises(InvalidTokenError):
        await service.list_products(user_id="invalid", q=None, limit=20, offset=0)


@pytest.mark.asyncio
async def test_mcp_service_supports_product_customer_and_export_order_crud(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    token_service = TokenService(secret_key="test-secret")
    user_id = await _user_id(session_factory)
    service = ErpMcpCrudService(
        session_factory=session_factory,
        token_service=token_service,
    )

    product = await service.create_product(
        user_id=user_id,
        payload=ProductCreate(
            code="MCP-P-001",
            cn_name="MCP 测试商品",
            en_name="MCP Test Product",
            customs_code="42029200",
            tax_rate="0.13",
            rebate_rate="0.09",
            package_info="10 pcs/carton",
            unit="pcs",
        ),
    )
    product = await service.update_product(
        user_id=user_id,
        product_id=product.id,
        payload=ProductUpdate(
            code="MCP-P-001",
            cn_name="MCP 测试商品（已更新）",
            en_name="MCP Test Product Updated",
            customs_code="42029200",
            tax_rate="0.13",
            rebate_rate="0.09",
            package_info="20 pcs/carton",
            unit="pcs",
        ),
    )
    product_page = await service.list_products(
        user_id=user_id,
        q="MCP-P-001",
        limit=10,
        offset=0,
    )
    assert product.cn_name.endswith("（已更新）")
    assert product_page.total == 1
    loaded_product = await service.get_product(
        user_id=user_id,
        product_id=product.id,
    )
    assert loaded_product.id == product.id
    with pytest.raises(ConfirmationRequiredError):
        await service.delete_product(
            user_id=user_id,
            product_id=product.id,
            confirm=False,
        )
    deleted_product = await service.delete_product(
        user_id=user_id,
        product_id=product.id,
        confirm=True,
    )
    assert deleted_product.status == "inactive"

    customer = await service.create_customer(
        user_id=user_id,
        payload=CustomerCreate(
            code="MCP-C-001",
            cn_name="MCP 测试客户",
            en_name="MCP Test Customer",
            country="DE",
        ),
    )
    customer = await service.update_customer(
        user_id=user_id,
        customer_id=customer.id,
        payload=CustomerUpdate(
            cn_name="MCP 测试客户（已更新）",
            en_name="MCP Test Customer Updated",
            country="DE",
            address="Berlin",
        ),
    )
    customer_page = await service.list_customers(
        user_id=user_id,
        q="MCP-C-001",
        country=None,
        credit_grade=None,
        limit=10,
        offset=0,
    )
    assert customer.cn_name.endswith("（已更新）")
    assert customer_page.total == 1
    assert (
        await service.get_customer(user_id=user_id, customer_id=customer.id)
    ).id == customer.id
    deleted_customer = await service.delete_customer(
        user_id=user_id,
        customer_id=customer.id,
        confirm=True,
    )
    assert deleted_customer.status == "inactive"

    order_payload = ExportContractCreate(
        code="MCP-EC-001",
        contract_date=date(2026, 7, 22),
        customer_id=customer.id,
        customer_name=customer.en_name,
        currency="USD",
        trade_term="FOB",
        planned_ship_date=date(2026, 8, 22),
        payment_terms="30% deposit, 70% before shipment",
        lines=[
            ExportContractLineCreate(
                product_id=product.id,
                product_code=product.code,
                product_name=product.en_name,
                quantity="100",
                unit="pcs",
                unit_price="2.50",
            )
        ],
    )
    order = await service.create_export_order(
        user_id=user_id,
        payload=order_payload,
    )
    updated_order_payload = order_payload.model_copy(
        update={"payment_terms": "50% deposit, 50% before shipment"}
    )
    order = await service.update_export_order(
        user_id=user_id,
        order_id=order.id,
        payload=updated_order_payload,
    )
    order_page = await service.list_export_orders(
        user_id=user_id,
        q="MCP-EC-001",
        approval_status="draft",
        customer_id=None,
        limit=10,
        offset=0,
    )
    assert order.payment_terms.startswith("50%")
    assert order_page.total == 1
    assert (
        await service.get_export_order(user_id=user_id, order_id=order.id)
    ).id == order.id
    await service.delete_export_order(
        user_id=user_id,
        order_id=order.id,
        confirm=True,
    )
    with pytest.raises(ExportContractNotFoundError):
        await service.get_export_order(user_id=user_id, order_id=order.id)
