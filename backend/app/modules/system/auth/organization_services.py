import secrets
from datetime import UTC, datetime

from app.db.uow import UnitOfWork
from app.modules.system.auth.passwords import hash_password
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
from app.modules.system.auth.repositories import (
    AuthRepository,
    DepartmentRow,
    OrganizationUserRow,
    PermissionRow,
    RoleRow,
)
from app.modules.system.auth.schemas import (
    DEFAULT_AVATAR_TYPE,
    DEFAULT_AVATAR_VALUE,
    ORGANIZATION_AVATAR_PRESETS,
    AvatarType,
    CurrentUserResponse,
    OrganizationDepartmentCreate,
    OrganizationDepartmentResponse,
    OrganizationDepartmentUpdate,
    OrganizationOptionsResponse,
    OrganizationPasswordResetResponse,
    OrganizationPermissionResponse,
    OrganizationRoleCreate,
    OrganizationRolePermissionUpdate,
    OrganizationRoleResponse,
    OrganizationRoleUpdate,
    OrganizationUserCreate,
    OrganizationUserCreateResponse,
    OrganizationUserListResponse,
    OrganizationUserResponse,
    OrganizationUserUpdate,
)
from app.modules.system.auth.seed_permissions import system_permissions


class OrganizationPermissionDeniedError(Exception):
    pass


class OrganizationUserNotFoundError(Exception):
    pass


class OrganizationReferenceNotFoundError(Exception):
    pass


class OrganizationDepartmentNotFoundError(Exception):
    pass


class OrganizationDepartmentNameTakenError(Exception):
    pass


class OrganizationDepartmentInUseError(Exception):
    pass


class OrganizationDepartmentRequiredError(Exception):
    pass


class OrganizationUsernameTakenError(Exception):
    pass


class OrganizationInvalidAvatarError(Exception):
    pass


class OrganizationSelfDeactivateError(Exception):
    pass


class OrganizationSelfDemoteError(Exception):
    pass


class OrganizationRoleNotFoundError(Exception):
    pass


class OrganizationRoleCodeTakenError(Exception):
    pass


class OrganizationRoleInUseError(Exception):
    pass


