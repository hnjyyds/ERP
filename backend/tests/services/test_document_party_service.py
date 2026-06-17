import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.document_parties.repositories import DocumentPartyRepository
from app.modules.masterdata.document_parties.schemas import DocumentPartyCreate
from app.modules.masterdata.document_parties.services import DocumentPartyService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> DocumentPartyService:
    return DocumentPartyService(
        DocumentPartyRepository(session),
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


def _party_payload(code: str, party_type: str = "notify_party") -> DocumentPartyCreate:
    return DocumentPartyCreate(
        code=code,
        party_type=party_type,
        display_name="Notify Party",
        customer_id="customer-a",
        customer_name="客户 A",
        country="China",
        address="Shanghai",
        contact_person="Tom Zhao",
        email="tom@example.com",
        phone="+86",
        is_default=True,
        status="active",
    )


async def test_document_party_service_replaces_default_party(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        current_user = _user_with_permissions(
            ["masterdata:document_party:edit", "masterdata:document_party:view"],
            user_id="u-001",
        )
        first = await service.create_party(
            current_user=current_user,
            payload=_party_payload("DP-SVC-001"),
        )
        second = await service.create_party(
            current_user=current_user,
            payload=_party_payload("DP-SVC-002"),
        )
        refreshed_first = await service.get_party(current_user=current_user, party_id=first.id)

    assert refreshed_first.is_default is False
    assert second.is_default is True


async def test_document_party_service_filters_private_party_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        await service.create_party(
            current_user=_user_with_permissions(
                ["masterdata:document_party:edit"],
                user_id="u-owner",
            ),
            payload=_party_payload("DP-PRIVATE-001", party_type="consignee"),
        )
        result = await service.list_parties(
            current_user=_user_with_permissions(
                ["masterdata:document_party:view"],
                user_id="u-other",
            ),
            q=None,
            party_type=None,
            customer_id=None,
        )

    assert result.total == 0


async def test_document_party_service_rejects_invalid_party_type(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        with pytest.raises(ValueError):
            await service.create_party(
                current_user=_user_with_permissions(["masterdata:document_party:edit"]),
                payload=DocumentPartyCreate.model_validate(
                    {
                        "code": "DP-BAD-001",
                        "party_type": "bad_type",
                        "display_name": "Bad Party",
                        "country": "China",
                    },
                    strict=False,
                ),
            )
