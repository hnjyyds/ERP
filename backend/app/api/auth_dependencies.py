from typing import Annotated

from fastapi import Depends

from app.api.deps import get_bearer_token
from app.api.http_exceptions import raise_unauthorized
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse, CurrentUserSessionResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError


async def get_current_user_session(
    access_token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> CurrentUserSessionResponse:
    try:
        return await service.get_current_user(access_token)
    except InvalidTokenError:
        raise_unauthorized()


async def get_current_user(
    session: Annotated[CurrentUserSessionResponse, Depends(get_current_user_session)],
) -> CurrentUserResponse:
    return session.user


CurrentUserDep = Annotated[CurrentUserResponse, Depends(get_current_user)]
CurrentUserSessionDep = Annotated[
    CurrentUserSessionResponse,
    Depends(get_current_user_session),
]
