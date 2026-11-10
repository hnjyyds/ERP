"""动态文案模板（从 source_messages 拆出以守住单文件行数）。"""

import re

# 动态文案模板：仅在静态匹配未命中后使用，保持顺序稳定。
DYNAMIC_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(r"^出口合同存在下游单据，不能作废：(?P<reasons>.+)$"),
        "The export contract has downstream documents and cannot be cancelled: {reasons}",
    ),
    (
        re.compile(r"^采购合同存在下游单据，不能作废：(?P<reasons>.+)$"),
        "The purchase contract has downstream documents and cannot be cancelled: {reasons}",
    ),
    (
        re.compile(r"^该出口合同已重开为 (?P<code>.+)，不能重复重开$"),
        "This export contract has already been reissued as {code}",
    ),
    (
        re.compile(r"^该采购合同已重开为 (?P<code>.+)，不能重复重开$"),
        "This purchase contract has already been reissued as {code}",
    ),
    (re.compile(r"^缺少必填字段：(?P<fields>.+)$"), "Missing required fields: {fields}"),
    (
        re.compile(r"^(?P<field>\S+) 必须在 0 到 1（或 0%-100%）之间$"),
        "{field} must be between 0 and 1 (or 0%–100%)",
    ),
    (re.compile(r"^字段校验失败：(?P<detail>.+)$"), "Field validation failed: {detail}"),
    (re.compile(r"^(?P<field>\S+) 不是有效数字$"), "{field} is not a valid number"),
    (
        re.compile(r"^商品编码 (?P<code>.+) 未关联商品资料，请先选择商品后重试$"),
        "Product code {code} is not linked to a product record; "
        "please select a product and try again",
    ),
    (
        re.compile(r"^商品 (?P<reference>.+) 缺少配件明细，无法生成采购合同$"),
        "Product {reference} has no accessory details; cannot generate the purchase contract",
    ),
    (
        re.compile(r"^合同 (?P<code>.+) 的明细已删除，无法重新同步$"),
        "The contract {code} line was deleted; cannot resync",
    ),
    (re.compile(r"^不能将自己设为(?P<role>.+)$"), "You cannot set yourself as the {role}"),
    (re.compile(r"^(?P<role>.+)不存在或已停用$"), "{role} does not exist or is disabled"),
    (re.compile(r"^文件超过 (?P<size>\d+)MB 限制$"), "File exceeds the {size}MB limit"),
]
