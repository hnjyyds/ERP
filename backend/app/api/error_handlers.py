import logging
from typing import cast

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic_core import ErrorDetails
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import HTTPExceptionHandler

from app.core.logging import get_request_id
from app.core.messages import localize_message, status_message_key, translate
from app.core.status_codes import (
    AppStatusCode,
    get_status_definition,
    resolve_error_code,
    resolve_error_message,
)
from app.schemas.responses import ErrorResponse, ValidationIssue

_http_logger = logging.getLogger("app.http")

_MODULE_ENTITY_KEYS = {
    "finance.fee_payments": "entity.finance.fee_payments",
    "finance.misc_fees": "entity.finance.misc_fees",
    "finance.payments": "entity.finance.payments",
    "finance.port_data": "entity.finance.port_data",
    "finance.receipts": "entity.finance.receipts",
    "finance.reimbursements": "entity.finance.reimbursements",
    "finance.settlements": "entity.finance.settlements",
    "finance.tax_refunds": "entity.finance.tax_refunds",
    "followup": "entity.followup",
    "masterdata.customers": "entity.masterdata.customers",
    "masterdata.document_parties": "entity.masterdata.document_parties",
    "masterdata.partners": "entity.masterdata.partners",
    "masterdata.products": "entity.masterdata.products",
    "masterdata.suppliers": "entity.masterdata.suppliers",
    "purchase.contracts": "entity.purchase.contracts",
    "purchase.inquiries": "entity.purchase.inquiries",
    "purchase.invoice_notices": "entity.purchase.invoice_notices",
    "quality.inspections": "entity.quality.inspections",
    "sales.contracts": "entity.sales.contracts",
    "sales.quotations": "entity.sales.quotations",
    "sales.shipments": "entity.sales.shipments",
    "sample.deliveries": "entity.sample.deliveries",
    "sample.records": "entity.sample.records",
    "sample.requests": "entity.sample.requests",
    "system.company": "entity.system.company",
    "system.auth": "entity.system.auth",
    "system.dashboard": "entity.system.dashboard",
    "system.files": "entity.system.files",
    "system.mcp_settings": "entity.system.mcp_settings",
    "system.printing": "entity.system.printing",
    "warehouse.inbound_orders": "entity.warehouse.inbound_orders",
    "warehouse.inbound_plans": "entity.warehouse.inbound_plans",
    "warehouse.outbound_orders": "entity.warehouse.outbound_orders",
    "warehouse.outbound_plans": "entity.warehouse.outbound_plans",
}

_EXCEPTION_DEFAULT_KEYS = {
    "InvalidCredentialsError": "exception.InvalidCredentialsError",
    "InvalidTokenError": "exception.InvalidTokenError",
    "McpDisabledError": "exception.McpDisabledError",
    "OrganizationDepartmentNameTakenError": "exception.OrganizationDepartmentNameTakenError",
    "OrganizationDepartmentNotFoundError": "exception.OrganizationDepartmentNotFoundError",
    "OrganizationDepartmentInUseError": "exception.OrganizationDepartmentInUseError",
    "OrganizationDepartmentRequiredError": "exception.OrganizationDepartmentRequiredError",
    "OrganizationUsernameTakenError": "exception.OrganizationUsernameTakenError",
    "OrganizationSelfDeactivateError": "exception.OrganizationSelfDeactivateError",
    "OrganizationSelfDemoteError": "exception.OrganizationSelfDemoteError",
    "OrganizationRoleCodeTakenError": "exception.OrganizationRoleCodeTakenError",
    "OrganizationRoleNotFoundError": "exception.OrganizationRoleNotFoundError",
    "OrganizationRoleInUseError": "exception.OrganizationRoleInUseError",
    "OrganizationPermissionDeniedError": "exception.OrganizationPermissionDeniedError",
    "OrganizationUserNotFoundError": "exception.OrganizationUserNotFoundError",
    "SampleRecordAlreadyCreatedError": "exception.SampleRecordAlreadyCreatedError",
    "SampleStockError": "exception.SampleStockError",
}


