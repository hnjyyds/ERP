"""路由层权限依赖：在进入 service 前按权限码拒绝无权限请求。

与 service 层各自的 ``_require_*`` 共用 ``permissions.py`` 中的权限码常量，
service 层校验保留为纵深防御。拒绝时抛出的异常与 service 层完全一致，
因此同一接口在两层拒绝时的 HTTP 状态码、错误码与文案不会出现差异。
"""

from collections.abc import Awaitable, Callable

from app.api.auth_dependencies import CurrentUserDep
from app.modules.system.auth.schemas import CurrentUserResponse


def require_permissions(
    *codes: str,
    error: type[Exception],
) -> Callable[..., Awaitable[CurrentUserResponse]]:
    """要求当前用户同时具备全部权限码，否则抛出指定的领域异常。

    ``error`` 必须传入对应模块 service 层使用的同一个异常类型，以保证
    路由层与 service 层的 403 文案一致。
    """

    async def dependency(current_user: CurrentUserDep) -> CurrentUserResponse:
        if any(code not in current_user.permissions for code in codes):
            raise error
        return current_user

    return dependency
