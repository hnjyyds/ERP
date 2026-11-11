import secrets
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.auth.models import (
    Department,
    MenuItem,
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
)
from app.modules.system.auth.passwords import hash_password
from app.modules.system.auth.seed_navigation import (
    system_departments,
    system_menus,
    system_roles,
)
from app.modules.system.auth.seed_permissions import system_permissions
from app.modules.system.auth.seed_users import (
    demo_role_permissions,
    demo_roles,
    demo_user_roles,
    demo_users,
)


async def seed_system_base_data(session: AsyncSession) -> None:
    """写入系统内置权限、角色、部门与菜单；重复启动保持幂等。"""
    permissions = system_permissions()
    roles = system_roles()
    departments = system_departments()
    menus = system_menus()

    existing_permission_ids = set((await session.scalars(select(Permission.id))).all())
    existing_role_ids = set((await session.scalars(select(Role.id))).all())
    existing_department_ids = set((await session.scalars(select(Department.id))).all())
    existing_menu_ids = set((await session.scalars(select(MenuItem.id))).all())
    session.add_all([item for item in permissions if item.id not in existing_permission_ids])
    session.add_all([item for item in roles if item.id not in existing_role_ids])
    session.add_all([item for item in departments if item.id not in existing_department_ids])
    session.add_all([item for item in menus if item.id not in existing_menu_ids])
    existing_permissions = {
        item.id: item for item in (await session.scalars(select(Permission))).all()
    }
    for permission in permissions:
        existing_permission = existing_permissions.get(permission.id)
        if existing_permission is None:
            continue
        existing_permission.name = permission.name
        existing_permission.category = permission.category
    existing_roles = {item.id: item for item in (await session.scalars(select(Role))).all()}
    for role in roles:
        existing_role = existing_roles.get(role.id)
        if existing_role is None:
            continue
        existing_role.name = role.name
        existing_role.code = role.code
        existing_role.data_scope = role.data_scope
    existing_menus = {item.id: item for item in (await session.scalars(select(MenuItem))).all()}
    for menu in menus:
        existing_menu = existing_menus.get(menu.id)
        if existing_menu is None:
            continue
        existing_menu.label = menu.label
        existing_menu.label_en = menu.label_en
        existing_menu.path = menu.path
        existing_menu.icon = menu.icon
        existing_menu.required_permission = menu.required_permission
        existing_menu.sort_order = menu.sort_order
        existing_menu.is_active = menu.is_active
    await session.flush()
    await session.commit()


async def seed_system_demo_data(session: AsyncSession) -> None:
    """在系统基础数据之上补充演示角色、账号与授权；重复启动保持幂等。"""
    await seed_system_base_data(session)

    demo_role_list = demo_roles()
    existing_demo_role_ids = set((await session.scalars(select(Role.id))).all())
    session.add_all([item for item in demo_role_list if item.id not in existing_demo_role_ids])
    await session.flush()

    users = demo_users()
    user_roles = demo_user_roles()
    role_permissions = demo_role_permissions()
    # 普通业务与采购角色的跟单权限默认仅覆盖本人；查看全部必须单独授权。
    stale_followup_view_all = list(
        await session.scalars(
            select(RolePermission).where(
                RolePermission.role_id.in_(["role-sales-manager", "role-purchase"]),
                RolePermission.permission_id == "perm-followup-plan-view-all",
            )
        )
    )
    for item in stale_followup_view_all:
        await session.delete(item)
    await session.flush()
    existing_user_ids = set((await session.scalars(select(User.id))).all())
    existing_usernames = set((await session.scalars(select(User.username))).all())
    existing_user_role_ids = set((await session.scalars(select(UserRole.id))).all())
    existing_role_permission_ids = set((await session.scalars(select(RolePermission.id))).all())
    existing_role_permission_pairs = {
        (role_id, permission_id)
        for role_id, permission_id in (
            await session.execute(select(RolePermission.role_id, RolePermission.permission_id))
        ).all()
    }
    new_users = [
        item
        for item in users
        if item.id not in existing_user_ids and item.username not in existing_usernames
    ]
    session.add_all(new_users)
    available_user_ids = existing_user_ids | {item.id for item in new_users}
    session.add_all(
        [
            item
            for item in user_roles
            if item.id not in existing_user_role_ids and item.user_id in available_user_ids
        ]
    )
    session.add_all(
        [
            item
            for item in role_permissions
            if item.id not in existing_role_permission_ids
            and (item.role_id, item.permission_id) not in existing_role_permission_pairs
        ]
    )
    await session.commit()


async def seed_admin_account(
    session: AsyncSession,
    *,
    username: str,
    password: str,
    display_name: str,
    reset_password: bool,
) -> User:
    """确保超级管理员可登录；已有账号默认保留原密码，仅显式重置时覆盖。"""
    user = await session.scalar(select(User).where(User.username == username))
    if user is None:
        salt = secrets.token_hex(16)
        user = User(
            id=f"u-{secrets.token_hex(8)}",
            username=username,
            display_name=display_name,
            department_id="dept-admin",
            avatar_type="preset",
            avatar_value="ink-halo",
            password_hash=hash_password(password, salt),
            password_salt=salt,
            is_active=True,
            created_at=datetime.now(UTC),
        )
        session.add(user)
    elif reset_password:
        salt = secrets.token_hex(16)
        user.password_hash = hash_password(password, salt)
        user.password_salt = salt
    user.is_active = True
    await session.flush()

    role_link = await session.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == "role-admin",
        )
    )
    if role_link is None:
        session.add(
            UserRole(
                id=f"ur-{user.id}-admin",
                user_id=user.id,
                role_id="role-admin",
            )
        )
    await session.commit()
    return user
