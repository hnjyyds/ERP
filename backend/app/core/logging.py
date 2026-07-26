import json
import logging
import re
from collections.abc import Mapping
from contextvars import ContextVar, Token
from datetime import UTC, datetime

REDACTED = "[REDACTED]"

_request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)
_user_id_context: ContextVar[str | None] = ContextVar("user_id", default=None)
_configured = False

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
    return _request_id_context.set(request_id), _user_id_context.set(None)


def reset_request_context(
    tokens: tuple[Token[str | None], Token[str | None]],
) -> None:
    request_id_token, user_id_token = tokens
    _user_id_context.reset(user_id_token)
    _request_id_context.reset(request_id_token)


def get_request_id() -> str | None:
    return _request_id_context.get()


def get_current_user_id() -> str | None:
    return _user_id_context.get()


def set_current_user_id(user_id: str) -> None:
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
    def format(self, record: logging.LogRecord) -> str:
        request_id = getattr(record, "request_id", None) or get_request_id() or "-"
        user_id = getattr(record, "user_id", None) or get_current_user_id() or "-"
        message = _redact_text(record.getMessage())
        rendered = f"{record.levelname} request_id={request_id} user_id={user_id} {message}"
        if record.exc_info:
            rendered = f"{rendered}\n{_redact_text(self.formatException(record.exc_info))}"
        return rendered


def configure_logging(*, level: str, format_name: str) -> None:
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
