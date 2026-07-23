from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.config import get_settings
from app.mcp.credentials import McpCredentialTokenService
from app.modules.system.mcp_settings.repositories import McpSettingsRepository
from app.modules.system.mcp_settings.services import McpSettingsService


async def get_mcp_settings_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> McpSettingsService:
    settings = get_settings()
    return McpSettingsService(
        McpSettingsRepository(session),
        McpCredentialTokenService(
            secret_key=settings.auth_secret_key,
            ttl_seconds=settings.mcp_credential_ttl_seconds,
        ),
    )
