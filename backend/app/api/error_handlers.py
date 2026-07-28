import logging
from typing import cast

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic_core import ErrorDetails
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import HTTPExceptionHandler

from app.core.logging import get_request_id
from app.core.status_codes import (
    AppStatusCode,
    get_status_definition,
    resolve_error_code,
    resolve_error_message,
)
from app.schemas.responses import ErrorResponse, ValidationIssue

_http_logger = logging.getLogger("app.http")

_MODULE_ENTITY_LABELS = {
    "finance.fee_payments": "合作方费用付款",
    "finance.misc_fees": "杂费",
    "finance.payments": "付款",
    "finance.port_data": "口岸数据",
    "finance.receipts": "收款",
    "finance.reimbursements": "报销单",
    "finance.settlements": "财务结算",
    "finance.tax_refunds": "退税单据",
    "followup": "跟单任务",
    "masterdata.customers": "客户",
    "masterdata.document_parties": "单证主体",
    "masterdata.partners": "合作方",
    "masterdata.products": "商品",
    "masterdata.suppliers": "供应商",
    "purchase.contracts": "采购合同",
    "purchase.inquiries": "采购询价",
    "purchase.invoice_notices": "采购开票通知",
    "quality.inspections": "QC 任务",
    "sales.contracts": "出口合同",
    "sales.quotations": "出口报价",
    "sales.shipments": "出运计划",
    "sample.deliveries": "寄样单",
    "sample.records": "样品登记",
    "sample.requests": "寄样申请",
    "system.company": "公司信息",
    "system.auth": "组织管理",
    "system.dashboard": "工作台任务",
    "system.files": "文件",
    "system.mcp_settings": "MCP 配置",
    "system.printing": "打印单据",
    "warehouse.inbound_orders": "入库单",
    "warehouse.inbound_plans": "入库计划",
    "warehouse.outbound_orders": "出库单",
    "warehouse.outbound_plans": "出库计划",
}

_EXCEPTION_DEFAULT_MESSAGES = {
    "InvalidCredentialsError": "用户名或密码错误",
    "InvalidTokenError": "登录已失效",
    "McpDisabledError": "MCP 服务未启用",
    "OrganizationDepartmentNameTakenError": "部门名称已存在",
    "OrganizationDepartmentNotFoundError": "部门不存在",
    "OrganizationDepartmentInUseError": "部门下已有用户，不能删除",
    "OrganizationDepartmentRequiredError": "用户必须关联部门",
    "OrganizationUsernameTakenError": "用户名已存在",
    "OrganizationSelfDeactivateError": "不能停用当前登录账号",
    "OrganizationSelfDemoteError": "不能移除当前账号的管理权限",
    "OrganizationRoleCodeTakenError": "角色编码已存在",
    "OrganizationRoleNotFoundError": "角色不存在",
    "OrganizationRoleInUseError": "角色下已有用户，不能删除",
    "OrganizationPermissionDeniedError": "缺少组织管理权限",
    "OrganizationUserNotFoundError": "用户不存在",
    "SampleRecordAlreadyCreatedError": "该寄样申请已生成样品登记，不能重复生成",
    "SampleStockError": "样品库存不足",
}


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
            str(exc).strip() or "业务数据无效",
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

    message = str(exc).strip() or _EXCEPTION_DEFAULT_MESSAGES.get(class_name, "")
    if message:
        return code, message

    module_parts = module_name.removeprefix("app.modules.").split(".")
    module_key = ".".join(module_parts[:2])
    entity_label = _MODULE_ENTITY_LABELS.get(module_key, "业务资源")
    if code == AppStatusCode.PERMISSION_DENIED:
        message = f"缺少{entity_label}权限"
    elif code == AppStatusCode.NOT_FOUND:
        message = f"{entity_label}不存在"
    elif code == AppStatusCode.CONFLICT:
        message = f"{entity_label}状态冲突"
    else:
        message = f"{entity_label}数据无效"
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
        message = get_status_definition(code).default_message
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
