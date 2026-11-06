import ast
import re
from pathlib import Path

import pytest

from app.core.messages import localize_message
from app.core.source_messages import SOURCE_MESSAGES
from app.core.status_codes import DETAIL_MESSAGE_CODES

_APP_ROOT = Path(__file__).resolve().parents[2] / "app"
_CJK = re.compile(r"[\u4e00-\u9fff]")


def _user_visible_constants() -> dict[str, str]:
    """收集业务域直接抛出的中文文案及其首个出现位置。"""
    collected: dict[str, str] = {}
    for root in ("modules", "api"):
        for path in sorted((_APP_ROOT / root).rglob("*.py")):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            for node in ast.walk(tree):
                expressions: list[ast.expr] = []
                if isinstance(node, ast.Raise) and isinstance(node.exc, ast.Call):
                    expressions.extend(node.exc.args)
                    expressions.extend(
                        keyword.value
                        for keyword in node.exc.keywords
                        if keyword.arg in {"message", "detail"}
                    )
                elif isinstance(node, ast.Call):
                    function_name = getattr(node.func, "id", None) or getattr(
                        node.func, "attr", ""
                    )
                    if function_name.startswith("raise_"):
                        expressions.extend(node.args)
                        expressions.extend(
                            keyword.value
                            for keyword in node.keywords
                            if keyword.arg in {"detail", "fallback_detail"}
                        )
                    if function_name == "HTTPException":
                        expressions.extend(node.args)
                        expressions.extend(
                            keyword.value
                            for keyword in node.keywords
                            if keyword.arg in {"message", "detail"}
                        )
                    expressions.extend(
                        keyword.value
                        for keyword in node.keywords
                        if keyword.arg == "permission_error"
                    )
                for expression in expressions:
                    if not isinstance(expression, ast.Constant):
                        continue
                    if not isinstance(expression.value, str):
                        continue
                    if _CJK.search(expression.value):
                        collected.setdefault(expression.value, f"{path.name}:{node.lineno}")
    return collected


def test_static_domain_messages_have_english_translations() -> None:
    handled_by_status_code = set(DETAIL_MESSAGE_CODES)

    missing = {
        message: location
        for message, location in _user_visible_constants().items()
        if message not in SOURCE_MESSAGES and message not in handled_by_status_code
    }

    assert missing == {}


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("只有草稿合同可以提交", "Only draft contracts can be submitted"),
        ("QC 任务状态无效", "Invalid QC task status"),
        ("财务报表参数无效", "Invalid financial report parameters"),
        ("日程不存在", "Schedule not found"),
    ],
)
def test_static_messages_render_english(source: str, expected: str) -> None:
    assert localize_message(source, "en-US") == expected


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        (
            "缺少必填字段：商品编码、中文名称",
            "Missing required fields: 商品编码, 中文名称",
        ),
        (
            "税率 必须在 0 到 1（或 0%-100%）之间",
            "税率 must be between 0 and 1 (or 0%–100%)",
        ),
        (
            "字段校验失败：Input should be a valid string",
            "Field validation failed: Input should be a valid string",
        ),
        ("单价 不是有效数字", "单价 is not a valid number"),
        (
            "商品编码 P-001 未关联商品资料，请先选择商品后重试",
            "Product code P-001 is not linked to a product record; "
            "please select a product and try again",
        ),
        (
            "商品 P-001 缺少配件明细，无法生成采购合同",
            "Product P-001 has no accessory details; cannot generate the purchase contract",
        ),
        ("不能将自己设为审批人", "You cannot set yourself as the approver"),
        ("QC 负责人不存在或已停用", "QC owner does not exist or is disabled"),
        ("文件超过 10MB 限制", "File exceeds the 10MB limit"),
    ],
)
def test_dynamic_messages_render_english(source: str, expected: str) -> None:
    assert localize_message(source, "en-US") == expected


def test_unknown_and_english_messages_are_returned_unchanged() -> None:
    assert localize_message("这是一个新的业务提示", "en-US") == "这是一个新的业务提示"
    assert localize_message("Already English message", "en-US") == "Already English message"


def test_default_language_keeps_source_message() -> None:
    assert localize_message("只有草稿合同可以提交", "zh-CN") == "只有草稿合同可以提交"
    assert localize_message("只有草稿合同可以提交") == "只有草稿合同可以提交"


def test_unsupported_language_keeps_source_message() -> None:
    assert localize_message("只有草稿合同可以提交", "de-DE") == "只有草稿合同可以提交"
