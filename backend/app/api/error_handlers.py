from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.status_codes import (
    AppStatusCode,
    get_status_definition,
    resolve_error_code,
    resolve_error_message,
)


def error_response_body(code: AppStatusCode, message: str | None = None) -> dict[str, object]:
    definition = get_status_definition(code)
    final_message = message or definition.default_message
    error = {"code": definition.code.value, "message": final_message}
    return {
        "success": False,
        "code": definition.code.value,
        "message": final_message,
        "data": None,
        "error": error,
    }


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
    del request, exc
    definition = get_status_definition(AppStatusCode.VALIDATION_ERROR)
    return JSONResponse(
        status_code=definition.http_status,
        content=error_response_body(AppStatusCode.VALIDATION_ERROR),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
