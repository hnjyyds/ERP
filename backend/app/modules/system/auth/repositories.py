from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.auth.data_scope_rules import widest_data_scope
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
    department_id: str | None
    department_name: str
    data_scope: str
    avatar_type: str
    avatar_value: str
    password_hash: str
    password_salt: str
    roles: list[str]
    permissions: list[str]


@dataclass(frozen=True)
class AssignableUserRow:
    id: str
    username: str
    display_name: str
    department_name: str
    avatar_type: str
    avatar_value: str


@dataclass(frozen=True)
class DepartmentRow:
    id: str
    name: str
    parent_id: str | None
    sort_order: int


@dataclass(frozen=True)
class PermissionRow:
    id: str
    code: str
    name: str
    category: str


@dataclass(frozen=True)
class RoleRow:
    id: str
    name: str
    code: str
    data_scope: str
    permissions: list[PermissionRow]


@dataclass(frozen=True)
class OrganizationUserRow:
    id: str
    username: str
    display_name: str
    department_id: str | None
    department_name: str
    avatar_type: str
    avatar_value: str
    roles: list[RoleRow]
    is_active: bool
    created_at: datetime
    password_set: bool


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

    async def list_active_users(self) -> list[AssignableUserRow]:
        rows = await self.session.execute(
            select(User, Department)
            .join(Department, Department.id == User.department_id, isouter=True)
            .where(User.is_active.is_(True))
            .order_by(Department.sort_order.asc().nulls_last(), User.display_name.asc())
        )
        return [
            AssignableUserRow(
                id=user.id,
                username=user.username,
                display_name=user.display_name,
                department_name=department.name if department else "",
                avatar_type=user.avatar_type,
                avatar_value=user.avatar_value,
            )
            for user, department in rows
        ]

    async def list_active_users_by_ids(self, user_ids: list[str]) -> list[AssignableUserRow]:
        if not user_ids:
            return []
        rows = await self.session.execute(
            select(User, Department)
            .join(Department, Department.id == User.department_id, isouter=True)
            .where(User.is_active.is_(True), User.id.in_(user_ids))
            .order_by(Department.sort_order.asc().nulls_last(), User.display_name.asc())
        )
        users_by_id = {
            user.id: AssignableUserRow(
                id=user.id,
                username=user.username,
                display_name=user.display_name,
                department_name=department.name if department else "",
                avatar_type=user.avatar_type,
                avatar_value=user.avatar_value,
            )
            for user, department in rows
        }
        return [users_by_id[user_id] for user_id in user_ids if user_id in users_by_id]

    async def list_departments(self) -> list[DepartmentRow]:
        rows = await self.session.scalars(
            select(Department).order_by(Department.sort_order.asc(), Department.name.asc())
        )
        return [self._department_row(row) for row in rows]

    async def list_roles(self) -> list[RoleRow]:
        rows = await self.session.scalars(select(Role).order_by(Role.name.asc()))
        return [await self._role_row(row) for row in rows]

    async def list_roles_by_ids(self, role_ids: list[str]) -> list[RoleRow]:
        if not role_ids:
            return []
        rows = await self.session.scalars(
            select(Role).where(Role.id.in_(role_ids)).order_by(Role.name.asc())
        )
        roles_by_id = {row.id: await self._role_row(row) for row in rows}
        return [roles_by_id[role_id] for role_id in role_ids if role_id in roles_by_id]

    async def get_role(self, role_id: str) -> RoleRow | None:
        role = await self.session.scalar(select(Role).where(Role.id == role_id))
        if role is None:
            return None
        return await self._role_row(role)

    async def list_permissions(self) -> list[PermissionRow]:
        rows = await self.session.scalars(select(Permission).order_by(Permission.code.asc()))
        return [self._permission_row(row) for row in rows]

    async def list_permissions_by_ids(self, permission_ids: list[str]) -> list[PermissionRow]:
        if not permission_ids:
            return []
        rows = await self.session.scalars(
            select(Permission).where(Permission.id.in_(permission_ids)).order_by(Permission.code.asc())
        )
        permissions_by_id = {row.id: self._permission_row(row) for row in rows}
        return [
            permissions_by_id[permission_id]
            for permission_id in permission_ids
            if permission_id in permissions_by_id
        ]

    async def get_department(self, department_id: str) -> DepartmentRow | None:
        department = await self.session.scalar(
            select(Department).where(Department.id == department_id)
        )
        if department is None:
            return None
        return self._department_row(department)

    async def get_department_by_name(self, name: str) -> DepartmentRow | None:
        department = await self.session.scalar(
            select(Department).where(Department.name == name)
        )
        if department is None:
            return None
        return self._department_row(department)

    async def count_users_in_department(self, department_id: str) -> int:
        count = await self.session.scalar(
            select(func.count()).select_from(User).where(User.department_id == department_id)
        )
        return int(count or 0)

    async def list_department_subtree_ids(self, root_id: str) -> list[str]:
        """返回某部门及其所有下级部门的 id（含自身）。

        采用应用层 BFS 展开 parent_id 邻接表，避免 SQLite 递归 CTE 方言差异；
        带访问集合防御脏数据中的环路。
        """
        rows = await self.session.execute(select(Department.id, Department.parent_id))
        children: dict[str, list[str]] = {}
        for department_id, parent_id in rows:
            if parent_id is not None:
                children.setdefault(parent_id, []).append(department_id)

        result: list[str] = []
        visited: set[str] = set()
        queue = [root_id]
        while queue:
            current = queue.pop(0)
            if current in visited:
                continue
            visited.add(current)
            result.append(current)
            queue.extend(children.get(current, []))
        return result

    async def list_user_ids_in_departments(self, department_ids: list[str]) -> list[str]:
        if not department_ids:
            return []
        rows = await self.session.scalars(
            select(User.id).where(
                User.department_id.in_(department_ids),
                User.is_active.is_(True),
            )
        )
        return list(rows)

    async def create_department(
        self,
        *,
        department_id: str,
        name: str,
        parent_id: str | None,
        sort_order: int,
    ) -> DepartmentRow:
        department = Department(
            id=department_id,
            name=name,
            parent_id=parent_id,
            sort_order=sort_order,
        )
        self.session.add(department)
        await self.session.flush()
        return self._department_row(department)

    async def update_department(
        self,
        *,
        department_id: str,
        name: str,
        parent_id: str | None,
        sort_order: int,
    ) -> DepartmentRow | None:
        department = await self.session.scalar(
            select(Department).where(Department.id == department_id)
        )
        if department is None:
            return None
        department.name = name
        department.parent_id = parent_id
        department.sort_order = sort_order
        await self.session.flush()
        return self._department_row(department)

    async def delete_department(self, department_id: str) -> DepartmentRow | None:
        department = await self.session.scalar(
            select(Department).where(Department.id == department_id)
        )
        if department is None:
            return None
        row = self._department_row(department)
        await self.session.delete(department)
        await self.session.flush()
        return row

    async def get_role_by_code(self, code: str) -> RoleRow | None:
        role = await self.session.scalar(select(Role).where(Role.code == code))
        if role is None:
            return None
        return await self._role_row(role)

    async def count_users_with_role(self, role_id: str) -> int:
        count = await self.session.scalar(
            select(func.count()).select_from(UserRole).where(UserRole.role_id == role_id)
        )
        return int(count or 0)

    async def create_role(
        self, *, role_id: str, name: str, code: str, data_scope: str
    ) -> RoleRow:
        role = Role(id=role_id, name=name, code=code, data_scope=data_scope)
        self.session.add(role)
        await self.session.flush()
        return await self._role_row(role)

    async def update_role(
        self, *, role_id: str, name: str, code: str, data_scope: str
    ) -> RoleRow | None:
        role = await self.session.scalar(select(Role).where(Role.id == role_id))
        if role is None:
            return None
        role.name = name
        role.code = code
        role.data_scope = data_scope
        await self.session.flush()
        return await self._role_row(role)

    async def delete_role(self, role_id: str) -> RoleRow | None:
        role = await self.session.scalar(select(Role).where(Role.id == role_id))
        if role is None:
            return None
        row = await self._role_row(role)
        await self.session.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        await self.session.delete(role)
        await self.session.flush()
        return row

    async def get_user_by_username(self, username: str) -> OrganizationUserRow | None:
        user = await self.session.scalar(select(User).where(User.username == username))
        if user is None:
            return None
        return await self._organization_user_row(user)

    async def list_organization_users(self) -> list[OrganizationUserRow]:
        rows = await self.session.scalars(
            select(User).order_by(
                User.is_active.desc(),
                User.created_at.desc(),
                User.display_name.asc(),
            )
        )
        return [await self._organization_user_row(row) for row in rows]

    async def get_organization_user(self, user_id: str) -> OrganizationUserRow | None:
        user = await self.session.scalar(select(User).where(User.id == user_id))
        if user is None:
            return None
        return await self._organization_user_row(user)

    async def create_organization_user(
        self,
        *,
        user_id: str,
        username: str,
        display_name: str,
        department_id: str | None,
        password_hash: str,
        password_salt: str,
        is_active: bool,
        avatar_type: str,
        avatar_value: str,
        created_at: datetime,
    ) -> OrganizationUserRow:
        user = User(
            id=user_id,
            username=username,
            display_name=display_name,
            department_id=department_id,
            password_hash=password_hash,
            password_salt=password_salt,
            is_active=is_active,
            avatar_type=avatar_type,
            avatar_value=avatar_value,
            created_at=created_at,
        )
        self.session.add(user)
        await self.session.flush()
        return await self._organization_user_row(user)

    async def update_organization_user(
        self,
        *,
        user_id: str,
        display_name: str,
        department_id: str | None,
        is_active: bool,
        avatar_type: str,
        avatar_value: str,
    ) -> OrganizationUserRow | None:
        user = await self.session.scalar(select(User).where(User.id == user_id))
        if user is None:
            return None
        user.display_name = display_name
        user.department_id = department_id
        user.is_active = is_active
        user.avatar_type = avatar_type
        user.avatar_value = avatar_value
        await self.session.flush()
        return await self._organization_user_row(user)

    async def set_organization_user_roles(self, *, user_id: str, role_ids: list[str]) -> None:
        await self.session.execute(delete(UserRole).where(UserRole.user_id == user_id))
        self.session.add_all(
            [
                UserRole(
                    id=f"ur-{user_id}-{role_id}",
                    user_id=user_id,
                    role_id=role_id,
                )
                for role_id in role_ids
            ]
        )
        await self.session.flush()

    async def set_role_permissions(
        self,
        *,
        role_id: str,
        permission_ids: list[str],
    ) -> RoleRow | None:
        role = await self.session.scalar(select(Role).where(Role.id == role_id))
        if role is None:
            return None
        await self.session.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        self.session.add_all(
            [
                RolePermission(
                    id=f"rp-{role_id}-{permission_id}",
                    role_id=role_id,
                    permission_id=permission_id,
                )
                for permission_id in permission_ids
            ]
        )
        await self.session.flush()
        return await self._role_row(role)

    async def update_organization_user_password(
        self,
        *,
        user_id: str,
        password_hash: str,
        password_salt: str,
    ) -> OrganizationUserRow | None:
        user = await self.session.scalar(select(User).where(User.id == user_id))
        if user is None:
            return None
        user.password_hash = password_hash
        user.password_salt = password_salt
        await self.session.flush()
        return await self._organization_user_row(user)

    async def update_user_avatar(
        self,
        *,
        user_id: str,
        avatar_type: str,
        avatar_value: str,
    ) -> UserIdentityRow | None:
        user = await self.session.scalar(
            select(User).where(User.id == user_id, User.is_active.is_(True))
        )
        if user is None:
            return None
        user.avatar_type = avatar_type
        user.avatar_value = avatar_value
        await self.session.flush()
        await self.session.commit()
        await self.session.refresh(user)
        return await self._identity_for_user(user)

    async def _identity_for_user(self, user: User) -> UserIdentityRow:
        department = await self.session.scalar(
            select(Department).where(Department.id == user.department_id)
        )
        role_rows = await self.session.execute(
            select(Role.name, Role.data_scope, Permission.code)
            .join(UserRole, UserRole.role_id == Role.id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .where(UserRole.user_id == user.id)
            .order_by(Role.name.asc(), Permission.code.asc())
        )

        roles: list[str] = []
        permissions: list[str] = []
        role_scopes: list[str] = []
        for role_name, role_scope, permission_code in role_rows:
            if role_name not in roles:
                roles.append(role_name)
                role_scopes.append(role_scope)
            if permission_code not in permissions:
                permissions.append(permission_code)

        return UserIdentityRow(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            department_id=user.department_id,
            department_name=department.name if department else "",
            data_scope=widest_data_scope(role_scopes),
            avatar_type=user.avatar_type,
            avatar_value=user.avatar_value,
            password_hash=user.password_hash,
            password_salt=user.password_salt,
            roles=roles,
            permissions=permissions,
        )

    async def _organization_user_row(self, user: User) -> OrganizationUserRow:
        department = await self.session.scalar(
            select(Department).where(Department.id == user.department_id)
        )
        roles = await self._roles_for_user(user.id)
        return OrganizationUserRow(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            department_id=user.department_id,
            department_name=department.name if department else "",
            avatar_type=user.avatar_type,
            avatar_value=user.avatar_value,
            roles=roles,
            is_active=user.is_active,
            created_at=user.created_at,
            password_set=bool(user.password_hash and user.password_salt),
        )

    async def _roles_for_user(self, user_id: str) -> list[RoleRow]:
        rows = await self.session.scalars(
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
            .order_by(Role.name.asc())
        )
        return [await self._role_row(row) for row in rows]

    async def _permissions_for_role(self, role_id: str) -> list[PermissionRow]:
        rows = await self.session.scalars(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
            .order_by(Permission.code.asc())
        )
        return [self._permission_row(row) for row in rows]

    def _department_row(self, row: Department) -> DepartmentRow:
        return DepartmentRow(
            id=row.id,
            name=row.name,
            parent_id=row.parent_id,
            sort_order=row.sort_order,
        )

    async def _role_row(self, row: Role) -> RoleRow:
        return RoleRow(
            id=row.id,
            name=row.name,
            code=row.code,
            data_scope=row.data_scope,
            permissions=await self._permissions_for_role(row.id),
        )

    def _permission_row(self, row: Permission) -> PermissionRow:
        return PermissionRow(
            id=row.id,
            code=row.code,
            name=row.name,
            category=row.category,
        )