def error_response_body(
    code: AppStatusCode,
    message: str | None = None,
    details: list[ValidationIssue] | None = None,
) -> dict[str, object]:
    definition = get_status_definition(code)
    final_message = message or translate(status_message_key(code.value))
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
        return translate("validation.required")
    if error_type == "string_too_short":
        minimum = context.get("min_length")
        if minimum == 1:
            return translate("validation.empty")
        return translate("validation.min_length", min=minimum)
    if error_type == "string_too_long":
        return translate("validation.max_length", max=context.get("max_length"))
    if error_type == "greater_than":
        return translate("validation.greater_than", value=context.get("gt"))
    if error_type == "greater_than_equal":
        return translate("validation.greater_than_equal", value=context.get("ge"))
    if error_type in {"decimal_parsing", "decimal_type", "float_parsing", "int_parsing"}:
        return translate("validation.number")
    if error_type in {"date_from_datetime_parsing", "date_type"}:
        return translate("validation.date")
    if error_type == "value_error":
        return localize_message(error["msg"].removeprefix("Value error, "))
    return translate("validation.format")


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
    code = resolve_error_code(exc.status_code, exc.detail)
    message = resolve_error_message(code, exc.detail)
    if exc.status_code >= 400:
        _http_logger.warning(
            "http exception",
            extra={
                "event": "http_exception",
                "request_id": get_request_id(),
                "method": request.method,
                "path": request.url.path,
                "status_code": exc.status_code,
                "detail": message,
                "error_type": code.value,
            },
        )
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


def domain_exception_definition(
    exc: Exception,
) -> tuple[AppStatusCode, str] | None:
    exception_type = type(exc)
    module_name = exception_type.__module__
    class_name = exception_type.__name__

    if isinstance(exc, ValueError):
        return (
            AppStatusCode.VALIDATION_ERROR,
            localize_message(str(exc).strip()) or translate("error.business_data_invalid"),
        )
    if not module_name.startswith(("app.modules.", "app.mcp.")) or not class_name.endswith("Error"):
        return None

    if class_name in {"InvalidCredentialsError", "InvalidTokenError"}:
        code = AppStatusCode.INVALID_CREDENTIALS
        if class_name == "InvalidTokenError":
            code = AppStatusCode.TOKEN_EXPIRED
    elif "PermissionDenied" in class_name:
        code = AppStatusCode.PERMISSION_DENIED
    elif class_name == "OrganizationReferenceNotFoundError":
        code = AppStatusCode.VALIDATION_ERROR
    elif "NotFound" in class_name:
        code = AppStatusCode.NOT_FOUND
    elif any(marker in class_name for marker in ("Taken", "InUse", "SelfDeactivate", "SelfDemote")):
        code = AppStatusCode.CONFLICT
    elif class_name == "McpDisabledError":
        code = AppStatusCode.SERVICE_UNAVAILABLE
    elif class_name in {
        "FileTooLargeError",
        "UnsupportedFileError",
        "InvalidFileError",
        "InvalidMcpCredentialError",
        "ImportFileError",
        "ProductImportInvalidError",
    }:
        code = AppStatusCode.BAD_REQUEST
    else:
        code = AppStatusCode.VALIDATION_ERROR

    default_key = _EXCEPTION_DEFAULT_KEYS.get(class_name)
    message = localize_message(str(exc).strip()) or (
        translate(default_key) if default_key else ""
    )
    if message:
        return code, message

    module_parts = module_name.removeprefix("app.modules.").split(".")
    entity_key = _MODULE_ENTITY_KEYS.get(
        ".".join(module_parts[:2]),
    ) or _MODULE_ENTITY_KEYS.get(module_parts[0])
    entity_label = translate(entity_key or "entity.fallback")
    if code == AppStatusCode.PERMISSION_DENIED:
        message = translate("error.permission_denied", entity=entity_label)
    elif code == AppStatusCode.NOT_FOUND:
        message = translate("error.not_found", entity=entity_label)
    elif code == AppStatusCode.CONFLICT:
        message = translate("error.conflict", entity=entity_label)
    else:
        message = translate("error.entity_invalid", entity=entity_label)
    return code, message


async def domain_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    domain_definition = domain_exception_definition(exc)
    if domain_definition is None:
        code = AppStatusCode.SERVER_ERROR
        _http_logger.exception(
            "unhandled application exception",
            exc_info=(type(exc), exc, exc.__traceback__),
            extra={
                "event": "unhandled_exception",
                "request_id": get_request_id(),
                "method": request.method,
                "path": request.url.path,
                "status_code": get_status_definition(code).http_status,
                "error_type": type(exc).__name__,
            },
        )
        message = translate(status_message_key(code.value))
    else:
        code, message = domain_definition
        _http_logger.warning(
            "domain exception",
            extra={
                "event": "domain_exception",
                "request_id": get_request_id(),
                "method": request.method,
                "path": request.url.path,
                "status_code": get_status_definition(code).http_status,
                "detail": message,
                "error_type": type(exc).__name__,
            },
        )
    definition = get_status_definition(code)
    return JSONResponse(
        status_code=definition.http_status,
        content=error_response_body(code, message),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(
        StarletteHTTPException,
        cast(HTTPExceptionHandler, http_exception_handler),
    )
    app.add_exception_handler(
        RequestValidationError,
        cast(HTTPExceptionHandler, request_validation_exception_handler),
    )
    app.add_exception_handler(
        Exception,
        domain_exception_handler,
    )
