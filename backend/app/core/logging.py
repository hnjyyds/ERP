"""日志基础设施层：维护请求上下文、敏感信息脱敏和统一输出格式。

该模块不依赖任何业务模块，业务代码只需使用标准库 ``logging``。请求 ID 和用户 ID
通过 ContextVar 自动注入同一异步请求产生的全部日志。
"""

import json
import logging
import re
from collections.abc import Mapping
from contextvars import ContextVar, Token
from datetime import UTC, datetime

REDACTED = "[REDACTED]"

# 请求上下文必须与异步任务隔离，不能用普通模块变量保存。
_request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)
_user_id_context: ContextVar[str | None] = ContextVar("user_id", default=None)
_configured = False

# 标准 LogRecord 字段由格式化器自己处理，只把业务 extra 字段追加到结构化日志中。
_STANDARD_RECORD_FIELDS = frozenset(logging.makeLogRecord({}).__dict__) | {
    "asctime",
    "message",
}
_CONTEXT_FIELDS = frozenset({"request_id", "user_id"})
_SENSITIVE_KEYS = frozenset(
    {
        "access_token",
        "api_key",
        "authorization",
        "auth_secret_key",
        "cookie",
        "credential",
        "credentials",
        "password",
        "refresh_token",
        "secret",
        "set_cookie",
        "token",
    }
)
_BEARER_PATTERN = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+")
_KEY_VALUE_PATTERN = re.compile(
    r"(?i)\b([a-z0-9_-]*(?:password|passwd|token|authorization|secret|"
    r"api[_-]?key)[a-z0-9_-]*)\b(\s*[:=]\s*)([^\s,;]+)"
)
_URI_CREDENTIAL_PATTERN = re.compile(
    r"(?i)([a-z][a-z0-9+.-]*://[^:/@\s]+:)([^@/\s]+)(@)"
)


def start_request_context(
    request_id: str,
) -> tuple[Token[str | None], Token[str | None]]:
    """初始化单次请求的日志上下文，并返回用于精确恢复上下文的 token。"""
    return _request_id_context.set(request_id), _user_id_context.set(None)


def reset_request_context(
    tokens: tuple[Token[str | None], Token[str | None]],
) -> None:
    """恢复进入请求前的上下文，避免连接复用时串入上一位用户的信息。"""
    request_id_token, user_id_token = tokens
    _user_id_context.reset(user_id_token)
    _request_id_context.reset(request_id_token)


def get_request_id() -> str | None:
    """返回当前异步请求的关联 ID；非请求任务返回 None。"""
    return _request_id_context.get()


def get_current_user_id() -> str | None:
    """返回认证依赖写入的当前用户 ID；匿名请求返回 None。"""
    return _user_id_context.get()


def set_current_user_id(user_id: str) -> None:
    """在认证完成后为当前请求绑定用户，不影响其他并发请求。"""
    _user_id_context.set(user_id)


def _normalized_key(key: str) -> str:
    return key.strip().lower().replace("-", "_")


def _is_sensitive_key(key: str) -> bool:
    normalized = _normalized_key(key)
    if normalized in _SENSITIVE_KEYS:
        return True
    key_parts = frozenset(normalized.split("_"))
    return bool(
        key_parts
        & {
            "authorization",
            "cookie",
            "credential",
            "credentials",
            "passwd",
            "password",
            "secret",
            "token",
        }
    )


def _redact_text(value: str) -> str:
    redacted = _BEARER_PATTERN.sub("Bearer [REDACTED]", value)
    redacted = _KEY_VALUE_PATTERN.sub(
        lambda match: f"{match.group(1)}{match.group(2)}{REDACTED}",
        redacted,
    )
    return _URI_CREDENTIAL_PATTERN.sub(
        lambda match: f"{match.group(1)}{REDACTED}{match.group(3)}",
        redacted,
    )


def _sanitize(value: object, *, key: str | None = None) -> object:
    if key is not None and _is_sensitive_key(key):
        return REDACTED
    if isinstance(value, Mapping):
        return {
            str(item_key): _sanitize(item_value, key=str(item_key))
            for item_key, item_value in value.items()
        }
    if isinstance(value, list | tuple | set | frozenset):
        return [_sanitize(item) for item in value]
    if isinstance(value, str):
        return _redact_text(value)
    if value is None or isinstance(value, bool | int | float):
        return value
    return _redact_text(str(value))


class JsonLogFormatter(logging.Formatter):
    """将标准日志和业务 extra 字段序列化为可检索、已脱敏的单行 JSON。"""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": (
                datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")
            ),
            "level": record.levelname,
            "logger": record.name,
            "message": _redact_text(record.getMessage()),
            "request_id": getattr(record, "request_id", None) or get_request_id(),
            "user_id": getattr(record, "user_id", None) or get_current_user_id(),
        }
        for field_name, value in record.__dict__.items():
            if (
                field_name in _STANDARD_RECORD_FIELDS
                or field_name in _CONTEXT_FIELDS
                or field_name.startswith("_")
            ):
                continue
            payload[field_name] = _sanitize(value, key=field_name)

        if record.exc_info:
            payload["exception"] = _redact_text(self.formatException(record.exc_info))

        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


class TextLogFormatter(logging.Formatter):
    """提供适合本地开发阅读的紧凑文本格式，同时保留关联上下文和脱敏。"""

    def format(self, record: logging.LogRecord) -> str:
        request_id = getattr(record, "request_id", None) or get_request_id() or "-"
        user_id = getattr(record, "user_id", None) or get_current_user_id() or "-"
        message = _redact_text(record.getMessage())
        rendered = f"{record.levelname} request_id={request_id} user_id={user_id} {message}"
        if record.exc_info:
            rendered = f"{rendered}\n{_redact_text(self.formatException(record.exc_info))}"
        return rendered


def configure_logging(*, level: str, format_name: str) -> None:
    """配置进程级日志输出，并关闭与请求中间件重复的 Uvicorn access log。"""
    global _configured  # noqa: PLW0603
    if _configured:
        return

    formatter: logging.Formatter
    formatter = JsonLogFormatter() if format_name == "json" else TextLogFormatter()
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    resolved_level = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
        "CRITICAL": logging.CRITICAL,
    }.get(level.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(resolved_level)

    for logger_name in ("uvicorn", "uvicorn.error"):
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.propagate = True
    logging.getLogger("uvicorn.access").disabled = True
    _configured = True
