from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AvatarType = Literal["preset", "upload"]
DEFAULT_AVATAR_TYPE: AvatarType = "preset"
DEFAULT_AVATAR_VALUE = "amber-orbit"
ORGANIZATION_AVATAR_PRESETS = frozenset(
    {
        "amber-orbit",
        "sage-pulse",
        "copper-wave",
        "blueprint-grid",
        "ink-halo",
        "rose-signal",
    }
)
AVATAR_VALUE_MAX_LENGTH = 1_500_000


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=128)


class MenuItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    label: str
    path: str
    icon: str
    required_permission: str
    sort_order: int


class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    username: str
    display_name: str
    department_name: str
    avatar_type: AvatarType = DEFAULT_AVATAR_TYPE
    avatar_value: str = DEFAULT_AVATAR_VALUE
    roles: list[str]
    permissions: list[str]


class AssignableUserResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    username: str
    display_name: str
    department_name: str
    avatar_type: AvatarType = DEFAULT_AVATAR_TYPE
    avatar_value: str = DEFAULT_AVATAR_VALUE


class AssignableUserListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    users: list[AssignableUserResponse]


class CurrentUserAvatarUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    avatar_type: AvatarType
    avatar_value: str = Field(min_length=1, max_length=AVATAR_VALUE_MAX_LENGTH)


class OrganizationDepartmentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    parent_id: str | None
    sort_order: int


class OrganizationPermissionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    name: str


class OrganizationRoleResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    code: str
    permissions: list[OrganizationPermissionResponse] = Field(default_factory=list)


class OrganizationUserResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    username: str
    display_name: str
    department_id: str
    department_name: str
    avatar_type: AvatarType = DEFAULT_AVATAR_TYPE
    avatar_value: str = DEFAULT_AVATAR_VALUE
    roles: list[OrganizationRoleResponse]
    is_active: bool
    created_at: datetime
    password_set: bool


class OrganizationUserListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    users: list[OrganizationUserResponse]


class OrganizationOptionsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    departments: list[OrganizationDepartmentResponse]
    roles: list[OrganizationRoleResponse]
    permissions: list[OrganizationPermissionResponse]


class OrganizationUserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=2, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    display_name: str = Field(min_length=1, max_length=120)
    department_id: str = Field(min_length=1, max_length=64)
    role_ids: list[str] = Field(default_factory=list)
    is_active: bool = True
    avatar_type: AvatarType = DEFAULT_AVATAR_TYPE
    avatar_value: str = Field(default=DEFAULT_AVATAR_VALUE, max_length=AVATAR_VALUE_MAX_LENGTH)

    @field_validator("role_ids")
    @classmethod
    def unique_role_ids(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))


class OrganizationUserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    department_id: str | None = Field(default=None, min_length=1, max_length=64)
    role_ids: list[str] | None = None
    is_active: bool | None = None
    avatar_type: AvatarType | None = None
    avatar_value: str | None = Field(default=None, max_length=AVATAR_VALUE_MAX_LENGTH)

    @field_validator("role_ids")
    @classmethod
    def unique_optional_role_ids(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return list(dict.fromkeys(value))


class OrganizationRolePermissionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    permission_ids: list[str] = Field(default_factory=list)

    @field_validator("permission_ids")
    @classmethod
    def unique_permission_ids(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))


class OrganizationUserCreateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user: OrganizationUserResponse
    initial_password: str


class OrganizationPasswordResetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user: OrganizationUserResponse
    temporary_password: str


class AuthSessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    access_token: str
    token_type: str
    user: CurrentUserResponse
    menus: list[MenuItemResponse]


class CurrentUserSessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user: CurrentUserResponse
    menus: list[MenuItemResponse]


class MenuListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    menus: list[MenuItemResponse]
