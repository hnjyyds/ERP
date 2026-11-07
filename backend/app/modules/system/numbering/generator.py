"""内部单据编号生成：前缀 + 随机段，唯一性由数据库约束兜底。

不先查后插：查询与插入之间存在竞态，唯一约束才是唯一性来源。
冲突时整笔事务回滚后用新随机段重试，超过上限抛 ``DocumentNumberConflictError``。
"""

import secrets
from collections.abc import Awaitable, Callable

from sqlalchemy.exc import IntegrityError

from app.modules.system.numbering.errors import DocumentNumberConflictError

# 排除易混淆字符：0/O、1/I/l；字母统一大写。
RANDOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
RANDOM_LENGTH = 6
MAX_ATTEMPTS = 3

# 未注册的单据类型直接报错，避免各页面自行拼前缀。
DOCUMENT_PREFIXES: dict[str, str] = {
    "warehouse.inbound_order": "XP-IN",
    "warehouse.outbound_order": "XP-OUT",
    "purchase.inquiry": "PI",
    "purchase.contract": "PC",
    "sales.quotation": "QT",
    "sales.contract": "EC",
    "sales.shipment": "SP",
    "sample.request": "SR",
    "sample.record": "SM",
    "sample.delivery": "SD",
    "quality.inspection": "QC",
    "quality.reinspection": "QC-R",
}


def generate_document_code(doc_type: str) -> str:
    prefix = DOCUMENT_PREFIXES.get(doc_type)
    if prefix is None:
        raise KeyError(f"unregistered document type: {doc_type}")
    random_part = "".join(secrets.choice(RANDOM_ALPHABET) for _ in range(RANDOM_LENGTH))
    return f"{prefix}-{random_part}"


def _is_unique_violation(exc: IntegrityError) -> bool:
    message = str(getattr(exc, "orig", exc)).lower()
    return "unique" in message or "duplicate" in message


async def create_with_generated_code[T](
    doc_type: str,
    create: Callable[[str], Awaitable[T]],
) -> T:
    """用随机号调用 ``create``；唯一冲突时回滚重试，其他完整性错误原样抛出。

    ``create`` 内部负责开启事务：异常向上抛出时由 UnitOfWork 回滚，
    这样下一次重试从干净的事务开始。
    """
    failure: IntegrityError | None = None
    for _ in range(MAX_ATTEMPTS):
        try:
            return await create(generate_document_code(doc_type))
        except IntegrityError as exc:
            if not _is_unique_violation(exc):
                raise
            failure = exc
    raise DocumentNumberConflictError from failure
