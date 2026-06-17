from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.partners.repositories import PartnerRepository, PartnerRow


async def test_partner_repository_filters_by_type_contact_and_owner(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = PartnerRepository(session)
        partner = await repository.create_partner(
            code="P-FWD-REPO-001",
            cn_name="上海货代",
            en_name="Shanghai Forwarder",
            partner_type="freight_forwarder",
            country="China",
            address="Shanghai",
            website=None,
            status="active",
            owner_user_id="u-001",
        )
        await repository.add_contact(
            partner_id=partner.id,
            name="Ivy Wu",
            title="Ops",
            email="ivy@example.com",
            phone="+86",
            is_primary=True,
        )
        await repository.create_partner(
            code="P-EXP-001",
            cn_name="快件公司",
            en_name="Express Co.",
            partner_type="express",
            country="China",
            address=None,
            website=None,
            status="active",
            owner_user_id="u-other",
        )
        await session.commit()

        rows, total = await repository.list_partners(
            q="Ivy",
            partner_type="freight_forwarder",
            owner_user_ids=["u-001"],
        )

    assert total == 1
    assert isinstance(rows[0], PartnerRow)
    assert rows[0].code == "P-FWD-REPO-001"
