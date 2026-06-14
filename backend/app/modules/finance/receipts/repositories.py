from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.receipts.models import BankReceipt, ReceiptAllocation, ReceiptClaim
from app.modules.sales.contracts.models import ExportContract


@dataclass(frozen=True)
class BankReceiptRow:
    id: str
    receipt_no: str
    received_at: date
    payer_name: str
    customer_id: str | None
    customer_name: str | None
    amount: str
    allocated_amount: str
    unallocated_amount: str
    currency: str
    bank_account: str
    reference_no: str | None
    receipt_type: str
    status: str
    claim_message: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime


@dataclass(frozen=True)
class ReceiptClaimRow:
    id: str
    receipt_id: str
    claimed_by_user_id: str
    claimed_by_user_name: str
    claimed_at: date
    note: str | None
    created_at: datetime


@dataclass(frozen=True)
class ReceiptAllocationRow:
    id: str
    receipt_id: str
    allocation_type: str
    contract_id: str | None
    contract_no: str | None
    invoice_no: str | None
    allocated_at: date
    amount: str
    currency: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ReceivableRow:
    contract_id: str
    contract_no: str
    customer_id: str | None
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    total_amount: str
    received_amount: str
    receivable_amount: str
    status: str


class ReceiptRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_receipt(
        self,
        *,
        receipt_no: str,
        received_at: date,
        payer_name: str,
        customer_id: str | None,
        customer_name: str | None,
        amount: Decimal | str,
        currency: str,
        bank_account: str,
        reference_no: str | None,
        receipt_type: str,
        claim_message: str,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> BankReceiptRow:
        receipt = BankReceipt(
            receipt_no=receipt_no,
            received_at=received_at,
            payer_name=payer_name,
            customer_id=customer_id,
            customer_name=customer_name,
            amount=Decimal(str(amount)),
            allocated_amount=Decimal("0"),
            currency=currency,
            bank_account=bank_account,
            reference_no=reference_no,
            receipt_type=receipt_type,
            status="unclaimed",
            claim_message=claim_message,
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(receipt)
        await self.session.flush()
        return self._map_receipt(receipt)

    async def get_receipt(self, receipt_id: str) -> BankReceiptRow | None:
        receipt = await self.session.get(BankReceipt, receipt_id)
        if receipt is None:
            return None
        return self._map_receipt(receipt)

    async def list_receipts(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        customer_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[BankReceiptRow], int]:
        statement = select(BankReceipt)
        count_statement = select(func.count()).select_from(BankReceipt)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    BankReceipt.receipt_no.ilike(pattern),
                    BankReceipt.payer_name.ilike(pattern),
                    BankReceipt.customer_name.ilike(pattern),
                    BankReceipt.reference_no.ilike(pattern),
                )
            )
        if status:
            conditions.append(BankReceipt.status == status)
        if customer_id:
            conditions.append(BankReceipt.customer_id == customer_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(BankReceipt.received_at.desc(), BankReceipt.receipt_no.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_receipt(row) for row in rows], int(total or 0)

    async def add_claim(
        self,
        *,
        receipt_id: str,
        claimed_by_user_id: str,
        claimed_by_user_name: str,
        claimed_at: date,
        note: str | None,
    ) -> ReceiptClaimRow:
        claim = ReceiptClaim(
            receipt_id=receipt_id,
            claimed_by_user_id=claimed_by_user_id,
            claimed_by_user_name=claimed_by_user_name,
            claimed_at=claimed_at,
            note=note,
        )
        self.session.add(claim)
        receipt = await self.session.get(BankReceipt, receipt_id)
        if receipt is not None and receipt.status == "unclaimed":
            receipt.status = "claimed"
        await self.session.flush()
        return self._map_claim(claim)

    async def add_allocation(
        self,
        *,
        receipt_id: str,
        allocation_type: str,
        contract_id: str | None,
        contract_no: str | None,
        invoice_no: str | None,
        allocated_at: date,
        amount: Decimal | str,
        currency: str,
        remark: str | None,
    ) -> ReceiptAllocationRow:
        allocation = ReceiptAllocation(
            receipt_id=receipt_id,
            allocation_type=allocation_type,
            contract_id=contract_id,
            contract_no=contract_no,
            invoice_no=invoice_no,
            allocated_at=allocated_at,
            amount=Decimal(str(amount)),
            currency=currency,
            remark=remark,
        )
        self.session.add(allocation)
        await self.session.flush()
        return self._map_allocation(allocation)

    async def refresh_receipt_status(self, receipt_id: str) -> BankReceiptRow | None:
        receipt = await self.session.get(BankReceipt, receipt_id)
        if receipt is None:
            return None
        allocated_amount = await self.session.scalar(
            select(func.sum(ReceiptAllocation.amount)).where(
                ReceiptAllocation.receipt_id == receipt_id
            )
        )
        claim_count = await self.session.scalar(
            select(func.count(ReceiptClaim.id)).where(ReceiptClaim.receipt_id == receipt_id)
        )
        receipt.allocated_amount = Decimal(str(allocated_amount or 0))
        if receipt.allocated_amount >= receipt.amount:
            receipt.status = "allocated"
        elif receipt.allocated_amount > 0:
            receipt.status = "partially_allocated"
        elif int(claim_count or 0) > 0:
            receipt.status = "claimed"
        else:
            receipt.status = "unclaimed"
        await self.session.flush()
        return self._map_receipt(receipt)

    async def list_claims(self, receipt_id: str) -> list[ReceiptClaimRow]:
        rows = await self.session.scalars(
            select(ReceiptClaim)
            .where(ReceiptClaim.receipt_id == receipt_id)
            .order_by(ReceiptClaim.claimed_at.asc(), ReceiptClaim.created_at.asc())
        )
        return [self._map_claim(row) for row in rows]

    async def list_allocations(self, receipt_id: str) -> list[ReceiptAllocationRow]:
        rows = await self.session.scalars(
            select(ReceiptAllocation)
            .where(ReceiptAllocation.receipt_id == receipt_id)
            .order_by(ReceiptAllocation.allocated_at.asc(), ReceiptAllocation.created_at.asc())
        )
        return [self._map_allocation(row) for row in rows]

    async def list_receivables(
        self,
        *,
        q: str | None = None,
        customer_id: str | None = None,
        sales_user_id: str | None = None,
        contract_no: str | None = None,
        invoice_no: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ReceivableRow], int]:
        allocation_totals = (
            select(
                ReceiptAllocation.contract_id.label("contract_id"),
                func.sum(ReceiptAllocation.amount).label("received_amount"),
            )
            .where(ReceiptAllocation.contract_id.is_not(None))
            .group_by(ReceiptAllocation.contract_id)
            .subquery()
        )
        statement = select(
            ExportContract,
            func.coalesce(allocation_totals.c.received_amount, 0),
        ).outerjoin(allocation_totals, allocation_totals.c.contract_id == ExportContract.id)
        count_statement = select(func.count()).select_from(ExportContract)
        conditions = [ExportContract.approval_status == "approved"]
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    ExportContract.code.ilike(pattern),
                    ExportContract.customer_name.ilike(pattern),
                    ExportContract.source_quotation_no.ilike(pattern),
                )
            )
        if customer_id:
            conditions.append(ExportContract.customer_id == customer_id)
        if sales_user_id:
            conditions.append(ExportContract.sales_user_id == sales_user_id)
        if contract_no:
            conditions.append(ExportContract.code == contract_no)
        if invoice_no:
            invoice_exists = (
                select(ReceiptAllocation.id)
                .where(ReceiptAllocation.contract_id == ExportContract.id)
                .where(ReceiptAllocation.invoice_no == invoice_no)
                .exists()
            )
            conditions.append(invoice_exists)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(ExportContract.contract_date.desc(), ExportContract.code.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(statement)
        total = await self.session.scalar(count_statement)
        return [
            self._map_receivable(contract, self._decimal(received_amount))
            for contract, received_amount in result.all()
        ], int(total or 0)

    async def _scalars(self, statement: Select[tuple[BankReceipt]]) -> list[BankReceipt]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_receipt(self, receipt: BankReceipt) -> BankReceiptRow:
        allocated_amount = self._decimal(receipt.allocated_amount)
        amount = self._decimal(receipt.amount)
        return BankReceiptRow(
            id=receipt.id,
            receipt_no=receipt.receipt_no,
            received_at=receipt.received_at,
            payer_name=receipt.payer_name,
            customer_id=receipt.customer_id,
            customer_name=receipt.customer_name,
            amount=self._money(amount),
            allocated_amount=self._money(allocated_amount),
            unallocated_amount=self._money(max(amount - allocated_amount, Decimal("0"))),
            currency=receipt.currency,
            bank_account=receipt.bank_account,
            reference_no=receipt.reference_no,
            receipt_type=receipt.receipt_type,
            status=receipt.status,
            claim_message=receipt.claim_message,
            remark=receipt.remark,
            created_by_user_id=receipt.created_by_user_id,
            created_by_user_name=receipt.created_by_user_name,
            created_at=receipt.created_at,
        )

    def _map_claim(self, claim: ReceiptClaim) -> ReceiptClaimRow:
        return ReceiptClaimRow(
            id=claim.id,
            receipt_id=claim.receipt_id,
            claimed_by_user_id=claim.claimed_by_user_id,
            claimed_by_user_name=claim.claimed_by_user_name,
            claimed_at=claim.claimed_at,
            note=claim.note,
            created_at=claim.created_at,
        )

    def _map_allocation(self, allocation: ReceiptAllocation) -> ReceiptAllocationRow:
        return ReceiptAllocationRow(
            id=allocation.id,
            receipt_id=allocation.receipt_id,
            allocation_type=allocation.allocation_type,
            contract_id=allocation.contract_id,
            contract_no=allocation.contract_no,
            invoice_no=allocation.invoice_no,
            allocated_at=allocation.allocated_at,
            amount=self._money(allocation.amount),
            currency=allocation.currency,
            remark=allocation.remark,
            created_at=allocation.created_at,
        )

    def _map_receivable(
        self,
        contract: ExportContract,
        received_amount: Decimal,
    ) -> ReceivableRow:
        total_amount = self._decimal(contract.total_amount)
        receivable_amount = max(total_amount - received_amount, Decimal("0"))
        status = "unpaid"
        if receivable_amount == 0:
            status = "settled"
        elif received_amount > 0:
            status = "partial"
        return ReceivableRow(
            contract_id=contract.id,
            contract_no=contract.code,
            customer_id=contract.customer_id,
            customer_name=contract.customer_name,
            sales_user_id=contract.sales_user_id,
            sales_user_name=contract.sales_user_name,
            currency=contract.currency,
            total_amount=self._money(total_amount),
            received_amount=self._money(received_amount),
            receivable_amount=self._money(receivable_amount),
            status=status,
        )

    def _money(self, value: Decimal | int | str) -> str:
        return f"{self._decimal(value):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
