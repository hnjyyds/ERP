from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.config import get_settings
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.services import AuthService, TokenService


async def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AuthService:
    settings = get_settings()
    return AuthService(
        repository=AuthRepository(session),
        token_service=TokenService(secret_key=settings.auth_secret_key),
    )
