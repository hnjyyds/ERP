"""Shared text validators for request schemas.

保持与具体业务模块解耦，供商品、供应商等模块复用，避免逐模块复制去空白逻辑。
"""

from typing import Any


def normalize_required_text(value: Any) -> Any:
    """去除首尾空白；若结果为空则抛出校验错误。"""

    if not isinstance(value, str):
        return value
    normalized = value.strip()
    if not normalized:
        raise ValueError("不能为空或仅包含空白字符")
    return normalized


def normalize_optional_text(value: Any) -> Any:
    """去除首尾空白，空白字符串归一为 ``None``。"""

    if not isinstance(value, str):
        return value
    normalized = value.strip()
    return normalized or None
