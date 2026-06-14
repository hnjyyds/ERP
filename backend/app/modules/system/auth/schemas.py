from pydantic import BaseModel, ConfigDict, Field


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
    roles: list[str]
    permissions: list[str]


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
