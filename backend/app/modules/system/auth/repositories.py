from dataclasses import dataclass

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


@dataclass(frozen=True)
class MenuItemRow:
    id: str
    label: str
    path: str
    icon: str
    required_permission: str
    sort_order: int


@dataclass(frozen=True)
class UserIdentityRow:
    id: str
    username: str
    display_name: str
    department_name: str
    password_hash: str
    password_salt: str
    roles: list[str]
    permissions: list[str]


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_user_identity_by_username(self, username: str) -> UserIdentityRow | None:
        user = await self.session.scalar(
            select(User).where(User.username == username, User.is_active.is_(True))
        )
        if user is None:
            return None
        return await self._identity_for_user(user)

    async def get_user_identity_by_id(self, user_id: str) -> UserIdentityRow | None:
        user = await self.session.scalar(
            select(User).where(User.id == user_id, User.is_active.is_(True))
        )
        if user is None:
            return None
        return await self._identity_for_user(user)

    async def list_menus_for_permissions(self, permissions: list[str]) -> list[MenuItemRow]:
        if not permissions:
            return []
        rows = await self.session.scalars(
            select(MenuItem)
            .where(
                MenuItem.is_active.is_(True),
                MenuItem.required_permission.in_(permissions),
            )
            .order_by(MenuItem.sort_order.asc(), MenuItem.label.asc())
        )
        return [
            MenuItemRow(
                id=item.id,
                label=item.label,
                path=item.path,
                icon=item.icon,
                required_permission=item.required_permission,
                sort_order=item.sort_order,
            )
            for item in rows
        ]

    async def _identity_for_user(self, user: User) -> UserIdentityRow:
        department = await self.session.scalar(
            select(Department).where(Department.id == user.department_id)
        )
        role_rows = await self.session.execute(
            select(Role.name, Permission.code)
            .join(UserRole, UserRole.role_id == Role.id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .where(UserRole.user_id == user.id)
            .order_by(Role.name.asc(), Permission.code.asc())
        )

        roles: list[str] = []
        permissions: list[str] = []
        for role_name, permission_code in role_rows:
            if role_name not in roles:
                roles.append(role_name)
            if permission_code not in permissions:
                permissions.append(permission_code)

        return UserIdentityRow(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            department_name=department.name if department else "",
            password_hash=user.password_hash,
            password_salt=user.password_salt,
            roles=roles,
            permissions=permissions,
        )
