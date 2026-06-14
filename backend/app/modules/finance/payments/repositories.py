from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.payments.models import (
    PaymentAllocation,
    PaymentRequest,
    SupplierInvoice,
)


@dataclass(frozen=True)
class SupplierInvoiceRow:
    id: str
    invoice_no: str
    invoice_date: date
    supplier_id: str | None
    supplier_name: str
    purchase_invoice_notice_id: str | None
    purchase_invoice_notice_code: str | None
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    total_amount: str
    paid_amount: str
    unpaid_amount: str
    currency: str
    due_date: date | None
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime


@dataclass(frozen=True)
class PaymentRequestRow:
    id: str
    request_no: str
    supplier_invoice_id: str
    supplier_invoice_no: str
    supplier_id: str | None
    supplier_name: str
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    payment_type: str
    request_date: date
    requested_amount: str
    approved_amount: str
    paid_amount: str
    currency: str
    status: str
    requester_user_id: str
    requester_user_name: str
    reviewer_name: str | None
    approved_at: date | None
    payment_account: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class PaymentAllocationRow:
    id: str
    payment_request_id: str
    supplier_invoice_id: str
    allocated_at: date
    amount: str
    currency: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class PayableRow:
    supplier_invoice_id: str
    invoice_no: str
    supplier_id: str | None
    supplier_name: str
    purchase_invoice_notice_id: str | None
    purchase_invoice_notice_code: str | None
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    currency: str
    total_amount: str
    paid_amount: str
    payable_amount: str
    due_date: date | None
    status: str


class PaymentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_supplier_invoice(
        self,
        *,
        invoice_no: str,
        invoice_date: date,
        supplier_id: str | None,
        supplier_name: str,
        purchase_invoice_notice_id: str | None,
        purchase_invoice_notice_code: str | None,
        purchase_contract_id: str | None,
        purchase_contract_no: str | None,
        total_amount: Decimal | str,
        currency: str,
        due_date: date | None,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> SupplierInvoiceRow:
        invoice = SupplierInvoice(
            invoice_no=invoice_no,
            invoice_date=invoice_date,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            purchase_invoice_notice_id=purchase_invoice_notice_id,
            purchase_invoice_notice_code=purchase_invoice_notice_code,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            total_amount=Decimal(str(total_amount)),
            paid_amount=Decimal("0"),
            currency=currency,
            due_date=due_date,
            status="unpaid",
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(invoice)
        await self.session.flush()
        return self._map_invoice(invoice)

    async def get_supplier_invoice(self, invoice_id: str) -> SupplierInvoiceRow | None:
        invoice = await self.session.get(SupplierInvoice, invoice_id)
        if invoice is None:
            return None
        return self._map_invoice(invoice)

    async def list_supplier_invoices(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        supplier_id: str | None = None,
        purchase_contract_no: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SupplierInvoiceRow], int]:
        statement = select(SupplierInvoice)
        count_statement = select(func.count()).select_from(SupplierInvoice)
        conditions = self._invoice_conditions(
            q=q,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_no=purchase_contract_no,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                SupplierInvoice.invoice_date.desc(),
                SupplierInvoice.invoice_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        invoices = await self._invoice_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_invoice(invoice) for invoice in invoices], int(total or 0)

    async def create_payment_request(
        self,
        *,
        request_no: str,
        invoice: SupplierInvoiceRow,
        payment_type: str,
        request_date: date,
        requested_amount: Decimal | str,
        currency: str,
        requester_user_id: str,
        requester_user_name: str,
        remark: str | None,
    ) -> PaymentRequestRow:
        request = PaymentRequest(
            request_no=request_no,
            supplier_invoice_id=invoice.id,
            supplier_invoice_no=invoice.invoice_no,
            supplier_id=invoice.supplier_id,
            supplier_name=invoice.supplier_name,
            purchase_contract_id=invoice.purchase_contract_id,
            purchase_contract_no=invoice.purchase_contract_no,
            payment_type=payment_type,
            request_date=request_date,
            requested_amount=Decimal(str(requested_amount)),
            approved_amount=Decimal("0"),
            paid_amount=Decimal("0"),
            currency=currency,
            status="submitted",
            requester_user_id=requester_user_id,
            requester_user_name=requester_user_name,
            remark=remark,
        )
        self.session.add(request)
        await self.session.flush()
        return self._map_request(request)

    async def get_payment_request(self, request_id: str) -> PaymentRequestRow | None:
        payment_request = await self.session.get(PaymentRequest, request_id)
        if payment_request is None:
            return None
        return self._map_request(payment_request)

    async def list_payment_requests(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        payment_type: str | None = None,
        supplier_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PaymentRequestRow], int]:
        statement = select(PaymentRequest)
        count_statement = select(func.count()).select_from(PaymentRequest)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    PaymentRequest.request_no.ilike(pattern),
                    PaymentRequest.supplier_invoice_no.ilike(pattern),
                    PaymentRequest.supplier_name.ilike(pattern),
                    PaymentRequest.purchase_contract_no.ilike(pattern),
                )
            )
        if status:
            conditions.append(PaymentRequest.status == status)
        if payment_type:
            conditions.append(PaymentRequest.payment_type == payment_type)
        if supplier_id:
            conditions.append(PaymentRequest.supplier_id == supplier_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(PaymentRequest.request_date.desc(), PaymentRequest.request_no.asc())
            .limit(limit)
            .offset(offset)
        )
        requests = await self._request_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_request(row) for row in requests], int(total or 0)

    async def approve_payment_request(
        self,
        *,
        request_id: str,
        approved_amount: Decimal | str,
        approved_at: date,
        reviewer_name: str,
        payment_account: str | None,
        remark: str | None,
    ) -> PaymentRequestRow | None:
        payment_request = await self.session.get(PaymentRequest, request_id)
        if payment_request is None:
            return None
        amount = Decimal(str(approved_amount))
        payment_request.approved_amount = amount
        payment_request.paid_amount = amount
        payment_request.status = "approved"
        payment_request.reviewer_name = reviewer_name
        payment_request.approved_at = approved_at
        payment_request.payment_account = payment_account
        if remark is not None:
            payment_request.remark = remark
        await self.session.flush()
        return self._map_request(payment_request)

    async def add_allocation(
        self,
        *,
        payment_request_id: str,
        supplier_invoice_id: str,
        allocated_at: date,
        amount: Decimal | str,
        currency: str,
        remark: str | None,
    ) -> PaymentAllocationRow:
        allocation = PaymentAllocation(
            payment_request_id=payment_request_id,
            supplier_invoice_id=supplier_invoice_id,
            allocated_at=allocated_at,
            amount=Decimal(str(amount)),
            currency=currency,
            remark=remark,
        )
        self.session.add(allocation)
        await self.session.flush()
        return self._map_allocation(allocation)

    async def refresh_supplier_invoice_status(
        self,
        invoice_id: str,
    ) -> SupplierInvoiceRow | None:
        invoice = await self.session.get(SupplierInvoice, invoice_id)
        if invoice is None:
            return None
        paid_amount = await self.session.scalar(
            select(func.sum(PaymentAllocation.amount)).where(
                PaymentAllocation.supplier_invoice_id == invoice_id
            )
        )
        invoice.paid_amount = Decimal(str(paid_amount or 0))
        if invoice.paid_amount >= invoice.total_amount:
            invoice.status = "paid"
        elif invoice.paid_amount > 0:
            invoice.status = "partial"
        else:
            invoice.status = "unpaid"
        await self.session.flush()
        return self._map_invoice(invoice)

    async def list_requests_for_invoice(
        self,
        invoice_id: str,
    ) -> list[PaymentRequestRow]:
        rows = await self.session.scalars(
            select(PaymentRequest)
            .where(PaymentRequest.supplier_invoice_id == invoice_id)
            .order_by(PaymentRequest.request_date.asc(), PaymentRequest.request_no.asc())
        )
        return [self._map_request(row) for row in rows]

    async def list_allocations_for_invoice(
        self,
        invoice_id: str,
    ) -> list[PaymentAllocationRow]:
        rows = await self.session.scalars(
            select(PaymentAllocation)
            .where(PaymentAllocation.supplier_invoice_id == invoice_id)
            .order_by(PaymentAllocation.allocated_at.asc(), PaymentAllocation.created_at.asc())
        )
        return [self._map_allocation(row) for row in rows]

    async def list_payables(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        supplier_id: str | None = None,
        purchase_contract_no: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PayableRow], int]:
        statement = select(SupplierInvoice)
        count_statement = select(func.count()).select_from(SupplierInvoice)
        conditions = self._invoice_conditions(
            q=q,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_no=purchase_contract_no,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(SupplierInvoice.due_date.asc(), SupplierInvoice.invoice_no.asc())
            .limit(limit)
            .offset(offset)
        )
        invoices = await self._invoice_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_payable(invoice) for invoice in invoices], int(total or 0)

    def _invoice_conditions(
        self,
        *,
        q: str | None,
        status: str | None,
        supplier_id: str | None,
        purchase_contract_no: str | None,
    ) -> list[object]:
        conditions: list[object] = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    SupplierInvoice.invoice_no.ilike(pattern),
                    SupplierInvoice.supplier_name.ilike(pattern),
                    SupplierInvoice.purchase_invoice_notice_code.ilike(pattern),
                    SupplierInvoice.purchase_contract_no.ilike(pattern),
                )
            )
        if status:
            conditions.append(SupplierInvoice.status == status)
        if supplier_id:
            conditions.append(SupplierInvoice.supplier_id == supplier_id)
        if purchase_contract_no:
            conditions.append(SupplierInvoice.purchase_contract_no == purchase_contract_no)
        return conditions

    async def _invoice_scalars(
        self,
        statement: Select[tuple[SupplierInvoice]],
    ) -> list[SupplierInvoice]:
        result = await self.session.scalars(statement)
        return list(result)

    async def _request_scalars(
        self,
        statement: Select[tuple[PaymentRequest]],
    ) -> list[PaymentRequest]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_invoice(self, invoice: SupplierInvoice) -> SupplierInvoiceRow:
        total_amount = self._decimal(invoice.total_amount)
        paid_amount = self._decimal(invoice.paid_amount)
        return SupplierInvoiceRow(
            id=invoice.id,
            invoice_no=invoice.invoice_no,
            invoice_date=invoice.invoice_date,
            supplier_id=invoice.supplier_id,
            supplier_name=invoice.supplier_name,
            purchase_invoice_notice_id=invoice.purchase_invoice_notice_id,
            purchase_invoice_notice_code=invoice.purchase_invoice_notice_code,
            purchase_contract_id=invoice.purchase_contract_id,
            purchase_contract_no=invoice.purchase_contract_no,
            total_amount=self._money(total_amount),
            paid_amount=self._money(paid_amount),
            unpaid_amount=self._money(max(total_amount - paid_amount, Decimal("0"))),
            currency=invoice.currency,
            due_date=invoice.due_date,
            status=invoice.status,
            remark=invoice.remark,
            created_by_user_id=invoice.created_by_user_id,
            created_by_user_name=invoice.created_by_user_name,
            created_at=invoice.created_at,
        )

    def _map_request(self, request: PaymentRequest) -> PaymentRequestRow:
        return PaymentRequestRow(
            id=request.id,
            request_no=request.request_no,
            supplier_invoice_id=request.supplier_invoice_id,
            supplier_invoice_no=request.supplier_invoice_no,
            supplier_id=request.supplier_id,
            supplier_name=request.supplier_name,
            purchase_contract_id=request.purchase_contract_id,
            purchase_contract_no=request.purchase_contract_no,
            payment_type=request.payment_type,
            request_date=request.request_date,
            requested_amount=self._money(request.requested_amount),
            approved_amount=self._money(request.approved_amount),
            paid_amount=self._money(request.paid_amount),
            currency=request.currency,
            status=request.status,
            requester_user_id=request.requester_user_id,
            requester_user_name=request.requester_user_name,
            reviewer_name=request.reviewer_name,
            approved_at=request.approved_at,
            payment_account=request.payment_account,
            remark=request.remark,
            created_at=request.created_at,
        )

    def _map_allocation(self, allocation: PaymentAllocation) -> PaymentAllocationRow:
        return PaymentAllocationRow(
            id=allocation.id,
            payment_request_id=allocation.payment_request_id,
            supplier_invoice_id=allocation.supplier_invoice_id,
            allocated_at=allocation.allocated_at,
            amount=self._money(allocation.amount),
            currency=allocation.currency,
            remark=allocation.remark,
            created_at=allocation.created_at,
        )

    def _map_payable(self, invoice: SupplierInvoice) -> PayableRow:
        total_amount = self._decimal(invoice.total_amount)
        paid_amount = self._decimal(invoice.paid_amount)
        return PayableRow(
            supplier_invoice_id=invoice.id,
            invoice_no=invoice.invoice_no,
            supplier_id=invoice.supplier_id,
            supplier_name=invoice.supplier_name,
            purchase_invoice_notice_id=invoice.purchase_invoice_notice_id,
            purchase_invoice_notice_code=invoice.purchase_invoice_notice_code,
            purchase_contract_id=invoice.purchase_contract_id,
            purchase_contract_no=invoice.purchase_contract_no,
            currency=invoice.currency,
            total_amount=self._money(total_amount),
            paid_amount=self._money(paid_amount),
            payable_amount=self._money(max(total_amount - paid_amount, Decimal("0"))),
            due_date=invoice.due_date,
            status=invoice.status,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
