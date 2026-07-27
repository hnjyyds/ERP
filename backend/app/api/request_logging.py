"""HTTP 可观测性层：为请求建立关联上下文并记录统一的访问与异常日志。

中间件只处理 HTTP 协议协调，不读取业务请求体，也不承担业务异常判断。
"""

import logging
import re
from time import perf_counter
from typing import cast
from uuid import uuid4

from fastapi.responses import JSONResponse
from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.api.error_handlers import error_response_body
from app.core.logging import (
    get_current_user_id,
    reset_request_context,
    start_request_context,
)
from app.core.status_codes import AppStatusCode, get_status_definition

REQUEST_ID_HEADER = "X-Request-ID"
# 限制客户端关联 ID 的长度和字符集，防止换行注入及日志字段污染。
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
_request_logger = logging.getLogger("app.request")


def _request_id(scope: Scope) -> str:
    """复用安全的客户端 ID，否则生成服务端 ID。"""
    supplied = Headers(scope=scope).get(REQUEST_ID_HEADER)
    if isinstance(supplied, str) and _REQUEST_ID_PATTERN.fullmatch(supplied):
        return supplied
    return uuid4().hex


def _route_path(scope: Scope) -> str | None:
    route = scope.get("route")
    route_path = getattr(route, "path", None)
    return route_path if isinstance(route_path, str) else None


def _client_ip(scope: Scope) -> str | None:
    client = scope.get("client")
    if isinstance(client, tuple) and client:
        return str(client[0])
    return None


def _log_fields(
    *,
    scope: Scope,
    request_id: str,
    status_code: int,
    duration_ms: float,
    slow_request: bool,
) -> dict[str, object]:
    """构造成功和失败日志共用的稳定字段契约。"""
    return {
        "request_id": request_id,
        "user_id": get_current_user_id(),
        "method": str(scope.get("method", "")),
        "path": str(scope.get("path", "")),
        "route": _route_path(scope),
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
        "client_ip": _client_ip(scope),
        "slow_request": slow_request,
    }


class RequestLoggingMiddleware:
    """记录请求结果、耗时和异常，并保证响应始终携带关联 ID。

    健康检查成功日志默认关闭以降低容器噪声；失败仍会记录。未处理异常在响应尚未开始时
    转换为标准 500 响应，从而让客户端拿到可用于检索异常堆栈的 ``X-Request-ID``。
    """

    def __init__(
        self,
        app: ASGIApp,
        *,
        slow_request_ms: int = 1_000,
        log_health_requests: bool = False,
    ) -> None:
        self.app = app
        self.slow_request_ms = slow_request_ms
        self.log_health_requests = log_health_requests

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = _request_id(scope)
        context_tokens = start_request_context(request_id)
        started_at = perf_counter()
        status_code = 500
        response_started = False
        path = str(scope.get("path", ""))
        should_log_success = self.log_health_requests or path != "/api/v1/health"

        async def send_with_request_id(message: Message) -> None:
            nonlocal response_started, status_code
            if message["type"] == "http.response.start":
                # 响应头只能在 http.response.start 阶段安全写入。
                response_started = True
                status_code = cast(int, message["status"])
                MutableHeaders(scope=message)[REQUEST_ID_HEADER] = request_id
            await send(message)

        _request_logger.debug(
            "request started",
            extra={
                "event": "request_started",
                "request_id": request_id,
                "method": str(scope.get("method", "")),
                "path": path,
                "client_ip": _client_ip(scope),
            },
        )

        try:
            await self.app(scope, receive, send_with_request_id)
        except Exception:
            duration_ms = (perf_counter() - started_at) * 1_000
            fields = _log_fields(
                scope=scope,
                request_id=request_id,
                status_code=500,
                duration_ms=duration_ms,
                slow_request=duration_ms >= self.slow_request_ms,
            )
            _request_logger.exception(
                "request failed",
                extra={"event": "request_failed", **fields},
            )
            if response_started:
                # 流式响应已经发送后不能再构造第二个响应，只记录并交给服务器处理。
                raise

            definition = get_status_definition(AppStatusCode.SERVER_ERROR)
            response = JSONResponse(
                status_code=definition.http_status,
                content=error_response_body(AppStatusCode.SERVER_ERROR),
                headers={REQUEST_ID_HEADER: request_id},
            )
            await response(scope, receive, send)
        else:
            duration_ms = (perf_counter() - started_at) * 1_000
            slow_request = duration_ms >= self.slow_request_ms
            if should_log_success:
                log_level = logging.INFO
                if status_code >= 500:
                    log_level = logging.ERROR
                elif status_code >= 400 or slow_request:
                    log_level = logging.WARNING
                fields = _log_fields(
                    scope=scope,
                    request_id=request_id,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    slow_request=slow_request,
                )
                _request_logger.log(
                    log_level,
                    "request completed",
                    extra={"event": "request_completed", **fields},
                )
        finally:
            reset_request_context(context_tokens)
