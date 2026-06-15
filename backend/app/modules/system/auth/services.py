import base64
import hashlib
import hmac
import time
from dataclasses import dataclass

from app.modules.system.auth.passwords import verify_password
from app.modules.system.auth.repositories import (
    AssignableUserRow,
    AuthRepository,
    MenuItemRow,
    UserIdentityRow,
)
from app.modules.system.auth.schemas import (
    AssignableUserListResponse,
    AssignableUserResponse,
    AuthSessionResponse,
    CurrentUserResponse,
    CurrentUserAvatarUpdate,
    DEFAULT_AVATAR_TYPE,
    DEFAULT_AVATAR_VALUE,
    ORGANIZATION_AVATAR_PRESETS,
    AvatarType,
    CurrentUserSessionResponse,
    MenuItemResponse,
    MenuListResponse,
)


class InvalidCredentialsError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


class InvalidAvatarError(Exception):
    pass


@dataclass(frozen=True)
class TokenPayload:
    user_id: str
    expires_at: int


class TokenService:
    def __init__(self, secret_key: str, ttl_seconds: int = 8 * 60 * 60) -> None:
        self._secret_key = secret_key
        self._ttl_seconds = ttl_seconds

    def create_access_token(self, user_id: str) -> str:
        expires_at = int(time.time()) + self._ttl_seconds
        payload = f"{user_id}:{expires_at}"
        signature = self._sign(payload)
        token_text = f"{payload}:{signature}"
        return base64.urlsafe_b64encode(token_text.encode()).decode()

    def verify_access_token(self, token: str) -> TokenPayload:
        try:
            token_text = base64.urlsafe_b64decode(token.encode()).decode()
            user_id, expires_at_text, signature = token_text.split(":", maxsplit=2)
            payload = f"{user_id}:{expires_at_text}"
            expected = self._sign(payload)
            expires_at = int(expires_at_text)
        except (ValueError, UnicodeDecodeError):
            raise InvalidTokenError from None

        if not hmac.compare_digest(signature, expected):
            raise InvalidTokenError
        if expires_at < int(time.time()):
            raise InvalidTokenError
        return TokenPayload(user_id=user_id, expires_at=expires_at)

    def _sign(self, payload: str) -> str:
        digest = hmac.new(self._secret_key.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return digest


class AuthService:
    def __init__(self, repository: AuthRepository, token_service: TokenService) -> None:
        self._repository = repository
        self._token_service = token_service

    async def login(self, *, username: str, password: str) -> AuthSessionResponse:
        identity = await self._repository.get_user_identity_by_username(username)
        if identity is None or not verify_password(
            password=password,
            salt=identity.password_salt,
            expected_hash=identity.password_hash,
        ):
            raise InvalidCredentialsError

        menus = await self._repository.list_menus_for_permissions(identity.permissions)
        return AuthSessionResponse(
            access_token=self._token_service.create_access_token(identity.id),
            token_type="bearer",
            user=self._user_response(identity),
            menus=[self._menu_response(row) for row in menus],
        )

    async def get_current_user(self, access_token: str) -> CurrentUserSessionResponse:
        payload = self._token_service.verify_access_token(access_token)
        identity = await self._repository.get_user_identity_by_id(payload.user_id)
        if identity is None:
            raise InvalidTokenError
        menus = await self._repository.list_menus_for_permissions(identity.permissions)
        return CurrentUserSessionResponse(
            user=self._user_response(identity),
            menus=[self._menu_response(row) for row in menus],
        )

    async def get_menus(self, access_token: str) -> MenuListResponse:
        current = await self.get_current_user(access_token)
        return MenuListResponse(menus=current.menus)

    async def update_current_user_avatar(
        self,
        *,
        access_token: str,
        payload: CurrentUserAvatarUpdate,
    ) -> CurrentUserSessionResponse:
        token = self._token_service.verify_access_token(access_token)
        avatar_type, avatar_value = self._normalize_avatar(
            avatar_type=payload.avatar_type,
            avatar_value=payload.avatar_value,
        )
        identity = await self._repository.update_user_avatar(
            user_id=token.user_id,
            avatar_type=avatar_type,
            avatar_value=avatar_value,
        )
        if identity is None:
            raise InvalidTokenError
        menus = await self._repository.list_menus_for_permissions(identity.permissions)
        return CurrentUserSessionResponse(
            user=self._user_response(identity),
            menus=[self._menu_response(row) for row in menus],
        )

    async def list_assignable_users(self) -> AssignableUserListResponse:
        rows = await self._repository.list_active_users()
        return AssignableUserListResponse(users=[self._assignable_user_response(row) for row in rows])

    async def list_assignable_users_by_ids(self, user_ids: list[str]) -> list[AssignableUserResponse]:
        rows = await self._repository.list_active_users_by_ids(user_ids)
        return [self._assignable_user_response(row) for row in rows]

    def _user_response(self, identity: UserIdentityRow) -> CurrentUserResponse:
        return CurrentUserResponse(
            id=identity.id,
            username=identity.username,
            display_name=identity.display_name,
            department_name=identity.department_name,
            avatar_type=self._response_avatar_type(identity.avatar_type),
            avatar_value=identity.avatar_value or DEFAULT_AVATAR_VALUE,
            roles=identity.roles,
            permissions=identity.permissions,
        )

    def _menu_response(self, row: MenuItemRow) -> MenuItemResponse:
        return MenuItemResponse(
            id=row.id,
            label=row.label,
            path=row.path,
            icon=row.icon,
            required_permission=row.required_permission,
            sort_order=row.sort_order,
        )

    def _assignable_user_response(self, row: AssignableUserRow) -> AssignableUserResponse:
        return AssignableUserResponse(
            id=row.id,
            username=row.username,
            display_name=row.display_name,
            department_name=row.department_name,
            avatar_type=self._response_avatar_type(row.avatar_type),
            avatar_value=row.avatar_value or DEFAULT_AVATAR_VALUE,
        )

    def _normalize_avatar(self, *, avatar_type: str, avatar_value: str) -> tuple[AvatarType, str]:
        normalized_value = avatar_value.strip() or DEFAULT_AVATAR_VALUE
        if avatar_type == "preset":
            if normalized_value not in ORGANIZATION_AVATAR_PRESETS:
                raise InvalidAvatarError
            return "preset", normalized_value

        if avatar_type != "upload":
            raise InvalidAvatarError
        if not normalized_value.startswith("data:image/"):
            raise InvalidAvatarError
        if ";base64," not in normalized_value[:64]:
            raise InvalidAvatarError
        return "upload", normalized_value

    def _response_avatar_type(self, avatar_type: str) -> AvatarType:
        if avatar_type == "upload":
            return "upload"
        return DEFAULT_AVATAR_TYPE
