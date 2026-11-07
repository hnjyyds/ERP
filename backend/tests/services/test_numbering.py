import re

import pytest
from sqlalchemy.exc import IntegrityError

from app.modules.system.numbering.errors import DocumentNumberConflictError
from app.modules.system.numbering.generator import (
    MAX_ATTEMPTS,
    RANDOM_ALPHABET,
    create_with_generated_code,
    generate_document_code,
)

CODE_PATTERN = re.compile(r"^XP-IN-[A-Z2-9]{6}$")


def _unique_violation() -> IntegrityError:
    return IntegrityError(
        "INSERT INTO warehouse_inbound_orders",
        {},
        Exception("UNIQUE constraint failed: warehouse_inbound_orders.code"),
    )


def test_generate_document_code_uses_prefix_and_confusable_free_alphabet() -> None:
    allowed = set(RANDOM_ALPHABET)
    codes = [generate_document_code("warehouse.inbound_order") for _ in range(200)]
    assert all(CODE_PATTERN.match(code) for code in codes)
    random_parts = [code.split("-", 2)[2] for code in codes]
    assert all(set(part) <= allowed for part in random_parts)
    assert not any(set(part) & set("0O1Il") for part in random_parts)


def test_generate_document_code_rejects_unregistered_document_type() -> None:
    with pytest.raises(KeyError):
        generate_document_code("warehouse.unknown_order")


async def test_create_with_generated_code_retries_after_unique_conflict() -> None:
    attempts: list[str] = []

    async def create(code: str) -> str:
        attempts.append(code)
        if len(attempts) == 1:
            raise _unique_violation()
        return code

    code = await create_with_generated_code("warehouse.inbound_order", create)

    assert len(attempts) == 2
    assert attempts[0] != attempts[1]
    assert code == attempts[1]


async def test_create_with_generated_code_propagates_other_integrity_errors() -> None:
    async def create(_: str) -> str:
        raise IntegrityError(
            "INSERT INTO warehouse_inbound_orders",
            {},
            Exception("NOT NULL constraint failed: warehouse_inbound_orders.plan_id"),
        )

    with pytest.raises(IntegrityError):
        await create_with_generated_code("warehouse.inbound_order", create)


async def test_create_with_generated_code_gives_up_after_max_attempts() -> None:
    attempts = 0

    async def create(_: str) -> str:
        nonlocal attempts
        attempts += 1
        raise _unique_violation()

    with pytest.raises(DocumentNumberConflictError):
        await create_with_generated_code("warehouse.inbound_order", create)

    assert attempts == MAX_ATTEMPTS
