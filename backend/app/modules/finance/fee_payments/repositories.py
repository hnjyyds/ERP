from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.fee_payments.models import (
    FeePaymentAllocation,
    FeePaymentRequest,
    PartnerFeeInvoice,
)


@dataclass(frozen=True)
class PartnerFeeInvoiceRow:
    id: str
    invoice_no: str
    invoice_date: date
    partner_id: str | None
    partner_name: str
    partner_type: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    fee_type: str
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
class FeePaymentRequestRow:
    id: str
    request_no: str
    partner_fee_invoice_id: str
    partner_fee_invoice_no: str
    partner_id: str | None
    partner_name: str
    partner_type: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    fee_type: str
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
class FeePaymentAllocationRow:
    id: str
    fee_payment_request_id: str
    partner_fee_invoice_id: str
    allocated_at: date
    amount: str
    currency: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class FeePayableRow:
    partner_fee_invoice_id: str
    invoice_no: str
    partner_id: str | None
    partner_name: str
    partner_type: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    fee_type: str
    currency: str
    total_amount: str
    paid_amount: str
    payable_amount: str
    due_date: date | None
    status: str


class FeePaymentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_partner_fee_invoice(
        self,
        *,
        invoice_no: str,
        invoice_date: date,
        partner_id: str | None,
        partner_name: str,
        partner_type: str | None,
        shipment_plan_id: str | None,
        shipment_no: str | None,
        sales_user_id: str | None,
        sales_user_name: str | None,
        fee_type: str,
        total_amount: Decimal | str,
        currency: str,
        due_date: date | None,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> PartnerFeeInvoiceRow:
        invoice = PartnerFeeInvoice(
            invoice_no=invoice_no,
            invoice_date=invoice_date,
            partner_id=partner_id,
            partner_name=partner_name,
            partner_type=partner_type,
            shipment_plan_id=shipment_plan_id,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            sales_user_name=sales_user_name,
            fee_type=fee_type,
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

    async def get_partner_fee_invoice(self, invoice_id: str) -> PartnerFeeInvoiceRow | None:
        invoice = await self.session.get(PartnerFeeInvoice, invoice_id)
        if invoice is None:
            return None
        return self._map_invoice(invoice)

    async def list_partner_fee_invoices(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        fee_type: str | None = None,
        partner_id: str | None = None,
        sales_user_id: str | None = None,
        shipment_no: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PartnerFeeInvoiceRow], int]:
        statement = select(PartnerFeeInvoice)
        count_statement = select(func.count()).select_from(PartnerFeeInvoice)
        conditions = self._invoice_conditions(
            q=q,
            status=status,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                PartnerFeeInvoice.invoice_date.desc(),
                PartnerFeeInvoice.invoice_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        invoices = await self._invoice_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_invoice(invoice) for invoice in invoices], int(total or 0)

    async def create_fee_payment_request(
        self,
        *,
        request_no: str,
        invoice: PartnerFeeInvoiceRow,
        request_date: date,
        requested_amount: Decimal | str,
        currency: str,
        requester_user_id: str,
        requester_user_name: str,
        remark: str | None,
    ) -> FeePaymentRequestRow:
        request = FeePaymentRequest(
            request_no=request_no,
            partner_fee_invoice_id=invoice.id,
            partner_fee_invoice_no=invoice.invoice_no,
            partner_id=invoice.partner_id,
            partner_name=invoice.partner_name,
            partner_type=invoice.partner_type,
            shipment_plan_id=invoice.shipment_plan_id,
            shipment_no=invoice.shipment_no,
            sales_user_id=invoice.sales_user_id,
            sales_user_name=invoice.sales_user_name,
            fee_type=invoice.fee_type,
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

    async def get_fee_payment_request(self, request_id: str) -> FeePaymentRequestRow | None:
        request = await self.session.get(FeePaymentRequest, request_id)
        if request is None:
            return None
        return self._map_request(request)

    async def list_fee_payment_requests(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        fee_type: str | None = None,
        partner_id: str | None = None,
        sales_user_id: str | None = None,
        shipment_no: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[FeePaymentRequestRow], int]:
        statement = select(FeePaymentRequest)
        count_statement = select(func.count()).select_from(FeePaymentRequest)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    FeePaymentRequest.request_no.ilike(pattern),
                    FeePaymentRequest.partner_fee_invoice_no.ilike(pattern),
                    FeePaymentRequest.partner_name.ilike(pattern),
                    FeePaymentRequest.shipment_no.ilike(pattern),
                    FeePaymentRequest.sales_user_name.ilike(pattern),
                )
            )
        if status:
            conditions.append(FeePaymentRequest.status == status)
        if fee_type:
            conditions.append(FeePaymentRequest.fee_type == fee_type)
        if partner_id:
            conditions.append(FeePaymentRequest.partner_id == partner_id)
        if sales_user_id:
            conditions.append(FeePaymentRequest.sales_user_id == sales_user_id)
        if shipment_no:
            conditions.append(FeePaymentRequest.shipment_no == shipment_no)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                FeePaymentRequest.request_date.desc(),
                FeePaymentRequest.request_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._request_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_request(row) for row in rows], int(total or 0)

    async def approve_fee_payment_request(
        self,
        *,
        request_id: str,
        approved_amount: Decimal | str,
        approved_at: date,
        reviewer_name: str,
        payment_account: str | None,
        remark: str | None,
    ) -> FeePaymentRequestRow | None:
        request = await self.session.get(FeePaymentRequest, request_id)
        if request is None:
            return None
        amount = Decimal(str(approved_amount))
        request.approved_amount = amount
        request.paid_amount = amount
        request.status = "approved"
        request.reviewer_name = reviewer_name
        request.approved_at = approved_at
        request.payment_account = payment_account
        if remark is not None:
            request.remark = remark
        await self.session.flush()
        return self._map_request(request)

    async def add_allocation(
        self,
        *,
        fee_payment_request_id: str,
        partner_fee_invoice_id: str,
        allocated_at: date,
        amount: Decimal | str,
        currency: str,
        remark: str | None,
    ) -> FeePaymentAllocationRow:
        allocation = FeePaymentAllocation(
            fee_payment_request_id=fee_payment_request_id,
            partner_fee_invoice_id=partner_fee_invoice_id,
            allocated_at=allocated_at,
            amount=Decimal(str(amount)),
            currency=currency,
            remark=remark,
        )
        self.session.add(allocation)
        await self.session.flush()
        return self._map_allocation(allocation)

    async def refresh_partner_fee_invoice_status(
        self,
        invoice_id: str,
    ) -> PartnerFeeInvoiceRow | None:
        invoice = await self.session.get(PartnerFeeInvoice, invoice_id)
        if invoice is None:
            return None
        paid_amount = await self.session.scalar(
            select(func.sum(FeePaymentAllocation.amount)).where(
                FeePaymentAllocation.partner_fee_invoice_id == invoice_id
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

    async def list_requests_for_invoice(self, invoice_id: str) -> list[FeePaymentRequestRow]:
        rows = await self.session.scalars(
            select(FeePaymentRequest)
            .where(FeePaymentRequest.partner_fee_invoice_id == invoice_id)
            .order_by(FeePaymentRequest.request_date.asc(), FeePaymentRequest.request_no.asc())
        )
        return [self._map_request(row) for row in rows]

    async def list_allocations_for_invoice(
        self,
        invoice_id: str,
    ) -> list[FeePaymentAllocationRow]:
        rows = await self.session.scalars(
            select(FeePaymentAllocation)
            .where(FeePaymentAllocation.partner_fee_invoice_id == invoice_id)
            .order_by(
                FeePaymentAllocation.allocated_at.asc(),
                FeePaymentAllocation.created_at.asc(),
            )
        )
        return [self._map_allocation(row) for row in rows]

    async def list_fee_payables(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        fee_type: str | None = None,
        partner_id: str | None = None,
        sales_user_id: str | None = None,
        shipment_no: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[FeePayableRow], int]:
        statement = select(PartnerFeeInvoice)
        count_statement = select(func.count()).select_from(PartnerFeeInvoice)
        conditions = self._invoice_conditions(
            q=q,
            status=status,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(PartnerFeeInvoice.due_date.asc(), PartnerFeeInvoice.invoice_no.asc())
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
        fee_type: str | None,
        partner_id: str | None,
        sales_user_id: str | None,
        shipment_no: str | None,
    ) -> list[object]:
        conditions: list[object] = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    PartnerFeeInvoice.invoice_no.ilike(pattern),
                    PartnerFeeInvoice.partner_name.ilike(pattern),
                    PartnerFeeInvoice.shipment_no.ilike(pattern),
                    PartnerFeeInvoice.sales_user_name.ilike(pattern),
                )
            )
        if status:
            conditions.append(PartnerFeeInvoice.status == status)
        if fee_type:
            conditions.append(PartnerFeeInvoice.fee_type == fee_type)
        if partner_id:
            conditions.append(PartnerFeeInvoice.partner_id == partner_id)
        if sales_user_id:
            conditions.append(PartnerFeeInvoice.sales_user_id == sales_user_id)
        if shipment_no:
            conditions.append(PartnerFeeInvoice.shipment_no == shipment_no)
        return conditions

    async def _invoice_scalars(
        self,
        statement: Select[tuple[PartnerFeeInvoice]],
    ) -> list[PartnerFeeInvoice]:
        result = await self.session.scalars(statement)
        return list(result)

    async def _request_scalars(
        self,
        statement: Select[tuple[FeePaymentRequest]],
    ) -> list[FeePaymentRequest]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_invoice(self, invoice: PartnerFeeInvoice) -> PartnerFeeInvoiceRow:
        total_amount = self._decimal(invoice.total_amount)
        paid_amount = self._decimal(invoice.paid_amount)
        return PartnerFeeInvoiceRow(
            id=invoice.id,
            invoice_no=invoice.invoice_no,
            invoice_date=invoice.invoice_date,
            partner_id=invoice.partner_id,
            partner_name=invoice.partner_name,
            partner_type=invoice.partner_type,
            shipment_plan_id=invoice.shipment_plan_id,
            shipment_no=invoice.shipment_no,
            sales_user_id=invoice.sales_user_id,
            sales_user_name=invoice.sales_user_name,
            fee_type=invoice.fee_type,
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

    def _map_request(self, request: FeePaymentRequest) -> FeePaymentRequestRow:
        return FeePaymentRequestRow(
            id=request.id,
            request_no=request.request_no,
            partner_fee_invoice_id=request.partner_fee_invoice_id,
            partner_fee_invoice_no=request.partner_fee_invoice_no,
            partner_id=request.partner_id,
            partner_name=request.partner_name,
            partner_type=request.partner_type,
            shipment_plan_id=request.shipment_plan_id,
            shipment_no=request.shipment_no,
            sales_user_id=request.sales_user_id,
            sales_user_name=request.sales_user_name,
            fee_type=request.fee_type,
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

    def _map_allocation(self, allocation: FeePaymentAllocation) -> FeePaymentAllocationRow:
        return FeePaymentAllocationRow(
            id=allocation.id,
            fee_payment_request_id=allocation.fee_payment_request_id,
            partner_fee_invoice_id=allocation.partner_fee_invoice_id,
            allocated_at=allocation.allocated_at,
            amount=self._money(allocation.amount),
            currency=allocation.currency,
            remark=allocation.remark,
            created_at=allocation.created_at,
        )

    def _map_payable(self, invoice: PartnerFeeInvoice) -> FeePayableRow:
        total_amount = self._decimal(invoice.total_amount)
        paid_amount = self._decimal(invoice.paid_amount)
        return FeePayableRow(
            partner_fee_invoice_id=invoice.id,
            invoice_no=invoice.invoice_no,
            partner_id=invoice.partner_id,
            partner_name=invoice.partner_name,
            partner_type=invoice.partner_type,
            shipment_plan_id=invoice.shipment_plan_id,
            shipment_no=invoice.shipment_no,
            sales_user_id=invoice.sales_user_id,
            sales_user_name=invoice.sales_user_name,
            fee_type=invoice.fee_type,
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
