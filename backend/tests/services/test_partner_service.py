import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.partners.repositories import PartnerRepository
from app.modules.masterdata.partners.schemas import PartnerCreate
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
