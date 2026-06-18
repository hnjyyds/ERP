import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.partners.repositories import PartnerRepository
from app.modules.masterdata.partners.schemas import (
    PartnerContactCreate,
    PartnerContactUpdate,
    PartnerCreate,
)
from app.modules.masterdata.partners.services import PartnerService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> PartnerService:
    return PartnerService(
        PartnerRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )


def _user_with_permissions(
    permissions: list[str],
    user_id: str = "u-test",
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username="tester",
        display_name="测试用户",
        department_name="测试部",
        roles=["测试角色"],
        permissions=permissions,
    )


async def test_partner_service_creates_partner_with_primary_contact(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        partner = await service.create_partner(
            current_user=_user_with_permissions(["masterdata:partner:edit"], user_id="u-001"),
            payload=PartnerCreate(
                code="P-CAR-001",
                cn_name="陆运车队",
                en_name="Truck Carrier",
                partner_type="carrier",
                country="China",
                contacts=[
                    {
                        "name": "Tom Zhao",
                        "title": "Dispatcher",
                        "email": "tom@example.com",
                        "phone": "+86",
                        "is_primary": True,
                    },
                    {
                        "name": "Nina Zhou",
                        "title": "Supervisor",
                        "email": None,
                        "phone": None,
                        "is_primary": True,
                    },
                ],
            ),
        )

    assert partner.owner_user_id == "u-001"
    assert partner.primary_contact is not None
    assert partner.primary_contact.name == "Nina Zhou"
    primary_by_name = {item.name: item.is_primary for item in partner.contacts}
    assert primary_by_name == {"Tom Zhao": False, "Nina Zhou": True}


async def test_partner_service_filters_private_partner_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        await service.create_partner(
            current_user=_user_with_permissions(["masterdata:partner:edit"], user_id="u-owner"),
            payload=PartnerCreate(
                code="P-PRIVATE-001",
                cn_name="私有合作伙伴",
                en_name="Private Partner",
                partner_type="express",
                country="China",
            ),
        )
        result = await service.list_partners(
            current_user=_user_with_permissions(["masterdata:partner:view"], user_id="u-other"),
            q=None,
            partner_type=None,
        )

    assert result.total == 0


async def test_partner_service_rejects_invalid_partner_type(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        with pytest.raises(ValueError):
            await service.create_partner(
                current_user=_user_with_permissions(["masterdata:partner:edit"], user_id="u-001"),
                payload=PartnerCreate.model_validate(
                    {
                        "code": "P-BAD-001",
                        "cn_name": "错误类型",
                        "en_name": "Bad Type",
                        "partner_type": "bad_type",
                        "country": "China",
                    },
                    strict=False,
                ),
            )


async def test_partner_service_updates_deletes_contacts_and_deactivates(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        user = _user_with_permissions(
            ["masterdata:partner:view", "masterdata:partner:edit"],
            user_id="u-001",
        )
        partner = await service.create_partner(
            current_user=user,
            payload=PartnerCreate(
                code="P-CONTACT-SVC-001",
                cn_name="联系人货代",
                en_name="Contact Forwarder",
                partner_type="freight_forwarder",
                country="China",
                contacts=[
                    {
                        "name": "Grace Lin",
                        "title": "Ops",
                        "email": "grace@example.com",
                        "phone": "+86",
                        "is_primary": True,
                    }
                ],
            ),
        )
        first_contact_id = partner.contacts[0].id
        second = await service.add_contact(
            current_user=user,
            partner_id=partner.id,
            payload=PartnerContactCreate(
                name="Mia Chen",
                title="Account Executive",
                email="mia@example.com",
                phone="+86-1",
                is_primary=False,
            ),
        )

        updated = await service.update_contact(
            current_user=user,
            partner_id=partner.id,
            contact_id=second.id,
            payload=PartnerContactUpdate(
                name="Mia Chen Updated",
                title="Account Lead",
                email="mia.updated@example.com",
                phone="+86-9",
                is_primary=True,
            ),
        )
        visible = await service.get_partner(
            current_user=_user_with_permissions(["masterdata:partner:view"], user_id="u-001"),
            partner_id=partner.id,
        )
        deleted = await service.delete_contact(
            current_user=user,
            partner_id=partner.id,
            contact_id=second.id,
        )
        final = await service.get_partner(
            current_user=_user_with_permissions(["masterdata:partner:view"], user_id="u-001"),
            partner_id=partner.id,
        )
        deactivated = await service.deactivate_partner(
            current_user=user,
            partner_id=partner.id,
        )

    assert updated.name == "Mia Chen Updated"
    assert updated.is_primary is True
    assert [item.id for item in visible.contacts if item.is_primary] == [second.id]
    assert deleted.id == second.id
    assert [item.id for item in final.contacts] == [first_contact_id]
    assert final.contacts[0].is_primary is False
    assert deactivated.status == "inactive"
