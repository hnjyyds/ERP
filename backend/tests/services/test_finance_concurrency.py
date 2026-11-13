"""资金并发一致性测试：用两个独立连接验证数据库条件更新。

这些用例直接操作仓储层，避免通过 HTTP 线程池打请求；两个 Session 各自持有
独立连接，指向同一个临时 SQLite 文件库。
"""

import asyncio
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.error_handlers import domain_exception_definition
from app.core.status_codes import AppStatusCode
from app.db.base import Base
from app.modules.finance.payments.models import PaymentRequest, SupplierInvoice
from app.modules.finance.payments.repositories import PaymentRepository
from app.modules.finance.payments.services import PaymentApprovalConflictError
from app.modules.finance.receipts.models import BankReceipt
from app.modules.finance.receipts.repositories import ReceiptRepository
from app.modules.finance.receipts.services import ReceiptAllocationConflictError


@pytest_asyncio.fixture
async def concurrency_factory(
    tmp_path: Path,
) -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'concurrency.db'}",
        future=True,
        connect_args={"timeout": 30},
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        yield factory
    finally:
        await engine.dispose()


def _receipt(receipt_no: str, amount: str) -> BankReceipt:
    return BankReceipt(
        receipt_no=receipt_no,
        received_at=date(2026, 8, 1),
        payer_name="并发测试客户",
        customer_id=None,
        customer_name=None,
        amount=Decimal(amount),
        allocated_amount=Decimal("0"),
        currency="USD",
        bank_account="BOC 6222 ****",
        reference_no=None,
        receipt_type="normal",
        status="claimed",
        claim_message="已认领",
        remark=None,
        created_by_user_id="u-finance",
        created_by_user_name="财务",
    )


def _invoice(invoice_no: str, total_amount: str) -> SupplierInvoice:
    return SupplierInvoice(
        invoice_no=invoice_no,
        invoice_date=date(2026, 9, 1),
        supplier_id=None,
        supplier_name="并发测试供应商",
        purchase_invoice_notice_id=None,
        purchase_invoice_notice_code=None,
        purchase_contract_id=None,
        purchase_contract_no=None,
        total_amount=Decimal(total_amount),
        paid_amount=Decimal("0"),
        currency="CNY",
        due_date=None,
        status="unpaid",
        remark=None,
        created_by_user_id="u-finance",
        created_by_user_name="财务",
    )


def _payment_request(
    request_no: str,
    invoice: SupplierInvoice,
    requested_amount: str,
) -> PaymentRequest:
    return PaymentRequest(
        request_no=request_no,
        supplier_invoice_id=invoice.id,
        supplier_invoice_no=invoice.invoice_no,
        supplier_id=None,
        supplier_name=invoice.supplier_name,
        purchase_contract_id=None,
        purchase_contract_no=None,
        payment_type="goods_payment",
        request_date=date(2026, 9, 10),
        requested_amount=Decimal(requested_amount),
        approved_amount=Decimal("0"),
        paid_amount=Decimal("0"),
        currency="CNY",
        status="submitted",
        requester_user_id="u-finance",
        requester_user_name="财务",
        reviewer_id="u-admin",
        reviewer_name=None,
        approved_at=None,
        payment_account=None,
        remark=None,
    )


async def test_concurrent_receipt_allocation_only_one_wins(
    concurrency_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with concurrency_factory() as session:
        receipt = _receipt("BR-CONCURRENT-001", "1000.00")
        session.add(receipt)
        await session.commit()
        receipt_id = receipt.id

    async def reserve() -> bool:
        async with concurrency_factory() as session:
            repository = ReceiptRepository(session)
            try:
                reserved = await repository.try_reserve_allocation(
                    receipt_id=receipt_id,
                    amount="600.00",
                )
                await session.commit()
                return reserved
            except Exception:
                await session.rollback()
                raise

    results = await asyncio.gather(reserve(), reserve())

    assert sorted(results) == [False, True]
    async with concurrency_factory() as session:
        stored = await session.get(BankReceipt, receipt_id)
        assert stored is not None
        assert stored.allocated_amount == Decimal("600.00")


async def test_receipt_allocation_accepts_exact_remaining_balance(
    concurrency_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with concurrency_factory() as session:
        receipt = _receipt("BR-CONCURRENT-002", "1000.00")
        session.add(receipt)
        await session.commit()
        receipt_id = receipt.id

    async with concurrency_factory() as session:
        repository = ReceiptRepository(session)
        assert await repository.try_reserve_allocation(
            receipt_id=receipt_id,
            amount="1000.00",
        )
        await session.commit()

    async with concurrency_factory() as session:
        repository = ReceiptRepository(session)
        assert not await repository.try_reserve_allocation(
            receipt_id=receipt_id,
            amount="0.01",
        )
        await session.rollback()


async def test_concurrent_payment_reserve_only_one_wins(
    concurrency_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with concurrency_factory() as session:
        invoice = _invoice("SI-CONCURRENT-001", "1000.00")
        session.add(invoice)
        await session.commit()
        invoice_id = invoice.id

    async def reserve() -> bool:
        async with concurrency_factory() as session:
            repository = PaymentRepository(session)
            try:
                reserved = await repository.try_reserve_payment(
                    invoice_id=invoice_id,
                    amount="600.00",
                )
                await session.commit()
                return reserved
            except Exception:
                await session.rollback()
                raise

    results = await asyncio.gather(reserve(), reserve())

    assert sorted(results) == [False, True]
    async with concurrency_factory() as session:
        stored = await session.get(SupplierInvoice, invoice_id)
        assert stored is not None
        assert stored.paid_amount == Decimal("600.00")


async def test_concurrent_payment_approval_only_one_wins(
    concurrency_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with concurrency_factory() as session:
        invoice = _invoice("SI-CONCURRENT-002", "1000.00")
        session.add(invoice)
        await session.flush()
        payment_request = _payment_request("PR-CONCURRENT-002", invoice, "1000.00")
        session.add(payment_request)
        await session.commit()
        request_id = payment_request.id

    async def approve() -> bool:
        async with concurrency_factory() as session:
            repository = PaymentRepository(session)
            try:
                approved = await repository.approve_payment_request(
                    request_id=request_id,
                    approved_amount="1000.00",
                    approved_at=date(2026, 9, 11),
                    reviewer_name="财务主管",
                    reviewer_id="u-admin",
                    payment_account="BOC 6222 ****",
                    remark=None,
                )
                await session.commit()
                return approved is not None
            except Exception:
                await session.rollback()
                raise

    results = await asyncio.gather(approve(), approve())

    assert sorted(results) == [False, True]
    async with concurrency_factory() as session:
        stored = await session.scalar(
            select(PaymentRequest).where(PaymentRequest.id == request_id)
        )
        assert stored is not None
        assert stored.status == "approved"
        assert stored.approved_amount == Decimal("1000.00")


def test_allocation_conflict_errors_map_to_http_409() -> None:
    mapping = domain_exception_definition(
        ReceiptAllocationConflictError("水单未分摊余额不足，请刷新后重试")
    )
    assert mapping is not None
    assert mapping[0] == AppStatusCode.CONFLICT

    mapping = domain_exception_definition(
        PaymentApprovalConflictError("供应商发票未付金额不足，请刷新后重试")
    )
    assert mapping is not None
    assert mapping[0] == AppStatusCode.CONFLICT
