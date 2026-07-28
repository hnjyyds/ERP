"""Request-scoped pagination values shared by API and repository layers."""

from contextvars import ContextVar, Token
from dataclasses import dataclass


@dataclass(frozen=True)
class Pagination:
    """Validated request pagination shared by list repositories."""

    limit: int | None
    offset: int


_pagination_context: ContextVar[Pagination | None] = ContextVar(
    "pagination_context",
    default=None,
)


def start_pagination_context(pagination: Pagination) -> Token[Pagination | None]:
    return _pagination_context.set(pagination)


def reset_pagination_context(token: Token[Pagination | None]) -> None:
    _pagination_context.reset(token)


def resolve_limit(fallback: int | None) -> int | None:
    pagination = _pagination_context.get()
    return pagination.limit if pagination is not None else fallback


def resolve_offset(fallback: int | None) -> int:
    pagination = _pagination_context.get()
    if pagination is not None:
        return pagination.offset
    return fallback or 0
