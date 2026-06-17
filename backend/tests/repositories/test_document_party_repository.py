from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.document_parties.repositories import (
    DocumentPartyRepository,
    DocumentPartyRow,
)


async def test_document_party_repository_filters_by_customer_type_contact_and_owner(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = DocumentPartyRepository(session)
        party = await repository.create_party(
            code="DP-REPO-001",
            party_type="consignee",
            display_name="Repo Consignee",
            customer_id="customer-a",
            customer_name="客户 A",
            country="Germany",
            address="Hamburg",
            contact_person="Ivy Wu",
            email="ivy@example.com",
            phone="+49",
            bank_name=None,
            swift_code=None,
            account_no=None,
            tax_id="DE-001",
            remarks="默认",
            is_default=True,
            status="active",
            owner_user_id="u-001",
        )
        await repository.create_party(
            code="DP-REPO-002",
            party_type="notify_party",
            display_name="Other Notify",
            customer_id="customer-b",
            customer_name="客户 B",
            country="France",
            address="Paris",
            contact_person="Paul",
            email="paul@example.com",
            phone="+33",
            bank_name=None,
            swift_code=None,
            account_no=None,
            tax_id=None,
            remarks=None,
            is_default=True,
            status="active",
            owner_user_id="u-other",
        )
        await session.commit()

        rows, total = await repository.list_parties(
            q="Ivy",
            party_type="consignee",
            customer_id="customer-a",
            owner_user_ids=["u-001"],
        )

    assert total == 1
    assert isinstance(rows[0], DocumentPartyRow)
    assert rows[0].id == party.id
    assert rows[0].code == "DP-REPO-001"
