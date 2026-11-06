"""MCP 对外文本固定英文：工具描述、字段说明与 ToolError。"""

import re

import pytest
from mcp.server.fastmcp.exceptions import ToolError

from app.mcp.crud_service import ConfirmationRequiredError
from app.mcp.server import _execute, mcp
from app.modules.masterdata.products.services import (
    PermissionDeniedError,
    ProductNotFoundError,
)

_CJK = re.compile(r"[\u4e00-\u9fff]")


def _schema_descriptions(schema: dict[str, object]) -> list[str]:
    descriptions: list[str] = []
    properties = schema.get("properties", {})
    if isinstance(properties, dict):
        for field_schema in properties.values():
            if isinstance(field_schema, dict):
                description = field_schema.get("description")
                if isinstance(description, str):
                    descriptions.append(description)
    # 嵌套 $defs 来自 REST Pydantic 模型，其描述属于 OpenAPI 开发者文档，
    # 不在 MCP 工具描述范围内。
    return descriptions


async def test_all_tool_text_is_english() -> None:
    texts = [mcp.instructions or ""]
    for tool in await mcp.list_tools():
        texts.append(tool.description or "")
        texts.extend(_schema_descriptions(tool.inputSchema))

    assert [text for text in texts if _CJK.search(text)] == []


async def test_permission_error_is_english() -> None:
    async def operation() -> None:
        raise PermissionDeniedError()

    with pytest.raises(ToolError) as error:
        await _execute(operation())

    assert str(error.value) == (
        "[PERMISSION_DENIED] The current account does not have permission "
        "to perform this operation"
    )


async def test_not_found_error_is_english() -> None:
    async def operation() -> None:
        raise ProductNotFoundError()

    with pytest.raises(ToolError) as error:
        await _execute(operation())

    assert str(error.value) == (
        "[NOT_FOUND] The requested record does not exist or is not visible "
        "to the current account"
    )


async def test_confirmation_error_is_english() -> None:
    async def operation() -> None:
        raise ConfirmationRequiredError("Delete operations require an explicit confirm=true")

    with pytest.raises(ToolError) as error:
        await _execute(operation())

    assert str(error.value) == (
        "[CONFIRMATION_REQUIRED] Delete operations require an explicit confirm=true"
    )


async def test_domain_value_error_is_translated() -> None:
    async def operation() -> None:
        raise ValueError("只有草稿合同可以提交")

    with pytest.raises(ToolError) as error:
        await _execute(operation())

    assert str(error.value) == "[INVALID_OPERATION] Only draft contracts can be submitted"
