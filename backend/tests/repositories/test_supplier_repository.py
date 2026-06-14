from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.suppliers.repositories import SupplierRepository, SupplierRow


async def test_supplier_repository_filters_by_contact_country_credit_and_owner(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = SupplierRepository(session)
        supplier = await repository.create_supplier(
            code="S-CN-REPO-001",
            cn_name="宁波辅料工厂",
            en_name="Ningbo Accessory Factory",
            country="China",
            address="Ningbo",
            website=None,
            status="active",
            owner_user_id="u-001",
        )
        await repository.add_contact(
            supplier_id=supplier.id,
            name="Chen Jun",
            title="Sales",
            email="chen@example.com",
            phone="+86",
            is_primary=True,
        )
        await repository.upsert_credit_profile(
            supplier_id=supplier.id,
            credit_grade="A",
            credit_limit="120000",
            currency="CNY",
            payment_terms="Deposit + balance",
            risk_note=None,
        )
        await repository.create_supplier(
            code="S-VN-001",
            cn_name="越南工厂",
            en_name="Vietnam Factory",
            country="Vietnam",
            address=None,
            website=None,
            status="active",
            owner_user_id="u-other",
        )
        await session.commit()

        rows, total = await repository.list_suppliers(
            q="Chen",
            country="China",
            credit_grade="A",
            owner_user_id="u-001",
        )

    assert total == 1
    assert isinstance(rows[0], SupplierRow)
    assert rows[0].code == "S-CN-REPO-001"
