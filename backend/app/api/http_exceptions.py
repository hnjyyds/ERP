from typing import NoReturn

from fastapi import HTTPException, status


def raise_bad_request(detail: str, *, cause: BaseException | None = None) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail,
    ) from cause


def raise_unauthorized(detail: str = "登录已失效") -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
    ) from None


def raise_permission_denied(detail: str) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail,
    ) from None


def raise_not_found(detail: str, *, cause: BaseException | None = None) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=detail,
    ) from cause


def raise_conflict(detail: str, *, cause: BaseException | None = None) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail,
    ) from cause


def raise_unprocessable(detail: str, *, cause: BaseException | None = None) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=detail,
    ) from cause


def raise_business_validation(
    exc: ValueError,
    *,
    fallback_detail: str = "业务数据无效",
) -> NoReturn:
    """把服务层业务校验错误稳定映射为可理解的 422 响应。"""
    detail = str(exc).strip() or fallback_detail
    raise_unprocessable(detail, cause=exc)
