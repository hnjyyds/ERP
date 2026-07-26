from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.system.auth.data_scope_rules import DEFAULT_DATA_SCOPE, DataScope

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
    """ERP 用户登录凭据。"""

    model_config = ConfigDict(extra="forbid")

    username: str = Field(
        min_length=1,
        max_length=80,
        description="登录用户名。",
        examples=["admin"],
    )
    password: str = Field(
        min_length=1,
        max_length=128,
        description="登录密码，仅用于身份校验，不会出现在响应中。",
        examples=["admin123"],
    )


class MenuItemResponse(BaseModel):
    """当前用户可访问的一个导航菜单项。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="菜单项 ID。")
    label: str = Field(description="菜单显示名称。")
    path: str = Field(description="前端路由路径。")
    icon: str = Field(description="前端使用的菜单图标标识。")
    required_permission: str = Field(description="访问该菜单所需的权限编码。")
    sort_order: int = Field(description="菜单排序值，数值越小越靠前。")


class CurrentUserResponse(BaseModel):
    """当前登录用户的身份、组织和权限信息。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="用户 ID。")
    username: str = Field(description="登录用户名。")
    display_name: str = Field(description="用户显示名称。")
    department_id: str | None = Field(
        default=None,
        description="所属部门 ID；未分配部门时为 null。",
    )
    department_name: str = Field(description="所属部门名称。")
    data_scope: DataScope = Field(
        default=DEFAULT_DATA_SCOPE,
        description="用户的数据访问范围。",
    )
    avatar_type: AvatarType = Field(
        default=DEFAULT_AVATAR_TYPE,
        description="头像类型：preset 为系统预设，upload 为用户上传。",
    )
    avatar_value: str = Field(
        default=DEFAULT_AVATAR_VALUE,
        description="预设头像标识或上传头像的 data URL。",
    )
    roles: list[str] = Field(description="用户拥有的角色名称列表。")
    permissions: list[str] = Field(description="用户拥有的权限编码列表。")


class AssignableUserResponse(BaseModel):
    """可被选择为负责人、审批人或经办人的用户。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="用户 ID。")
    username: str = Field(description="登录用户名。")
    display_name: str = Field(description="用户显示名称。")
    department_name: str = Field(description="所属部门名称。")
    avatar_type: AvatarType = Field(
        default=DEFAULT_AVATAR_TYPE,
        description="头像类型：preset 或 upload。",
    )
    avatar_value: str = Field(
        default=DEFAULT_AVATAR_VALUE,
        description="预设头像标识或上传头像的 data URL。",
    )


class AssignableUserListResponse(BaseModel):
    """可选用户列表。"""

    model_config = ConfigDict(extra="forbid")

    users: list[AssignableUserResponse] = Field(description="可被分配业务职责的用户列表。")


class CurrentUserAvatarUpdate(BaseModel):
    """更新当前用户头像的输入资料。"""

    model_config = ConfigDict(extra="forbid")

    avatar_type: AvatarType = Field(
        description="头像类型：preset 使用系统预设头像，upload 使用上传图片。",
        examples=["preset"],
    )
    avatar_value: str = Field(
        min_length=1,
        max_length=AVATAR_VALUE_MAX_LENGTH,
        description="预设头像标识，或以 data:image/ 开头的 Base64 data URL。",
        examples=["amber-orbit"],
    )


class OrganizationDepartmentResponse(BaseModel):
    """组织部门详情。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="部门 ID。")
    name: str = Field(description="部门名称。")
    parent_id: str | None = Field(description="上级部门 ID；顶级部门为 null。")
    sort_order: int = Field(description="同级部门排序值，数值越小越靠前。")


class OrganizationDepartmentCreate(BaseModel):
    """创建组织部门的输入资料。"""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=120,
        description="部门名称，同一上级部门下不可重复。",
        examples=["质量管理部"],
    )
    parent_id: str | None = Field(
        default=None,
        max_length=64,
        description="上级部门 ID；创建顶级部门时不填。",
        examples=["dept-business"],
    )
    sort_order: int = Field(
        default=0,
        ge=0,
        le=9999,
        description="同级部门排序值，数值越小越靠前。",
        examples=[10],
    )

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("部门名称不能为空")
        return cleaned


