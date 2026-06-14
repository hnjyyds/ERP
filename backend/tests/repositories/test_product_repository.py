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
