from dataclasses import dataclass
from enum import StrEnum


class AppStatusCode(StrEnum):
    SUCCESS = "SUCCESS"
    CREATED = "CREATED"
    ACCEPTED = "ACCEPTED"
    NO_CONTENT = "NO_CONTENT"
    BAD_REQUEST = "BAD_REQUEST"
    MISSING_CREDENTIALS = "MISSING_CREDENTIALS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    UNAUTHORIZED = "UNAUTHORIZED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    CONFLICT = "CONFLICT"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    BUSINESS_ERROR = "BUSINESS_ERROR"
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS"
    SERVER_ERROR = "SERVER_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    GATEWAY_TIMEOUT = "GATEWAY_TIMEOUT"


@dataclass(frozen=True)
class StatusCodeDefinition:
    code: AppStatusCode
    http_status: int
    default_message: str
    description: str


STATUS_CODE_REGISTRY: dict[AppStatusCode, StatusCodeDefinition] = {
    AppStatusCode.SUCCESS: StatusCodeDefinition(
        code=AppStatusCode.SUCCESS,
        http_status=200,
        default_message="请求成功",
        description="通用成功响应，适用于查询、更新和删除等已完成的请求。",
    ),
    AppStatusCode.CREATED: StatusCodeDefinition(
        code=AppStatusCode.CREATED,
        http_status=201,
        default_message="创建成功",
        description="资源已成功创建，例如新增用户、单据、日程或业务资料。",
    ),
    AppStatusCode.ACCEPTED: StatusCodeDefinition(
        code=AppStatusCode.ACCEPTED,
        http_status=202,
        default_message="请求已接受",
        description="请求已被接收但尚未完成，适用于异步任务或后台处理流程。",
    ),
    AppStatusCode.NO_CONTENT: StatusCodeDefinition(
        code=AppStatusCode.NO_CONTENT,
        http_status=204,
        default_message="无返回内容",
        description="请求已成功处理且无需返回业务数据。",
    ),
    AppStatusCode.BAD_REQUEST: StatusCodeDefinition(
        code=AppStatusCode.BAD_REQUEST,
        http_status=400,
        default_message="请求参数错误",
        description="请求格式或基础参数不符合接口要求，服务端无法继续处理。",
    ),
    AppStatusCode.MISSING_CREDENTIALS: StatusCodeDefinition(
        code=AppStatusCode.MISSING_CREDENTIALS,
        http_status=401,
        default_message="缺少登录凭证",
        description="请求未携带 Bearer token 或 token 为空，需要先登录。",
    ),
    AppStatusCode.INVALID_CREDENTIALS: StatusCodeDefinition(
        code=AppStatusCode.INVALID_CREDENTIALS,
        http_status=401,
        default_message="用户名或密码错误",
        description="登录账号或密码不正确，不能返回更细的账号存在性信息。",
    ),
    AppStatusCode.TOKEN_EXPIRED: StatusCodeDefinition(
        code=AppStatusCode.TOKEN_EXPIRED,
        http_status=401,
        default_message="登录已失效",
        description="登录 token 无效、过期或无法解析，需要重新登录。",
    ),
    AppStatusCode.UNAUTHORIZED: StatusCodeDefinition(
        code=AppStatusCode.UNAUTHORIZED,
        http_status=401,
        default_message="未认证",
        description="通用未认证错误，适用于没有更具体认证原因的 401 响应。",
    ),
    AppStatusCode.PERMISSION_DENIED: StatusCodeDefinition(
        code=AppStatusCode.PERMISSION_DENIED,
        http_status=403,
        default_message="无权限执行该操作",
        description="用户已登录，但当前角色或权限不足以访问目标资源或操作。",
    ),
    AppStatusCode.NOT_FOUND: StatusCodeDefinition(
        code=AppStatusCode.NOT_FOUND,
        http_status=404,
        default_message="资源不存在",
        description="目标资源、业务单据、用户或配置不存在，或当前用户不可见。",
    ),
    AppStatusCode.METHOD_NOT_ALLOWED: StatusCodeDefinition(
        code=AppStatusCode.METHOD_NOT_ALLOWED,
        http_status=405,
        default_message="请求方法不允许",
        description="接口路径存在，但当前 HTTP 方法不被该接口支持。",
    ),
    AppStatusCode.CONFLICT: StatusCodeDefinition(
        code=AppStatusCode.CONFLICT,
        http_status=409,
        default_message="资源状态冲突",
        description="请求与当前业务状态冲突，例如用户名重复或不能操作当前账号。",
    ),
    AppStatusCode.VALIDATION_ERROR: StatusCodeDefinition(
        code=AppStatusCode.VALIDATION_ERROR,
        http_status=422,
        default_message="请求参数校验失败",
        description="请求体、路径参数或查询参数未通过 schema 校验。",
    ),
    AppStatusCode.BUSINESS_ERROR: StatusCodeDefinition(
        code=AppStatusCode.BUSINESS_ERROR,
        http_status=400,
        default_message="业务规则不满足",
        description="请求语义正确，但不满足当前业务规则或流程约束。",
    ),
    AppStatusCode.TOO_MANY_REQUESTS: StatusCodeDefinition(
        code=AppStatusCode.TOO_MANY_REQUESTS,
        http_status=429,
        default_message="请求过于频繁",
        description="请求频率超过系统限制，需要稍后重试。",
    ),
    AppStatusCode.SERVER_ERROR: StatusCodeDefinition(
        code=AppStatusCode.SERVER_ERROR,
        http_status=500,
        default_message="系统异常",
        description="服务端发生未预期异常，需要记录日志并由开发或运维排查。",
    ),
    AppStatusCode.SERVICE_UNAVAILABLE: StatusCodeDefinition(
        code=AppStatusCode.SERVICE_UNAVAILABLE,
        http_status=503,
        default_message="服务暂不可用",
        description="服务维护、依赖不可用或容量不足导致暂时无法处理请求。",
    ),
    AppStatusCode.GATEWAY_TIMEOUT: StatusCodeDefinition(
        code=AppStatusCode.GATEWAY_TIMEOUT,
        http_status=504,
        default_message="网关超时",
        description="上游或外部服务在限定时间内未响应。",
    ),
}


