"""既有测试使用的主数据引用种子。

测试里长期使用固定的客户/商品/供应商 ID，本模块按这些 ID 落库，
使服务层新增的存在性/启用校验不会把既有用例误判为非法引用。
"""

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.customers.models import Customer
from app.modules.masterdata.products.models import Product
from app.modules.masterdata.suppliers.models import Supplier

CUSTOMER_IDS = (
    "customer-a",
    "customer-b",
    "customer-euro-home",
    "customer-dashboard",
    "customer-product-txn",
    "customer-link",
)
PRODUCT_IDS = (
    "product-a",
    "product-b",
    "product-bag",
    "product-rope",
    "product-label",
    "product-box",
    "accessory-cotton-rope",
)
SUPPLIER_IDS = (
    "supplier-a",
    "supplier-pack",
    "supplier-pack-a",
    "supplier-pack-b",
    "supplier-dashboard",
    "supplier-1",
    "supplier-label-a",
    "supplier-product-txn",
    "supplier-inv-txn",
)


async def seed_reference_master_data(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        for record_id in CUSTOMER_IDS:
            if await session.get(Customer, record_id) is None:
                session.add(
                    Customer(
                        id=record_id,
                        code=f"REF-{record_id.upper()}",
                        cn_name=f"测试客户 {record_id}",
                        en_name=f"Test Customer {record_id}",
                        country="US",
                        status="active",
                        owner_user_id="u-001",
                    )
                )
        for record_id in SUPPLIER_IDS:
            if await session.get(Supplier, record_id) is None:
                session.add(
                    Supplier(
                        id=record_id,
                        code=f"REF-{record_id.upper()}",
                        cn_name=f"测试工厂 {record_id}",
                        en_name=f"Test Factory {record_id}",
                        country="CN",
                        status="active",
                        owner_user_id="u-001",
                    )
                )
        for record_id in PRODUCT_IDS:
            if await session.get(Product, record_id) is None:
                session.add(
                    Product(
                        id=record_id,
                        code=f"REF-{record_id.upper()}",
                        cn_name=f"测试商品 {record_id}",
                        en_name=f"Test Product {record_id}",
                        customs_code="4202220000",
                        tax_rate=Decimal("0.13"),
                        rebate_rate=Decimal("0.13"),
                        package_info="100pcs/carton",
                        unit="pcs",
                        status="active",
                    )
                )
        await session.commit()
