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
from app.modules.system.auth.seed_navigation import (
    system_departments,
    system_menus,
    system_roles,
)
from app.modules.system.auth.seed_permissions import system_permissions
from app.modules.system.auth.seed_users import (
    demo_role_permissions,
    demo_user_roles,
    demo_users,
)


async def seed_system_demo_data(session: AsyncSession) -> None:
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
    existing_roles = {item.id: item for item in (await session.scalars(select(Role))).all()}
    for role in roles:
        existing = existing_roles.get(role.id)
        if existing is None:
            continue
        existing.name = role.name
        existing.code = role.code
    existing_menus = {item.id: item for item in (await session.scalars(select(MenuItem))).all()}
    for menu in menus:
        existing = existing_menus.get(menu.id)
        if existing is None:
            continue
        existing.label = menu.label
        existing.path = menu.path
        existing.icon = menu.icon
        existing.required_permission = menu.required_permission
        existing.sort_order = menu.sort_order
        existing.is_active = menu.is_active
    await session.flush()

    users = demo_users()
    user_roles = demo_user_roles()
    role_permissions = demo_role_permissions()
    existing_user_ids = set((await session.scalars(select(User.id))).all())
    existing_user_role_ids = set((await session.scalars(select(UserRole.id))).all())
    existing_role_permission_ids = set((await session.scalars(select(RolePermission.id))).all())
    existing_role_permission_pairs = {
        (role_id, permission_id)
        for role_id, permission_id in (
            await session.execute(select(RolePermission.role_id, RolePermission.permission_id))
        ).all()
    }
    session.add_all([item for item in users if item.id not in existing_user_ids])
    session.add_all([item for item in user_roles if item.id not in existing_user_role_ids])
    session.add_all(
        [
            item
            for item in role_permissions
            if item.id not in existing_role_permission_ids
            and (item.role_id, item.permission_id) not in existing_role_permission_pairs
        ]
    )
    await session.commit()