class OrganizationDepartmentUpdate(BaseModel):
    """更新组织部门的输入资料，仅修改提供的字段。"""

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=120,
        description="新的部门名称。",
        examples=["质量与合规部"],
    )
    parent_id: str | None = Field(
        default=None,
        max_length=64,
        description="新的上级部门 ID；设为 null 表示调整为顶级部门。",
    )
    sort_order: int | None = Field(
        default=None,
        ge=0,
        le=9999,
        description="新的同级排序值。",
        examples=[20],
    )

    @field_validator("name")
    @classmethod
    def clean_optional_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("部门名称不能为空")
        return cleaned


class OrganizationPermissionResponse(BaseModel):
    """系统权限定义。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="权限记录 ID。")
    code: str = Field(description="权限编码，服务端据此执行访问控制。")
    name: str = Field(description="权限显示名称。")
    category: str = Field(
        default="functional",
        description="权限类别，例如 functional（功能权限）。",
    )


class OrganizationRoleResponse(BaseModel):
    """组织角色及其数据范围和权限。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="角色 ID。")
    name: str = Field(description="角色显示名称。")
    code: str = Field(description="角色唯一编码。")
    data_scope: DataScope = Field(
        default=DEFAULT_DATA_SCOPE,
        description="该角色授予的数据访问范围。",
    )
    permissions: list[OrganizationPermissionResponse] = Field(
        default_factory=list,
        description="该角色包含的权限列表。",
    )


