import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.masterdata.products.schemas import ProductCreate, ProductUpdate
from app.modules.masterdata.products.services import PermissionDeniedError, ProductService
from app.modules.system.auth.schemas import CurrentUserResponse


def _user_with_permissions(permissions: list[str]) -> CurrentUserResponse:
    return CurrentUserResponse(
        id="u-test",
        username="tester",
        display_name="测试用户",
        department_name="测试部",
        roles=["测试角色"],
        permissions=permissions,
    )


async def test_product_service_creates_product_with_accessories(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = ProductService(ProductRepository(session))
        product = await service.create_product(
            current_user=_user_with_permissions(["masterdata:product:edit"]),
            payload=ProductCreate(
                code="P-CUP-001",
                cn_name="随手杯",
                en_name="Travel Cup",
                customs_code="3924100000",
                tax_rate="0.13",
                rebate_rate="0.09",
                package_info="24 pcs/carton",
                unit="pcs",
                accessories=[
                    {
                        "accessory_name": "杯盖",
                        "unit_consumption": "1",
                        "unit": "pcs",
                        "default_supplier_name": "杯盖供应商",
                        "purchase_split_rule": "by_accessory",
                    }
                ],
            ),
        )

    assert product.code == "P-CUP-001"
    assert product.status == "active"
    assert product.accessories[0].accessory_name == "杯盖"


async def test_product_service_updates_and_deactivates_product(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = _user_with_permissions(["masterdata:product:edit", "masterdata:product:view"])
    async with session_factory() as session:
        service = ProductService(ProductRepository(session))
        product = await service.create_product(
            current_user=user,
            payload=ProductCreate(
                code="P-BOX-001",
                cn_name="礼盒",
                en_name="Gift Box",
                customs_code="4819200000",
                tax_rate="0.13",
                rebate_rate="0.09",
                package_info="60 pcs/carton",
                unit="pcs",
            ),
        )
        updated = await service.update_product(
            current_user=user,
            product_id=product.id,
            payload=ProductUpdate(
                code="P-BOX-001",
                cn_name="礼盒-更新",
                en_name="Gift Box Updated",
                customs_code="4819200000",
                tax_rate="0.13",
                rebate_rate="0.09",
                package_info="40 pcs/carton",
                unit="pcs",
                status="active",
            ),
        )
        deactivated = await service.deactivate_product(current_user=user, product_id=product.id)

    assert updated.cn_name == "礼盒-更新"
    assert deactivated.status == "inactive"


async def test_product_service_rejects_missing_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = ProductService(ProductRepository(session))
        with pytest.raises(PermissionDeniedError):
            await service.list_products(
                current_user=_user_with_permissions(["dashboard:view"]),
                q=None,
            )
