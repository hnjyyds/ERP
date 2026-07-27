"""认证依赖层：统一解析当前用户，并把身份写入请求日志上下文。"""

from typing import Annotated

from fastapi import Depends

from app.api.deps import get_bearer_token
from app.api.http_exceptions import raise_unauthorized
from app.core.logging import set_current_user_id
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse, CurrentUserSessionResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError


async def get_current_user_session(
    access_token: Annotated[str, Depends(get_bearer_token)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> CurrentUserSessionResponse:
    """校验 Bearer token，返回会话并为后续业务日志绑定用户 ID。"""
    try:
        session = await service.get_current_user(access_token)
    except InvalidTokenError:
        raise_unauthorized()
    set_current_user_id(session.user.id)
    return session


async def get_current_user(
    session: Annotated[CurrentUserSessionResponse, Depends(get_current_user_session)],
) -> CurrentUserResponse:
    """从已校验的会话中提取路由最常使用的用户视图。"""
    return session.user


# 路由层只引用以下类型别名，避免重复声明 Depends 和认证异常处理。
CurrentUserDep = Annotated[CurrentUserResponse, Depends(get_current_user)]
CurrentUserSessionDep = Annotated[
    CurrentUserSessionResponse,
    Depends(get_current_user_session),
]