class OrganizationUserResponse(BaseModel):
    """组织用户详情。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="用户 ID。")
    username: str = Field(description="登录用户名。")
    display_name: str = Field(description="用户显示名称。")
    department_id: str | None = Field(description="所属部门 ID。")
    department_name: str = Field(description="所属部门名称。")
    avatar_type: AvatarType = Field(
        default=DEFAULT_AVATAR_TYPE,
        description="头像类型：preset 或 upload。",
    )
    avatar_value: str = Field(
        default=DEFAULT_AVATAR_VALUE,
        description="预设头像标识或上传头像的 data URL。",
    )
    roles: list[OrganizationRoleResponse] = Field(description="用户拥有的角色列表。")
    is_active: bool = Field(description="账号是否启用；停用账号不能登录。")
    created_at: datetime = Field(description="账号创建时间。")
    password_set: bool = Field(description="账号是否已经设置可用密码。")


class OrganizationUserListResponse(BaseModel):
    """组织用户列表。"""

    model_config = ConfigDict(extra="forbid")

    users: list[OrganizationUserResponse] = Field(description="组织内的用户列表。")


class OrganizationOptionsResponse(BaseModel):
    """组织用户和角色表单所需的可选项。"""

    model_config = ConfigDict(extra="forbid")

    departments: list[OrganizationDepartmentResponse] = Field(description="可选择的部门列表。")
    roles: list[OrganizationRoleResponse] = Field(description="可分配的角色列表。")
    permissions: list[OrganizationPermissionResponse] = Field(description="可授予角色的权限列表。")


class OrganizationUserCreate(BaseModel):
    """创建组织用户的输入资料。"""

    model_config = ConfigDict(extra="forbid")

    username: str = Field(
        min_length=2,
        max_length=80,
        pattern=r"^[A-Za-z0-9_.-]+$",
        description="唯一登录用户名，仅允许字母、数字、点、下划线和连字符。",
        examples=["qc.zhang"],
    )
    display_name: str = Field(
        min_length=1,
        max_length=120,
        description="用户在系统中显示的姓名。",
        examples=["QC 张工"],
    )
    department_id: str = Field(
        min_length=1,
        max_length=64,
        description="所属部门 ID，必须引用已存在的部门。",
        examples=["dept-quality"],
    )
    role_ids: list[str] = Field(
        default_factory=list,
        description="授予用户的角色 ID 列表；重复项会自动去除。",
        examples=[["role-qc"]],
    )
    is_active: bool = Field(
        default=True,
        description="是否立即启用账号。",
        examples=[True],
    )
    avatar_type: AvatarType = Field(
        default=DEFAULT_AVATAR_TYPE,
        description="头像类型：preset 或 upload。",
        examples=["preset"],
    )
    avatar_value: str = Field(
        default=DEFAULT_AVATAR_VALUE,
        max_length=AVATAR_VALUE_MAX_LENGTH,
        description="预设头像标识或上传头像的 data URL。",
        examples=["blueprint-grid"],
    )

    @field_validator("role_ids")
    @classmethod
    def unique_role_ids(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))


class OrganizationUserUpdate(BaseModel):
    """更新组织用户的输入资料，仅修改提供的字段。"""

    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=120,
        description="新的用户显示名称。",
    )
    department_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=64,
        description="新的所属部门 ID。",
    )
    role_ids: list[str] | None = Field(
        default=None,
        description="新的角色 ID 列表；提供后将整体替换现有角色。",
    )
    is_active: bool | None = Field(
        default=None,
        description="是否启用账号；设为 false 后用户不能登录。",
    )
    avatar_type: AvatarType | None = Field(
        default=None,
        description="新的头像类型：preset 或 upload。",
    )
    avatar_value: str | None = Field(
        default=None,
        max_length=AVATAR_VALUE_MAX_LENGTH,
        description="新的预设头像标识或上传头像 data URL。",
    )

    @field_validator("role_ids")
    @classmethod
    def unique_optional_role_ids(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return list(dict.fromkeys(value))


class OrganizationRolePermissionUpdate(BaseModel):
    """整体替换角色权限的输入资料。"""

    model_config = ConfigDict(extra="forbid")

    permission_ids: list[str] = Field(
        default_factory=list,
        description="角色应拥有的完整权限 ID 列表；空数组表示移除全部权限。",
        examples=[["permission-quality-view", "permission-quality-edit"]],
    )

    @field_validator("permission_ids")
    @classmethod
    def unique_permission_ids(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))


class OrganizationRoleCreate(BaseModel):
    """创建组织角色的输入资料。"""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=120,
        description="角色显示名称。",
        examples=["QC 专员"],
    )
    code: str = Field(
        min_length=2,
        max_length=80,
        pattern=r"^[a-z][a-z0-9_]*$",
        description="唯一角色编码，以小写字母开头，仅允许小写字母、数字和下划线。",
        examples=["quality_inspector"],
    )
    data_scope: DataScope = Field(
        default=DEFAULT_DATA_SCOPE,
        description="该角色授予的数据访问范围。",
        examples=["self"],
    )
    permission_ids: list[str] = Field(
        default_factory=list,
        description="授予角色的权限 ID 列表；重复项会自动去除。",
    )

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("角色名称不能为空")
        return cleaned

    @field_validator("permission_ids")
    @classmethod
    def unique_permission_ids(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))


class OrganizationRoleUpdate(BaseModel):
    """更新组织角色的输入资料，仅修改提供的字段。"""

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=120,
        description="新的角色显示名称。",
    )
    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
        pattern=r"^[a-z][a-z0-9_]*$",
        description="新的唯一角色编码。",
    )
    data_scope: DataScope | None = Field(
        default=None,
        description="新的数据访问范围。",
    )

    @field_validator("name")
    @classmethod
    def clean_optional_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("角色名称不能为空")
        return cleaned


class OrganizationUserCreateResponse(BaseModel):
    """创建组织用户后的账号和初始密码。"""

    model_config = ConfigDict(extra="forbid")

    user: OrganizationUserResponse = Field(description="新创建的组织用户。")
    initial_password: str = Field(
        description="系统生成的初始密码，仅在本次响应中返回，应安全交给用户。"
    )


class OrganizationPasswordResetResponse(BaseModel):
    """重置用户密码后的账号和临时密码。"""

    model_config = ConfigDict(extra="forbid")

    user: OrganizationUserResponse = Field(description="已重置密码的组织用户。")
    temporary_password: str = Field(
        description="系统生成的临时密码，仅在本次响应中返回，应安全交给用户。"
    )


class AuthSessionResponse(BaseModel):
    """登录成功后返回的访问令牌和用户会话。"""

    model_config = ConfigDict(extra="forbid")

    access_token: str = Field(description="ERP API 访问令牌。")
    token_type: str = Field(description="令牌类型，当前为 bearer。")
    user: CurrentUserResponse = Field(description="当前登录用户信息。")
    menus: list[MenuItemResponse] = Field(description="当前用户可访问的菜单列表。")


class CurrentUserSessionResponse(BaseModel):
    """当前登录用户及其可访问菜单。"""

    model_config = ConfigDict(extra="forbid")

    user: CurrentUserResponse = Field(description="当前登录用户信息。")
    menus: list[MenuItemResponse] = Field(description="当前用户可访问的菜单列表。")


class MenuListResponse(BaseModel):
    """当前用户可访问的菜单列表。"""

    model_config = ConfigDict(extra="forbid")

    menus: list[MenuItemResponse] = Field(description="按显示顺序排列的菜单列表。")
