import pytest
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.auth.models import Permission, RolePermission
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.seed import seed_system_demo_data
from app.modules.system.auth.services import AuthService, InvalidCredentialsError, TokenService


async def test_auth_service_verifies_password_and_token_round_trip(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = AuthService(AuthRepository(session), TokenService(secret_key="test-secret"))

        auth_session = await service.login(username="demo", password="demo123")
        current = await service.get_current_user(auth_session.access_token)
        assignable_users = await service.list_assignable_users()

    assert current.user.id == "u-001"
    assert current.user.avatar_type == "preset"
    assert current.user.avatar_value == "amber-orbit"
    demo_assignee = next(user for user in assignable_users.users if user.id == "u-001")
    assert demo_assignee.avatar_value == "amber-orbit"
    assert [item.label for item in current.menus] == [
        "工作台",
        "产品资料",
        "工厂资料",
        "客户资料",
        "订单中心",
        "采购合同",
        "QC 中心",
        "跟单中心",
        "我的 QC 任务",
        "入仓",
        "老板看板",
        "出口报价",
        "打样管理",
        "样品登记",
        "寄样管理",
        "合作伙伴",
        "单证资料",
        "出货明细",
        "采购询价",
        "开票通知",
        "入库计划",
        "出库计划",
        "货物出库",
    ]


async def test_auth_service_rejects_invalid_password(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = AuthService(AuthRepository(session), TokenService(secret_key="test-secret"))

        with pytest.raises(InvalidCredentialsError):
            await service.login(username="demo", password="bad")


async def test_seed_system_demo_data_provisions_employee_role_accounts(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    expected_accounts = [
        ("demo", "demo123", "业务主管", "业务部", {"工作台", "出口报价", "订单中心"}),
        (
            "purchase",
            "purchase123",
            "采购专员",
            "采购部",
            {"工作台", "采购询价", "采购合同", "跟单中心"},
        ),
        ("finance", "finance123", "财务", "财务部", {"工作台", "财务摘要"}),
        (
            "warehouse",
            "warehouse123",
            "仓库专员",
            "仓储部",
            {"工作台", "入库计划", "入仓", "货物出库"},
        ),
        (
            "qc",
            "qc123",
            "QC 专员",
            "品质部",
            {"工作台", "QC 中心", "我的 QC 任务"},
        ),
    ]

    async with session_factory() as session:
        await seed_system_demo_data(session)
        await seed_system_demo_data(session)
        service = AuthService(AuthRepository(session), TokenService(secret_key="test-secret"))

        for username, password, role_name, department_name, expected_menus in expected_accounts:
            auth_session = await service.login(username=username, password=password)

            assert auth_session.user.roles == [role_name]
            assert auth_session.user.department_name == department_name
            assert expected_menus.issubset({item.label for item in auth_session.menus})


async def test_seed_system_demo_data_deduplicates_role_permissions_by_role_and_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        await session.execute(
            update(RolePermission)
            .where(
                RolePermission.role_id == "role-sales-manager",
                RolePermission.permission_id == "perm-sales-contract-view",
            )
            .values(id="rp-sales-contract")
        )
        await session.commit()

        await seed_system_demo_data(session)

        count = await session.scalar(
            select(func.count())
            .select_from(RolePermission)
            .where(
                RolePermission.role_id == "role-sales-manager",
                RolePermission.permission_id == "perm-sales-contract-view",
            )
        )
        permission_codes = set(
            (
                await session.scalars(
                    select(Permission.code)
                    .join(RolePermission, RolePermission.permission_id == Permission.id)
                    .where(RolePermission.role_id == "role-sales-manager")
                )
            ).all()
        )

    assert count == 1
    assert {
        "sales:contract:view",
        "sales:contract:edit",
        "sales:contract:view_all",
        "sales:contract:approve",
        "sales:contract:export",
        "purchase:contract:view",
        "purchase:contract:edit",
        "purchase:contract:view_all",
        "purchase:contract:approve",
        "purchase:invoice_notice:view",
        "purchase:invoice_notice:edit",
        "purchase:invoice_notice:view_all",
        "purchase:invoice_notice:send",
        "followup:template:view",
        "followup:template:edit",
        "followup:plan:view",
        "followup:plan:edit",
        "followup:plan:view_all",
        "quality:inspection:view",
        "quality:inspection:edit",
        "quality:inspection:view_all",
        "warehouse:inbound_plan:view",
        "warehouse:inbound_plan:edit",
        "warehouse:inbound_plan:view_all",
        "warehouse:inbound_order:view",
        "warehouse:inbound_order:edit",
        "warehouse:inbound_order:approve",
        "warehouse:inbound_order:view_all",
        "warehouse:outbound_plan:view",
        "warehouse:outbound_plan:edit",
        "warehouse:outbound_plan:view_all",
        "warehouse:outbound_order:view",
        "warehouse:outbound_order:edit",
        "warehouse:outbound_order:approve",
        "warehouse:outbound_order:view_all",
        "warehouse:outbound_order:allow_negative",
    }.issubset(permission_codes)
