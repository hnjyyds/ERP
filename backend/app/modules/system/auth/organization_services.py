import secrets
from datetime import UTC, datetime

from app.db.uow import UnitOfWork
from app.modules.system.auth.passwords import hash_password
from app.modules.system.auth.permissions import (
    ORGANIZATION_USER_MANAGE_PERMISSION,
    SUPER_ADMIN_PERMISSION,
)
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
    OrganizationDepartmentResponse,
    OrganizationOptionsResponse,
    OrganizationPasswordResetResponse,
    OrganizationPermissionResponse,
    OrganizationRolePermissionUpdate,
    OrganizationRoleResponse,
    OrganizationUserCreate,
    OrganizationUserCreateResponse,
    OrganizationUserListResponse,
    OrganizationUserResponse,
    OrganizationUserUpdate,
)

MANAGE_USERS_PERMISSION = ORGANIZATION_USER_MANAGE_PERMISSION


class OrganizationPermissionDeniedError(Exception):
    pass


class OrganizationUserNotFoundError(Exception):
    pass


class OrganizationReferenceNotFoundError(Exception):
    pass


class OrganizationUsernameTakenError(Exception):
    pass


class OrganizationInvalidAvatarError(Exception):
    pass


class OrganizationSelfDeactivateError(Exception):
    pass


class OrganizationSelfDemoteError(Exception):
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
        permissions = await self._repository.list_permissions()
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

        next_department_id = payload.department_id or existing.department_id
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

    async def _validate_department(self, department_id: str) -> None:
        if await self._repository.get_department(department_id) is None:
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

    def _require_manage_users(self, current_user: CurrentUserResponse) -> None:
        if MANAGE_USERS_PERMISSION not in current_user.permissions:
            raise OrganizationPermissionDeniedError

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
            permissions=[self._permission_response(permission) for permission in row.permissions],
        )

    def _permission_response(self, row: PermissionRow) -> OrganizationPermissionResponse:
        return OrganizationPermissionResponse(id=row.id, code=row.code, name=row.name)

    def _response_avatar_type(self, avatar_type: str) -> AvatarType:
        if avatar_type == "upload":
            return "upload"
        return "preset"

    def _generate_password(self) -> str:
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
        return "".join(secrets.choice(alphabet) for _ in range(12))
