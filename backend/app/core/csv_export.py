"""CSV helpers that keep spreadsheet formulas as plain text."""

from typing import Any

_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def safe_cell(value: Any) -> Any:
    """把可能被表格软件当作公式解析的文本转义为普通文本。

    仅处理字符串：数值、日期等原样返回，避免合法负数被加上文本前缀。
    """

    if value is None:
        return ""
    if not isinstance(value, str):
        return value
    if value.startswith(_FORMULA_PREFIXES):
        return f"'{value}"
    return value
