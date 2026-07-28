"""HTTP pagination validation and OpenAPI documentation."""

from collections.abc import Sequence
from typing import cast

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.datastructures import QueryParams
from starlette.types import ASGIApp, Receive, Scope, Send

from app.api.error_handlers import error_response_body
from app.core.pagination import (
    Pagination,
    reset_pagination_context,
    start_pagination_context,
)
from app.core.status_codes import AppStatusCode, get_status_definition
from app.schemas.responses import ValidationIssue

_PAGINATED_RESPONSE_MARKERS = ("ListResponse", "QueryResponse")
_DEFAULT_LIMIT = 50


def _parse_integer(
    query: QueryParams,
    *,
    field: str,
    minimum: int,
    maximum: int | None = None,
) -> tuple[int | None, ValidationIssue | None]:
    raw = query.get(field)
    if raw is None or not raw.strip():
        return None, None
    try:
        value = int(raw)
    except ValueError:
        return None, ValidationIssue(
            field=field,
            message="请输入有效整数",
            type="int_parsing",
        )
    if value < minimum:
        return None, ValidationIssue(
            field=field,
            message=f"不能小于 {minimum}",
            type="greater_than_equal",
        )
    if maximum is not None and value > maximum:
        return None, ValidationIssue(
            field=field,
            message=f"不能大于 {maximum}",
            type="less_than_equal",
        )
    return value, None


class PaginationMiddleware:
    """Validate GET pagination once and expose it to repository queries."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("method") != "GET":
            await self.app(scope, receive, send)
            return

        query = QueryParams(scope.get("query_string", b"").decode("latin-1"))
        limit, limit_error = _parse_integer(
            query,
            field="limit",
            minimum=1,
            maximum=200,
        )
        offset_value, offset_error = _parse_integer(
            query,
            field="offset",
            minimum=0,
        )
        issues = [issue for issue in (limit_error, offset_error) if issue is not None]
        if issues:
            definition = get_status_definition(AppStatusCode.VALIDATION_ERROR)
            from fastapi.responses import JSONResponse

            response = JSONResponse(
                status_code=definition.http_status,
                content=error_response_body(
                    AppStatusCode.VALIDATION_ERROR,
                    details=issues,
                ),
            )
            await response(scope, receive, send)
            return

        token = start_pagination_context(
            Pagination(limit=limit or _DEFAULT_LIMIT, offset=offset_value or 0)
        )
        try:
            await self.app(scope, receive, send)
        finally:
            reset_pagination_context(token)


def _is_paginated_response(route: APIRoute) -> bool:
    response_model = getattr(route, "response_model", None)
    return response_model is not None and any(
        marker in str(response_model) for marker in _PAGINATED_RESPONSE_MARKERS
    )


def _api_routes(
    routes: Sequence[object],
    prefix: str = "",
) -> list[tuple[str, APIRoute]]:
    collected: list[tuple[str, APIRoute]] = []
    for route in routes:
        if isinstance(route, APIRoute):
            collected.append((f"{prefix}{route.path}", route))
            continue
        original_router = getattr(route, "original_router", None)
        include_context = getattr(route, "include_context", None)
        if original_router is None or include_context is None:
            continue
        collected.extend(
            _api_routes(
                original_router.routes,
                f"{prefix}{include_context.prefix}",
            )
        )
    return collected


def configure_pagination_openapi(app: FastAPI) -> None:
    """Document the middleware-owned query contract on list operations."""
    original_openapi = app.openapi

    def pagination_openapi() -> dict[str, object]:
        schema = original_openapi()
        paths = cast(dict[str, dict[str, object]], schema.get("paths", {}))
        for route_path, route in _api_routes(app.routes):
            if not _is_paginated_response(route):
                continue
            path_item = paths.get(route_path)
            if path_item is None:
                continue
            for method in route.methods or set():
                if method == "HEAD":
                    continue
                operation = cast(dict[str, object], path_item.get(method.lower(), {}))
                parameters = cast(list[dict[str, object]], operation.setdefault("parameters", []))
                existing = {
                    parameter.get("name")
                    for parameter in parameters
                    if parameter.get("in") == "query"
                }
                if "limit" not in existing:
                    parameters.append(
                        {
                            "name": "limit",
                            "in": "query",
                            "required": False,
                            "description": "每页数量；默认 50，最大 200",
                            "schema": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 200,
                                "default": _DEFAULT_LIMIT,
                            },
                        }
                    )
                if "offset" not in existing:
                    parameters.append(
                        {
                            "name": "offset",
                            "in": "query",
                            "required": False,
                            "description": "从第几条数据开始返回",
                            "schema": {
                                "type": "integer",
                                "minimum": 0,
                                "default": 0,
                            },
                        }
                    )
        return schema

    app.openapi = pagination_openapi  # type: ignore[method-assign]
