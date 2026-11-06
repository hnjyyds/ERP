"""语言协商中间件：建立请求语言上下文，并声明响应的语言协商维度。"""

from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.language import reset_current_language, set_current_language

ACCEPT_LANGUAGE_HEADER = "Accept-Language"
VARY_HEADER = "Vary"


def append_vary(headers: MutableHeaders, value: str = ACCEPT_LANGUAGE_HEADER) -> None:
    """在保留既有 Vary 值的前提下追加语言维度，避免重复声明。"""
    existing = headers.get(VARY_HEADER)
    values = [item.strip() for item in existing.split(",") if item.strip()] if existing else []
    if value.lower() not in {item.lower() for item in values}:
        values.append(value)
    headers[VARY_HEADER] = ", ".join(values)


class LanguageMiddleware:
    """解析 ``Accept-Language``，让后续异常处理按请求语言渲染文案。"""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        header = Headers(scope=scope).get(ACCEPT_LANGUAGE_HEADER)
        token = set_current_language(header)

        async def send_with_vary(message: Message) -> None:
            if message["type"] == "http.response.start":
                append_vary(MutableHeaders(scope=message))
            await send(message)

        try:
            await self.app(scope, receive, send_with_vary)
        finally:
            reset_current_language(token)
