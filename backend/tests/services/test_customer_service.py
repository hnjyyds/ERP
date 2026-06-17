import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.customers.repositories import CustomerRepository
from app.modules.masterdata.customers.schemas import CustomerCreate, CustomerUpdate
from app.modules.masterdata.customers.services import CustomerService, PermissionDeniedError
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> CustomerService:
    return CustomerService(
        CustomerRepository(session),
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


async def test_customer_service_creates_customer_with_primary_contact_and_credit(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        customer = await service.create_customer(
            current_user=_user_with_permissions(
                [
                    "masterdata:customer:edit",
                    "masterdata:customer:credit:edit",
                    "masterdata:customer:credit:view",
                ],
                user_id="u-001",
            ),
            payload=CustomerCreate(
                code="C-FR-001",
                cn_name="法国百货客户",
                en_name="French Retail Buyer",
                country="France",
                contacts=[
                    {
                        "name": "Claire Martin",
                        "title": "Buyer",
                        "email": "claire@example.com",
                        "phone": "+33",
                        "is_primary": True,
                    },
                    {
                        "name": "Marc Moreau",
                        "title": "Assistant",
                        "email": None,
                        "phone": None,
                        "is_primary": True,
                    },
                ],
                credit_profile={
                    "credit_grade": "A",
                    "credit_limit": "30000",
                    "currency": "EUR",
                    "payment_terms": "OA 30 days",
                    "risk_note": None,
                },
            ),
        )

    assert customer.owner_user_id == "u-001"
    assert customer.primary_contact is not None
    assert customer.primary_contact.name == "Marc Moreau"
    primary_by_name = {item.name: item.is_primary for item in customer.contacts}
    assert primary_by_name == {"Claire Martin": False, "Marc Moreau": True}
    assert customer.credit_profile is not None
    assert customer.credit_profile.credit_limit == "30000.00"


async def test_customer_service_hides_credit_limit_without_field_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        customer = await service.create_customer(
            current_user=_user_with_permissions(
                [
                    "masterdata:customer:edit",
                    "masterdata:customer:credit:edit",
                    "masterdata:customer:credit:view",
                ],
                user_id="u-001",
            ),
            payload=CustomerCreate(
                code="C-IT-001",
                cn_name="意大利客户",
                en_name="Italian Buyer",
                country="Italy",
                credit_profile={
                    "credit_grade": "B",
                    "credit_limit": "12000",
                    "currency": "EUR",
                    "payment_terms": "T/T before shipment",
                    "risk_note": "新客户",
                },
            ),
        )
        visible = await service.get_customer(
            current_user=_user_with_permissions(["masterdata:customer:view"], user_id="u-001"),
            customer_id=customer.id,
        )

    assert visible.credit_profile is not None
    assert visible.credit_profile.credit_grade == "B"
    assert visible.credit_profile.credit_limit is None


async def test_customer_service_filters_private_customer_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        await service.create_customer(
            current_user=_user_with_permissions(["masterdata:customer:edit"], user_id="u-owner"),
            payload=CustomerCreate(
                code="C-PRIVATE-001",
                cn_name="私有客户",
                en_name="Private Buyer",
                country="Japan",
            ),
        )
        result = await service.list_customers(
            current_user=_user_with_permissions(["masterdata:customer:view"], user_id="u-other"),
            q=None,
            country=None,
            credit_grade=None,
        )

    assert result.total == 0


async def test_customer_service_rejects_credit_update_without_credit_edit_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        customer = await service.create_customer(
            current_user=_user_with_permissions(["masterdata:customer:edit"], user_id="u-001"),
            payload=CustomerCreate(
                code="C-NO-CREDIT-001",
                cn_name="无信用权限客户",
                en_name="No Credit Buyer",
                country="Spain",
            ),
        )
        with pytest.raises(PermissionDeniedError):
            await service.update_customer(
                current_user=_user_with_permissions(["masterdata:customer:edit"], user_id="u-001"),
                customer_id=customer.id,
                payload=CustomerUpdate(
                    cn_name="无信用权限客户",
                    en_name="No Credit Buyer",
                    country="Spain",
                    credit_profile={
                        "credit_grade": "C",
                        "credit_limit": "5000",
                        "currency": "EUR",
                        "payment_terms": "Prepaid",
                        "risk_note": "限制额度",
                    },
                ),
            )
