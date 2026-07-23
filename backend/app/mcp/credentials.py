import base64
import binascii
import hashlib
import hmac
import time
from dataclasses import dataclass

from mcp.server.auth.provider import AccessToken
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.mcp_settings.repositories import McpSettingsRepository

MCP_SCOPE = "erp:crud"
_TOKEN_PREFIX = "mcp-v1"


class InvalidMcpCredentialError(Exception):
    pass


@dataclass(frozen=True)
class McpCredentialClaims:
    user_id: str
    version: int
    expires_at: int


class McpCredentialTokenService:
    def __init__(self, *, secret_key: str, ttl_seconds: int) -> None:
        self._secret_key = secret_key
        self._ttl_seconds = ttl_seconds

    @property
    def ttl_seconds(self) -> int:
        return self._ttl_seconds

    def create(self, *, user_id: str, version: int) -> tuple[str, McpCredentialClaims]:
        claims = McpCredentialClaims(
            user_id=user_id,
            version=version,
            expires_at=int(time.time()) + self._ttl_seconds,
        )
        payload = self._payload(claims)
        signature = self._sign(payload)
        token = base64.urlsafe_b64encode(f"{payload}:{signature}".encode()).decode()
        return token, claims

    def verify(self, token: str) -> McpCredentialClaims:
        try:
            token_text = base64.b64decode(
                token.encode(),
                altchars=b"-_",
                validate=True,
            ).decode()
            prefix, user_id, version_text, expires_at_text, signature = token_text.split(
                ":",
                maxsplit=4,
            )
            claims = McpCredentialClaims(
                user_id=user_id,
                version=int(version_text),
                expires_at=int(expires_at_text),
            )
        except (binascii.Error, UnicodeDecodeError, ValueError):
            raise InvalidMcpCredentialError from None
        if prefix != _TOKEN_PREFIX:
            raise InvalidMcpCredentialError
        payload = self._payload(claims)
        if not hmac.compare_digest(signature, self._sign(payload)):
            raise InvalidMcpCredentialError
        if claims.expires_at < int(time.time()):
            raise InvalidMcpCredentialError
        return claims

    @staticmethod
    def _payload(claims: McpCredentialClaims) -> str:
        return f"{_TOKEN_PREFIX}:{claims.user_id}:{claims.version}:{claims.expires_at}"

    def _sign(self, payload: str) -> str:
        scoped_payload = f"yuanjing-mcp-credential:{payload}"
        return hmac.new(
            self._secret_key.encode(),
            scoped_payload.encode(),
            hashlib.sha256,
        ).hexdigest()


class McpCredentialVerifier:
    def __init__(
        self,
        *,
        session_factory: async_sessionmaker[AsyncSession],
        token_service: McpCredentialTokenService,
    ) -> None:
        self._session_factory = session_factory
        self._token_service = token_service

    async def verify_token(self, token: str) -> AccessToken | None:
        try:
            claims = self._token_service.verify(token)
        except InvalidMcpCredentialError:
            return None
        async with self._session_factory() as session:
            row = await McpSettingsRepository(session).get()
        if (
            row is None
            or not row.enabled
            or row.credential_issued_at is None
            or row.credential_version != claims.version
        ):
            return None
        return AccessToken(
            token=token,
            client_id="yuanjing-trade-erp-mcp",
            scopes=[MCP_SCOPE],
            expires_at=claims.expires_at,
            subject=claims.user_id,
        )