class OrganizationService:
    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    async def list_options(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> OrganizationOptionsResponse:
        self._require_super_admin(current_user)
        departments = await self._repository.list_departments()
        roles = await self._repository.list_roles()
        permissions = await self._ensure_permissions_initialized()
        return OrganizationOptionsResponse(
            departments=[self._department_response(row) for row in departments],
            roles=[self._role_response(row) for row in roles],
            permissions=[self._permission_response(row) for row in permissions],
        )

    async def list_users(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> OrganizationUserListResponse:
        self._require_super_admin(current_user)
        users = await self._repository.list_organization_users()
        return OrganizationUserListResponse(users=[self._user_response(row) for row in users])

    async def create_user(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: OrganizationUserCreate,
    ) -> OrganizationUserCreateResponse:
        self._require_super_admin(current_user)
        await self._require_departments_available()
        await self._validate_department(payload.department_id)
        role_ids = await self._validate_role_ids(payload.role_ids)
        existing = await self._repository.get_user_by_username(payload.username)
        if existing is not None:
            raise OrganizationUsernameTakenError

        initial_password = self._generate_password()
        salt = secrets.token_hex(16)
        avatar_type, avatar_value = self._normalize_avatar(
            avatar_type=payload.avatar_type,
            avatar_value=payload.avatar_value,
        )

        async with UnitOfWork(self._repository.session):
            created = await self._repository.create_organization_user(
                user_id=f"u-{secrets.token_hex(8)}",
                username=payload.username,
                display_name=payload.display_name.strip(),
                department_id=payload.department_id,
                password_hash=hash_password(initial_password, salt),
                password_salt=salt,
                is_active=payload.is_active,
                avatar_type=avatar_type,
                avatar_value=avatar_value,
                created_at=datetime.now(UTC),
            )
            await self._repository.set_organization_user_roles(
                user_id=created.id,
                role_ids=role_ids,
            )
            created_with_roles = await self._repository.get_organization_user(created.id)

        if created_with_roles is None:
            raise OrganizationUserNotFoundError
        return OrganizationUserCreateResponse(
            user=self._user_response(created_with_roles),
            initial_password=initial_password,
        )

    async def update_user(
        self,
        *,
        current_user: CurrentUserResponse,
        user_id: str,
        payload: OrganizationUserUpdate,
    ) -> OrganizationUserResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_organization_user(user_id)
        if existing is None:
            raise OrganizationUserNotFoundError

        next_department_id = payload.department_id if payload.department_id is not None else existing.department_id
        if next_department_id is not None:
            await self._validate_department(next_department_id)
        role_ids = [role.id for role in existing.roles]
        if payload.role_ids is not None:
            role_ids = await self._validate_role_ids(payload.role_ids)

        next_active = existing.is_active if payload.is_active is None else payload.is_active
        if user_id == current_user.id and not next_active:
            raise OrganizationSelfDeactivateError
        avatar_type, avatar_value = self._normalize_avatar(
            avatar_type=payload.avatar_type or existing.avatar_type,
            avatar_value=payload.avatar_value if payload.avatar_value is not None else existing.avatar_value,
        )

        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_organization_user(
                user_id=user_id,
                display_name=(payload.display_name or existing.display_name).strip(),
                department_id=next_department_id,
                is_active=next_active,
                avatar_type=avatar_type,
                avatar_value=avatar_value,
            )
            if updated is None:
                raise OrganizationUserNotFoundError
            await self._repository.set_organization_user_roles(user_id=user_id, role_ids=role_ids)
            updated_with_roles = await self._repository.get_organization_user(user_id)

        if updated_with_roles is None:
            raise OrganizationUserNotFoundError
        return self._user_response(updated_with_roles)

    async def deactivate_user(
        self,
        *,
        current_user: CurrentUserResponse,
        user_id: str,
    ) -> OrganizationUserResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_organization_user(user_id)
        if existing is None:
            raise OrganizationUserNotFoundError
        if user_id == current_user.id:
            raise OrganizationSelfDeactivateError

        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_organization_user(
                user_id=user_id,
                display_name=existing.display_name,
                department_id=existing.department_id,
                is_active=False,
                avatar_type=existing.avatar_type,
                avatar_value=existing.avatar_value,
            )

        if updated is None:
            raise OrganizationUserNotFoundError
        return self._user_response(updated)

    async def reset_password(
        self,
        *,
        current_user: CurrentUserResponse,
        user_id: str,
    ) -> OrganizationPasswordResetResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_organization_user(user_id)
        if existing is None:
            raise OrganizationUserNotFoundError

        temporary_password = self._generate_password()
        salt = secrets.token_hex(16)
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_organization_user_password(
                user_id=user_id,
                password_hash=hash_password(temporary_password, salt),
                password_salt=salt,
            )

        if updated is None:
            raise OrganizationUserNotFoundError
        return OrganizationPasswordResetResponse(
            user=self._user_response(updated),
            temporary_password=temporary_password,
        )

    async def create_department(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: OrganizationDepartmentCreate,
    ) -> OrganizationDepartmentResponse:
        self._require_super_admin(current_user)
        name = payload.name.strip()
        await self._ensure_department_name_available(name=name)
        await self._validate_department_parent(payload.parent_id)

        async with UnitOfWork(self._repository.session):
            created = await self._repository.create_department(
                department_id=f"dept-{secrets.token_hex(8)}",
                name=name,
                parent_id=payload.parent_id,
                sort_order=payload.sort_order,
            )

        return self._department_response(created)

    async def update_department(
        self,
        *,
        current_user: CurrentUserResponse,
        department_id: str,
        payload: OrganizationDepartmentUpdate,
    ) -> OrganizationDepartmentResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_department(department_id)
        if existing is None:
            raise OrganizationDepartmentNotFoundError

        next_name = payload.name.strip() if payload.name is not None else existing.name
        next_parent_id = (
            payload.parent_id
            if "parent_id" in payload.model_fields_set
            else existing.parent_id
        )
        next_sort_order = payload.sort_order if payload.sort_order is not None else existing.sort_order
        await self._ensure_department_name_available(name=next_name, department_id=department_id)
        await self._validate_department_parent(next_parent_id, department_id=department_id)

        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_department(
                department_id=department_id,
                name=next_name,
                parent_id=next_parent_id,
                sort_order=next_sort_order,
            )

        if updated is None:
            raise OrganizationDepartmentNotFoundError
        return self._department_response(updated)

    async def delete_department(
        self,
        *,
        current_user: CurrentUserResponse,
        department_id: str,
    ) -> OrganizationDepartmentResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_department(department_id)
        if existing is None:
            raise OrganizationDepartmentNotFoundError
        if await self._repository.count_users_in_department(department_id) > 0:
            raise OrganizationDepartmentInUseError

        async with UnitOfWork(self._repository.session):
            deleted = await self._repository.delete_department(department_id)

        if deleted is None:
            raise OrganizationDepartmentNotFoundError
        return self._department_response(deleted)

    async def update_role_permissions(
        self,
        *,
        current_user: CurrentUserResponse,
        role_id: str,
        payload: OrganizationRolePermissionUpdate,
    ) -> OrganizationRoleResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_role(role_id)
        if existing is None:
            raise OrganizationReferenceNotFoundError

        permissions = await self._validate_permission_ids(payload.permission_ids)
        next_permission_codes = {permission.code for permission in permissions}
        if (
            existing.name in current_user.roles
            and SUPER_ADMIN_PERMISSION in {permission.code for permission in existing.permissions}
            and SUPER_ADMIN_PERMISSION not in next_permission_codes
        ):
            raise OrganizationSelfDemoteError

        async with UnitOfWork(self._repository.session):
            updated = await self._repository.set_role_permissions(
                role_id=role_id,
                permission_ids=payload.permission_ids,
            )

        if updated is None:
            raise OrganizationReferenceNotFoundError
        return self._role_response(updated)

    async def create_role(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: OrganizationRoleCreate,
    ) -> OrganizationRoleResponse:
        self._require_super_admin(current_user)
        await self._ensure_role_code_available(code=payload.code)
        if payload.permission_ids:
            await self._validate_permission_ids(payload.permission_ids)

        async with UnitOfWork(self._repository.session):
            created = await self._repository.create_role(
                role_id=f"role-{secrets.token_hex(8)}",
                name=payload.name.strip(),
                code=payload.code,
                data_scope=payload.data_scope,
            )
            if payload.permission_ids:
                updated = await self._repository.set_role_permissions(
                    role_id=created.id,
                    permission_ids=payload.permission_ids,
                )
                if updated is not None:
                    created = updated

        return self._role_response(created)

    async def update_role(
        self,
        *,
        current_user: CurrentUserResponse,
        role_id: str,
        payload: OrganizationRoleUpdate,
    ) -> OrganizationRoleResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_role(role_id)
        if existing is None:
            raise OrganizationRoleNotFoundError

        next_name = payload.name.strip() if payload.name is not None else existing.name
        next_code = payload.code if payload.code is not None else existing.code
        next_data_scope = (
            payload.data_scope if payload.data_scope is not None else existing.data_scope
        )
        if next_code != existing.code:
            await self._ensure_role_code_available(code=next_code, role_id=role_id)

        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_role(
                role_id=role_id,
                name=next_name,
                code=next_code,
                data_scope=next_data_scope,
            )

        if updated is None:
            raise OrganizationRoleNotFoundError
        return self._role_response(updated)

    async def delete_role(
        self,
        *,
        current_user: CurrentUserResponse,
        role_id: str,
    ) -> OrganizationRoleResponse:
        self._require_super_admin(current_user)
        existing = await self._repository.get_role(role_id)
        if existing is None:
            raise OrganizationRoleNotFoundError
        if await self._repository.count_users_with_role(role_id) > 0:
            raise OrganizationRoleInUseError

        async with UnitOfWork(self._repository.session):
            deleted = await self._repository.delete_role(role_id)

        if deleted is None:
            raise OrganizationRoleNotFoundError
        return self._role_response(deleted)

    async def _ensure_role_code_available(
        self,
        *,
        code: str,
        role_id: str | None = None,
    ) -> None:
        existing = await self._repository.get_role_by_code(code)
        if existing is not None and existing.id != role_id:
            raise OrganizationRoleCodeTakenError

    async def _validate_department(self, department_id: str) -> None:
        if await self._repository.get_department(department_id) is None:
            raise OrganizationReferenceNotFoundError

    async def _require_departments_available(self) -> None:
        if not await self._repository.list_departments():
            raise OrganizationDepartmentRequiredError

    async def _ensure_department_name_available(
        self,
        *,
        name: str,
        department_id: str | None = None,
    ) -> None:
        existing = await self._repository.get_department_by_name(name)
        if existing is not None and existing.id != department_id:
            raise OrganizationDepartmentNameTakenError

    async def _validate_department_parent(
        self,
        parent_id: str | None,
        *,
        department_id: str | None = None,
    ) -> None:
        if parent_id is None:
            return
        if parent_id == department_id:
            raise OrganizationReferenceNotFoundError

        # 向上遍历父链：父级必须存在，且不能形成环路（A→B→…→A）。
        # 深度上限兜底防止脏数据导致死循环。
        max_depth = 64
        cursor: str | None = parent_id
        for _ in range(max_depth):
            if cursor is None:
                return
            ancestor = await self._repository.get_department(cursor)
            if ancestor is None:
                raise OrganizationReferenceNotFoundError
            if department_id is not None and ancestor.parent_id == department_id:
                raise OrganizationReferenceNotFoundError
            cursor = ancestor.parent_id
        raise OrganizationReferenceNotFoundError

    async def _validate_role_ids(self, role_ids: list[str]) -> list[str]:
        roles = await self._repository.list_roles_by_ids(role_ids)
        if len(roles) != len(role_ids):
            raise OrganizationReferenceNotFoundError
        return role_ids

    async def _validate_permission_ids(self, permission_ids: list[str]) -> list[PermissionRow]:
        permissions = await self._repository.list_permissions_by_ids(permission_ids)
        if len(permissions) != len(permission_ids):
            raise OrganizationReferenceNotFoundError
        return permissions

    async def _ensure_permissions_initialized(self) -> list[PermissionRow]:
        permissions = await self._repository.list_permissions()
        if permissions:
            return permissions

        async with UnitOfWork(self._repository.session):
            self._repository.session.add_all(system_permissions())

        return await self._repository.list_permissions()

    def _require_super_admin(self, current_user: CurrentUserResponse) -> None:
        if SUPER_ADMIN_PERMISSION not in current_user.permissions:
            raise OrganizationPermissionDeniedError

    def _normalize_avatar(self, *, avatar_type: str, avatar_value: str) -> tuple[AvatarType, str]:
        normalized_type = avatar_type if avatar_type in {"preset", "upload"} else DEFAULT_AVATAR_TYPE
        normalized_value = avatar_value.strip() or DEFAULT_AVATAR_VALUE

        if normalized_type == "preset":
            if normalized_value not in ORGANIZATION_AVATAR_PRESETS:
                raise OrganizationInvalidAvatarError
            return "preset", normalized_value

        if not normalized_value.startswith("data:image/"):
            raise OrganizationInvalidAvatarError
        if ";base64," not in normalized_value[:64]:
            raise OrganizationInvalidAvatarError
        return "upload", normalized_value

    def _user_response(self, row: OrganizationUserRow) -> OrganizationUserResponse:
        return OrganizationUserResponse(
            id=row.id,
            username=row.username,
            display_name=row.display_name,
            department_id=row.department_id,
            department_name=row.department_name,
            avatar_type=self._response_avatar_type(row.avatar_type),
            avatar_value=row.avatar_value or DEFAULT_AVATAR_VALUE,
            roles=[self._role_response(role) for role in row.roles],
            is_active=row.is_active,
            created_at=row.created_at,
            password_set=row.password_set,
        )

    def _department_response(self, row: DepartmentRow) -> OrganizationDepartmentResponse:
        return OrganizationDepartmentResponse(
            id=row.id,
            name=row.name,
            parent_id=row.parent_id,
            sort_order=row.sort_order,
        )

    def _role_response(self, row: RoleRow) -> OrganizationRoleResponse:
        return OrganizationRoleResponse(
            id=row.id,
            name=row.name,
            code=row.code,
            data_scope=row.data_scope,
            permissions=[self._permission_response(permission) for permission in row.permissions],
        )

    def _permission_response(self, row: PermissionRow) -> OrganizationPermissionResponse:
        return OrganizationPermissionResponse(
            id=row.id,
            code=row.code,
            name=row.name,
            category=row.category,
        )

    def _response_avatar_type(self, avatar_type: str) -> AvatarType:
        if avatar_type == "upload":
            return "upload"
        return "preset"

    def _generate_password(self) -> str:
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
        return "".join(secrets.choice(alphabet) for _ in range(12))
