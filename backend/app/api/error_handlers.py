from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic_core import ErrorDetails
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.status_codes import (
    AppStatusCode,
    get_status_definition,
    resolve_error_code,
    resolve_error_message,
)
from app.schemas.responses import ErrorResponse, ValidationIssue


def error_response_body(
    code: AppStatusCode,
    message: str | None = None,
    details: list[ValidationIssue] | None = None,
) -> dict[str, object]:
    definition = get_status_definition(code)
    final_message = message or definition.default_message
    error = ErrorResponse(
        code=definition.code.value,
        message=final_message,
        details=details,
    ).model_dump(mode="json", exclude_none=True)
    return {
        "success": False,
        "code": definition.code.value,
        "message": final_message,
        "data": None,
        "error": error,
    }


def _validation_field(error: ErrorDetails) -> str:
    location = [str(part) for part in error["loc"]]
    if location and location[0] in {"body", "path", "query"}:
        location = location[1:]
    return ".".join(location) or "request"


def _validation_message(error: ErrorDetails) -> str:
    error_type = error["type"]
    context = error.get("ctx") or {}
    if error_type == "missing":
        return "为必填项"
    if error_type == "string_too_short":
        minimum = context.get("min_length")
        return "不能为空" if minimum == 1 else f"至少填写 {minimum} 个字符"
    if error_type == "string_too_long":
        return f"不能超过 {context.get('max_length')} 个字符"
    if error_type == "greater_than":
        return f"必须大于 {context.get('gt')}"
    if error_type == "greater_than_equal":
        return f"不能小于 {context.get('ge')}"
    if error_type in {"decimal_parsing", "decimal_type", "float_parsing", "int_parsing"}:
        return "请输入有效数字"
    if error_type in {"date_from_datetime_parsing", "date_type"}:
        return "请输入有效日期"
    if error_type == "value_error":
        return error["msg"].removeprefix("Value error, ")
    return "格式不正确"


def _validation_issue(error: ErrorDetails) -> ValidationIssue:
    return ValidationIssue(
        field=_validation_field(error),
        message=_validation_message(error),
        type=error["type"],
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    del request
    code = resolve_error_code(exc.status_code, exc.detail)
    message = resolve_error_message(code, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response_body(code, message),
        headers=getattr(exc, "headers", None),
    )


async def request_validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    del request
    definition = get_status_definition(AppStatusCode.VALIDATION_ERROR)
    details = [_validation_issue(error) for error in exc.errors()]
    return JSONResponse(
        status_code=definition.http_status,
        content=error_response_body(AppStatusCode.VALIDATION_ERROR, details=details),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
