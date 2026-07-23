from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.modules.system.mcp_settings.repositories import McpSettingsRepository


class McpAvailabilityMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        *,
        session_factory: async_sessionmaker[AsyncSession],
    ) -> None:
        self._app = app
        self._session_factory = session_factory

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope.get("path") == "/mcp":
            async with self._session_factory() as session:
                enabled = await McpSettingsRepository(session).is_enabled()
            if not enabled:
                response = JSONResponse(
                    {
                        "success": False,
                        "code": "MCP_DISABLED",
                        "message": "MCP 服务未启用",
                        "data": None,
                        "error": {
                            "code": "MCP_DISABLED",
                            "message": "请联系系统管理员启用 MCP 服务",
                        },
                    },
                    status_code=503,
                )
                await response(scope, receive, send)
                return
        await self._app(scope, receive, send)
