from app.core.status_codes import (
    HTTP_STATUS_DEFAULT_CODES,
    STATUS_CODE_REGISTRY,
    AppStatusCode,
    resolve_error_code,
)


def test_status_code_registry_documents_required_codes() -> None:
    required_codes = {
        AppStatusCode.SUCCESS,
        AppStatusCode.CREATED,
        AppStatusCode.BAD_REQUEST,
        AppStatusCode.MISSING_CREDENTIALS,
        AppStatusCode.INVALID_CREDENTIALS,
        AppStatusCode.TOKEN_EXPIRED,
        AppStatusCode.PERMISSION_DENIED,
        AppStatusCode.NOT_FOUND,
        AppStatusCode.CONFLICT,
        AppStatusCode.VALIDATION_ERROR,
        AppStatusCode.BUSINESS_ERROR,
        AppStatusCode.SERVER_ERROR,
    }

    assert required_codes.issubset(set(STATUS_CODE_REGISTRY))
    for code, definition in STATUS_CODE_REGISTRY.items():
        assert definition.code == code
        assert definition.http_status >= 100
        assert definition.default_message
        assert definition.description


def test_http_status_and_detail_resolve_to_stable_error_codes() -> None:
    assert HTTP_STATUS_DEFAULT_CODES[401] == AppStatusCode.TOKEN_EXPIRED
    assert resolve_error_code(401, "缺少登录凭证") == AppStatusCode.MISSING_CREDENTIALS
    assert resolve_error_code(401, "用户名或密码错误") == AppStatusCode.INVALID_CREDENTIALS
    assert resolve_error_code(403, "缺少组织管理权限") == AppStatusCode.PERMISSION_DENIED
    assert resolve_error_code(404, "用户不存在") == AppStatusCode.NOT_FOUND
    assert resolve_error_code(409, "用户名已存在") == AppStatusCode.CONFLICT
    assert resolve_error_code(422, "部门或角色不存在") == AppStatusCode.VALIDATION_ERROR
