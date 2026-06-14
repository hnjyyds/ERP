from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.customers.repositories import CustomerRepository, CustomerRow


async def test_customer_repository_filters_by_contact_country_credit_and_owner(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = CustomerRepository(session)
        customer = await repository.create_customer(
            code="C-DE-001",
            cn_name="德国连锁客户",
            en_name="German Chain Buyer",
            country="Germany",
            address="Berlin",
            website=None,
            status="active",
            owner_user_id="u-001",
        )
        await repository.add_contact(
            customer_id=customer.id,
            name="Greta Meyer",
            title="Buyer",
            email="greta@example.com",
            phone="+49",
            is_primary=True,
        )
        await repository.upsert_credit_profile(
            customer_id=customer.id,
            credit_grade="A",
            credit_limit="90000",
            currency="USD",
            payment_terms="T/T 30 days",
            risk_note=None,
        )
        await repository.create_customer(
            code="C-US-001",
            cn_name="美国客户",
            en_name="US Buyer",
            country="United States",
            address=None,
            website=None,
            status="active",
            owner_user_id="u-other",
        )
        await session.commit()

        rows, total = await repository.list_customers(
            q="Greta",
            country="Germany",
            credit_grade="A",
            owner_user_id="u-001",
        )

    assert total == 1
    assert isinstance(rows[0], CustomerRow)
    assert rows[0].code == "C-DE-001"
