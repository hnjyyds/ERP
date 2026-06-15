from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.products.repositories import ProductRepository, ProductRow


async def test_product_repository_returns_typed_rows(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ProductRepository(session)
        await repository.create_product(
            code="P-MUG-001",
            cn_name="陶瓷杯",
            en_name="Ceramic Mug",
            specification="350ml",
            model="MUG-350",
            customs_code="6911101900",
            tax_rate="0.13",
            rebate_rate="0.09",
            package_info="48 pcs/carton",
            unit="pcs",
            image_url=None,
        )
        await session.commit()

        rows, total = await repository.list_products(q="Mug")

    assert total == 1
    assert isinstance(rows[0], ProductRow)
    assert rows[0].code == "P-MUG-001"
    assert rows[0].status == "active"


async def test_product_repository_updates_and_hides_inactive_rows(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = ProductRepository(session)
        product = await repository.create_product(
            code="P-GLASS-001",
            cn_name="玻璃杯",
            en_name="Glass Cup",
            specification="300ml",
            model="GL-300",
            customs_code="7013370000",
            tax_rate="0.13",
            rebate_rate="0.09",
            package_info="36 pcs/carton",
            unit="pcs",
            image_url=None,
        )
        updated = await repository.update_product(
            product_id=product.id,
            code="P-GLASS-001",
            cn_name="玻璃杯-更新",
            en_name="Glass Cup Updated",
            specification="320ml",
            model="GL-320",
            customs_code="7013370000",
            tax_rate="0.13",
            rebate_rate="0.09",
            package_info="24 pcs/carton",
            unit="pcs",
            image_url=None,
            status="active",
        )
        assert updated is not None
        assert updated.cn_name == "玻璃杯-更新"

        inactive = await repository.deactivate_product(product.id)
        assert inactive is not None
        assert inactive.status == "inactive"
        rows, total = await repository.list_products(q="GLASS")
        all_rows, all_total = await repository.list_products(q="GLASS", include_inactive=True)

    assert rows == []
    assert total == 0
    assert all_total == 1
    assert all_rows[0].status == "inactive"