HTTP_STATUS_DEFAULT_CODES: dict[int, AppStatusCode] = {
    400: AppStatusCode.BAD_REQUEST,
    401: AppStatusCode.TOKEN_EXPIRED,
    403: AppStatusCode.PERMISSION_DENIED,
    404: AppStatusCode.NOT_FOUND,
    405: AppStatusCode.METHOD_NOT_ALLOWED,
    409: AppStatusCode.CONFLICT,
    422: AppStatusCode.VALIDATION_ERROR,
    429: AppStatusCode.TOO_MANY_REQUESTS,
    500: AppStatusCode.SERVER_ERROR,
    503: AppStatusCode.SERVICE_UNAVAILABLE,
    504: AppStatusCode.GATEWAY_TIMEOUT,
}


DETAIL_MESSAGE_CODES: dict[str, AppStatusCode] = {
    "缺少登录凭证": AppStatusCode.MISSING_CREDENTIALS,
    "用户名或密码错误": AppStatusCode.INVALID_CREDENTIALS,
    "登录已失效": AppStatusCode.TOKEN_EXPIRED,
}


def get_status_definition(code: AppStatusCode) -> StatusCodeDefinition:
    return STATUS_CODE_REGISTRY[code]


def resolve_error_code(http_status: int, detail: object | None = None) -> AppStatusCode:
    if isinstance(detail, str) and detail in DETAIL_MESSAGE_CODES:
        return DETAIL_MESSAGE_CODES[detail]
    return HTTP_STATUS_DEFAULT_CODES.get(http_status, AppStatusCode.SERVER_ERROR)


def resolve_error_message(code: AppStatusCode, detail: object | None = None) -> str:
    if isinstance(detail, str) and detail.strip():
        return detail.strip()
    return get_status_definition(code).default_message
