import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.suppliers.repositories import SupplierRepository
from app.modules.masterdata.suppliers.schemas import SupplierCreate, SupplierUpdate
from app.modules.masterdata.suppliers.services import PermissionDeniedError, SupplierService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse


def _make_service(session: AsyncSession) -> SupplierService:
    return SupplierService(
        SupplierRepository(session),
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


async def test_supplier_service_creates_supplier_with_primary_contact_and_credit(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        supplier = await service.create_supplier(
            current_user=_user_with_permissions(
                [
                    "masterdata:supplier:edit",
                    "masterdata:supplier:credit:edit",
                    "masterdata:supplier:credit:view",
                ],
                user_id="u-001",
            ),
            payload=SupplierCreate(
                code="S-CN-SVC-001",
                cn_name="义乌包装工厂",
                en_name="Yiwu Packaging Factory",
                country="China",
                contacts=[
                    {
                        "name": "Liu Fang",
                        "title": "Sales",
                        "email": "liu@example.com",
                        "phone": "+86",
                        "is_primary": True,
                    },
                    {
                        "name": "Wang Lei",
                        "title": "Planner",
                        "email": None,
                        "phone": None,
                        "is_primary": True,
                    },
                ],
                credit_profile={
                    "credit_grade": "A",
                    "credit_limit": "60000",
                    "currency": "CNY",
                    "payment_terms": "30% deposit",
                    "risk_note": None,
                },
            ),
        )

    assert supplier.owner_user_id == "u-001"
    assert supplier.primary_contact is not None
    assert supplier.primary_contact.name == "Wang Lei"
    primary_by_name = {item.name: item.is_primary for item in supplier.contacts}
    assert primary_by_name == {"Liu Fang": False, "Wang Lei": True}
    assert supplier.credit_profile is not None
    assert supplier.credit_profile.credit_limit == "60000.00"


async def test_supplier_service_hides_credit_limit_without_field_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        supplier = await service.create_supplier(
            current_user=_user_with_permissions(
                [
                    "masterdata:supplier:edit",
                    "masterdata:supplier:credit:edit",
                    "masterdata:supplier:credit:view",
                ],
                user_id="u-001",
            ),
            payload=SupplierCreate(
                code="S-HIDE-001",
                cn_name="隐藏额度供应商",
                en_name="Hidden Credit Supplier",
                country="China",
                credit_profile={
                    "credit_grade": "B",
                    "credit_limit": "18000",
                    "currency": "CNY",
                    "payment_terms": "Before shipment",
                    "risk_note": "小额合作",
                },
            ),
        )
        visible = await service.get_supplier(
            current_user=_user_with_permissions(["masterdata:supplier:view"], user_id="u-001"),
            supplier_id=supplier.id,
        )

    assert visible.credit_profile is not None
    assert visible.credit_profile.credit_grade == "B"
    assert visible.credit_profile.credit_limit is None


async def test_supplier_service_filters_private_supplier_without_view_all(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        await service.create_supplier(
            current_user=_user_with_permissions(["masterdata:supplier:edit"], user_id="u-owner"),
            payload=SupplierCreate(
                code="S-PRIVATE-001",
                cn_name="私有供应商",
                en_name="Private Supplier",
                country="China",
            ),
        )
        result = await service.list_suppliers(
            current_user=_user_with_permissions(["masterdata:supplier:view"], user_id="u-other"),
            q=None,
            country=None,
            credit_grade=None,
        )

    assert result.total == 0


async def test_supplier_service_rejects_credit_update_without_credit_edit_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        service = _make_service(session)
        supplier = await service.create_supplier(
            current_user=_user_with_permissions(["masterdata:supplier:edit"], user_id="u-001"),
            payload=SupplierCreate(
                code="S-NO-CREDIT-001",
                cn_name="无信用权限供应商",
                en_name="No Credit Supplier",
                country="China",
            ),
        )
        with pytest.raises(PermissionDeniedError):
            await service.update_supplier(
                current_user=_user_with_permissions(["masterdata:supplier:edit"], user_id="u-001"),
                supplier_id=supplier.id,
                payload=SupplierUpdate(
                    cn_name="无信用权限供应商",
                    en_name="No Credit Supplier",
                    country="China",
                    credit_profile={
                        "credit_grade": "C",
                        "credit_limit": "5000",
                        "currency": "CNY",
                        "payment_terms": "Prepaid",
                        "risk_note": "限制额度",
                    },
                ),
            )
