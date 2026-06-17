"""Read-only aggregation queries backing the finance statistical reports.

This repository never creates or mutates tables. It only reads from existing
finance module tables to produce report rows and grouped summaries.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.fee_payments.models import FeePaymentRequest
from app.modules.finance.payments.models import PaymentRequest
from app.modules.finance.receipts.models import BankReceipt, ReceiptAllocation
from app.modules.finance.tax_refunds.models import (
    VerificationDocument,
    VerificationTaxRefund,
)


@dataclass(frozen=True)
class ReceiptUsageDetailRowData:
    receipt_no: str
    received_at: date
    payer_name: str
    customer_name: str | None
    allocation_type: str
    contract_no: str | None
    invoice_no: str | None
    allocated_at: date
    currency: str
    amount: str


@dataclass(frozen=True)
class ReceiptUsageCurrencySummaryData:
    currency: str
    allocation_count: int
    allocated_amount: str


@dataclass(frozen=True)
class BankReceiptCurrencySummaryData:
    currency: str
    receipt_count: int
    total_amount: str
    allocated_amount: str
    unallocated_amount: str


@dataclass(frozen=True)
class BankReceiptOperatorSummaryData:
    operator_name: str
    currency: str
    receipt_count: int
    total_amount: str


@dataclass(frozen=True)
class PaymentQueryRowData:
    request_no: str
    request_date: date
    reference_no: str
    party_name: str
    secondary_ref: str | None
    type_label: str
    currency: str
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str
    status: str
    partner_type: str | None = None
    shipment_no: str | None = None
    sales_user_name: str | None = None


@dataclass(frozen=True)
class PaymentCurrencySummaryData:
    currency: str
    request_count: int
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str


@dataclass(frozen=True)
class CustomsReceiptCollectionRowData:
    document_no: str
    received_at: date
    owner_user_name: str | None
    shipment_no: str | None
    customer_name: str | None
    customs_declaration_no: str | None
    customs_receipt_no: str | None
    reminder_date: date
    reminder_status: str
    valid_until: date
    currency: str
    refundable_amount: str


@dataclass(frozen=True)
class CustomsReceiptStatusSummaryData:
    reminder_status: str
    count: int


@dataclass(frozen=True)
class TaxRefundStatusSummaryData:
    status: str
    currency: str
    document_count: int
    refundable_amount: str
    refunded_amount: str
    outstanding_amount: str


@dataclass(frozen=True)
class TaxRefundCurrencyTotalData:
    currency: str
    document_count: int
    refundable_amount: str
    refunded_amount: str
    outstanding_amount: str


class ReportsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # 1. 水单使用情况明细表
    # ------------------------------------------------------------------
    async def list_receipt_usage_details(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_no: str | None = None,
    ) -> list[ReceiptUsageDetailRowData]:
        stmt = (
            select(
                BankReceipt.receipt_no,
                BankReceipt.received_at,
                BankReceipt.payer_name,
                BankReceipt.customer_name,
                ReceiptAllocation.allocation_type,
                ReceiptAllocation.contract_no,
                ReceiptAllocation.invoice_no,
                ReceiptAllocation.allocated_at,
                ReceiptAllocation.currency,
                ReceiptAllocation.amount,
            )
            .join(ReceiptAllocation, ReceiptAllocation.receipt_id == BankReceipt.id)
            .order_by(
                ReceiptAllocation.allocated_at.desc(),
                BankReceipt.receipt_no.asc(),
            )
        )
        if date_from is not None:
            stmt = stmt.where(ReceiptAllocation.allocated_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(ReceiptAllocation.allocated_at <= date_to)
        if currency:
            stmt = stmt.where(ReceiptAllocation.currency == currency)
        if receipt_no:
            stmt = stmt.where(BankReceipt.receipt_no == receipt_no)

        result = await self.session.execute(stmt)
        return [
            ReceiptUsageDetailRowData(
                receipt_no=str(row.receipt_no),
                received_at=row.received_at,
                payer_name=str(row.payer_name),
                customer_name=row.customer_name,
                allocation_type=str(row.allocation_type),
                contract_no=row.contract_no,
                invoice_no=row.invoice_no,
                allocated_at=row.allocated_at,
                currency=str(row.currency),
                amount=_money(row.amount),
            )
            for row in result.all()
        ]

    async def list_receipt_usage_currency_summaries(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_no: str | None = None,
    ) -> list[ReceiptUsageCurrencySummaryData]:
        stmt = (
            select(
                ReceiptAllocation.currency,
                func.count(ReceiptAllocation.id),
                func.coalesce(func.sum(ReceiptAllocation.amount), 0),
            )
            .join(BankReceipt, ReceiptAllocation.receipt_id == BankReceipt.id)
            .group_by(ReceiptAllocation.currency)
            .order_by(ReceiptAllocation.currency.asc())
        )
        if date_from is not None:
            stmt = stmt.where(ReceiptAllocation.allocated_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(ReceiptAllocation.allocated_at <= date_to)
        if currency:
            stmt = stmt.where(ReceiptAllocation.currency == currency)
        if receipt_no:
            stmt = stmt.where(BankReceipt.receipt_no == receipt_no)

        result = await self.session.execute(stmt)
        return [
            ReceiptUsageCurrencySummaryData(
                currency=str(row_currency),
                allocation_count=int(count or 0),
                allocated_amount=_money(amount),
            )
            for row_currency, count, amount in result.all()
        ]

    # ------------------------------------------------------------------
    # 2. 银行水单汇总表
    # ------------------------------------------------------------------
    async def list_bank_receipt_currency_summaries(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_type: str | None = None,
    ) -> list[BankReceiptCurrencySummaryData]:
        stmt = (
            select(
                BankReceipt.currency,
                func.count(BankReceipt.id),
                func.coalesce(func.sum(BankReceipt.amount), 0),
                func.coalesce(func.sum(BankReceipt.allocated_amount), 0),
            )
            .group_by(BankReceipt.currency)
            .order_by(BankReceipt.currency.asc())
        )
        stmt = self._apply_receipt_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_type=receipt_type,
        )
        result = await self.session.execute(stmt)
        summaries: list[BankReceiptCurrencySummaryData] = []
        for row_currency, count, total, allocated in result.all():
            total_amount = _decimal(total)
            allocated_amount = _decimal(allocated)
            summaries.append(
                BankReceiptCurrencySummaryData(
                    currency=str(row_currency),
                    receipt_count=int(count or 0),
                    total_amount=_format(total_amount),
                    allocated_amount=_format(allocated_amount),
                    unallocated_amount=_format(total_amount - allocated_amount),
                )
            )
        return summaries

    async def list_bank_receipt_operator_summaries(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_type: str | None = None,
    ) -> list[BankReceiptOperatorSummaryData]:
        stmt = (
            select(
                BankReceipt.created_by_user_name,
                BankReceipt.currency,
                func.count(BankReceipt.id),
                func.coalesce(func.sum(BankReceipt.amount), 0),
            )
            .group_by(BankReceipt.created_by_user_name, BankReceipt.currency)
            .order_by(
                BankReceipt.created_by_user_name.asc(),
                BankReceipt.currency.asc(),
            )
        )
        stmt = self._apply_receipt_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_type=receipt_type,
        )
        result = await self.session.execute(stmt)
        return [
            BankReceiptOperatorSummaryData(
                operator_name=str(operator_name),
                currency=str(row_currency),
                receipt_count=int(count or 0),
                total_amount=_money(amount),
            )
            for operator_name, row_currency, count, amount in result.all()
        ]

    def _apply_receipt_filters(
        self,
        stmt,  # noqa: ANN001 - SQLAlchemy Select, kept loose for reuse
        *,
        date_from: date | None,
        date_to: date | None,
        currency: str | None,
        receipt_type: str | None,
    ):
        if date_from is not None:
            stmt = stmt.where(BankReceipt.received_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(BankReceipt.received_at <= date_to)
        if currency:
            stmt = stmt.where(BankReceipt.currency == currency)
        if receipt_type:
            stmt = stmt.where(BankReceipt.receipt_type == receipt_type)
        return stmt

    # ------------------------------------------------------------------
    # 3. 货款支付情况查询
    # ------------------------------------------------------------------
    async def list_goods_payments(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        supplier_name: str | None = None,
        status: str | None = None,
    ) -> list[PaymentQueryRowData]:
        stmt = select(PaymentRequest).order_by(
            PaymentRequest.request_date.desc(),
            PaymentRequest.request_no.asc(),
        )
        if date_from is not None:
            stmt = stmt.where(PaymentRequest.request_date >= date_from)
        if date_to is not None:
            stmt = stmt.where(PaymentRequest.request_date <= date_to)
        if currency:
            stmt = stmt.where(PaymentRequest.currency == currency)
        if supplier_name:
            stmt = stmt.where(PaymentRequest.supplier_name == supplier_name)
        if status:
            stmt = stmt.where(PaymentRequest.status == status)

        rows = await self.session.scalars(stmt)
        result: list[PaymentQueryRowData] = []
        for item in rows:
            requested = _decimal(item.requested_amount)
            paid = _decimal(item.paid_amount)
            result.append(
                PaymentQueryRowData(
                    request_no=item.request_no,
                    request_date=item.request_date,
                    reference_no=item.supplier_invoice_no,
                    party_name=item.supplier_name,
                    secondary_ref=item.purchase_contract_no,
                    type_label=item.payment_type,
                    currency=item.currency,
                    requested_amount=_format(requested),
                    approved_amount=_money(item.approved_amount),
                    paid_amount=_format(paid),
                    outstanding_amount=_format(requested - paid),
                    status=item.status,
                )
            )
        return result

    async def list_goods_payment_currency_summaries(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        supplier_name: str | None = None,
        status: str | None = None,
    ) -> list[PaymentCurrencySummaryData]:
        stmt = (
            select(
                PaymentRequest.currency,
                func.count(PaymentRequest.id),
                func.coalesce(func.sum(PaymentRequest.requested_amount), 0),
                func.coalesce(func.sum(PaymentRequest.approved_amount), 0),
                func.coalesce(func.sum(PaymentRequest.paid_amount), 0),
            )
            .group_by(PaymentRequest.currency)
            .order_by(PaymentRequest.currency.asc())
        )
        if date_from is not None:
            stmt = stmt.where(PaymentRequest.request_date >= date_from)
        if date_to is not None:
            stmt = stmt.where(PaymentRequest.request_date <= date_to)
        if currency:
            stmt = stmt.where(PaymentRequest.currency == currency)
        if supplier_name:
            stmt = stmt.where(PaymentRequest.supplier_name == supplier_name)
        if status:
            stmt = stmt.where(PaymentRequest.status == status)

        result = await self.session.execute(stmt)
        return [
            _payment_currency_summary(row)
            for row in result.all()
        ]

    # ------------------------------------------------------------------
    # 4. 费用支付情况查询
    # ------------------------------------------------------------------
    async def list_fee_payments(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        partner_name: str | None = None,
        fee_type: str | None = None,
        sales_user_id: str | None = None,
        status: str | None = None,
    ) -> list[PaymentQueryRowData]:
        stmt = select(FeePaymentRequest).order_by(
            FeePaymentRequest.request_date.desc(),
            FeePaymentRequest.request_no.asc(),
        )
        stmt = self._apply_fee_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            partner_name=partner_name,
            fee_type=fee_type,
            sales_user_id=sales_user_id,
            status=status,
        )

        rows = await self.session.scalars(stmt)
        result: list[PaymentQueryRowData] = []
        for item in rows:
            requested = _decimal(item.requested_amount)
            paid = _decimal(item.paid_amount)
            result.append(
                PaymentQueryRowData(
                    request_no=item.request_no,
                    request_date=item.request_date,
                    reference_no=item.partner_fee_invoice_no,
                    party_name=item.partner_name,
                    secondary_ref=item.partner_fee_invoice_no,
                    type_label=item.fee_type,
                    currency=item.currency,
                    requested_amount=_format(requested),
                    approved_amount=_money(item.approved_amount),
                    paid_amount=_format(paid),
                    outstanding_amount=_format(requested - paid),
                    status=item.status,
                    partner_type=item.partner_type,
                    shipment_no=item.shipment_no,
                    sales_user_name=item.sales_user_name,
                )
            )
        return result

    async def list_fee_payment_currency_summaries(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        partner_name: str | None = None,
        fee_type: str | None = None,
        sales_user_id: str | None = None,
        status: str | None = None,
    ) -> list[PaymentCurrencySummaryData]:
        stmt = (
            select(
                FeePaymentRequest.currency,
                func.count(FeePaymentRequest.id),
                func.coalesce(func.sum(FeePaymentRequest.requested_amount), 0),
                func.coalesce(func.sum(FeePaymentRequest.approved_amount), 0),
                func.coalesce(func.sum(FeePaymentRequest.paid_amount), 0),
            )
            .group_by(FeePaymentRequest.currency)
            .order_by(FeePaymentRequest.currency.asc())
        )
        stmt = self._apply_fee_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            partner_name=partner_name,
            fee_type=fee_type,
            sales_user_id=sales_user_id,
            status=status,
        )
        result = await self.session.execute(stmt)
        return [
            _payment_currency_summary(row)
            for row in result.all()
        ]

    def _apply_fee_filters(
        self,
        stmt,  # noqa: ANN001 - SQLAlchemy Select, kept loose for reuse
        *,
        date_from: date | None,
        date_to: date | None,
        currency: str | None,
        partner_name: str | None,
        fee_type: str | None,
        sales_user_id: str | None,
        status: str | None,
    ):
        if date_from is not None:
            stmt = stmt.where(FeePaymentRequest.request_date >= date_from)
        if date_to is not None:
            stmt = stmt.where(FeePaymentRequest.request_date <= date_to)
        if currency:
            stmt = stmt.where(FeePaymentRequest.currency == currency)
        if partner_name:
            stmt = stmt.where(FeePaymentRequest.partner_name == partner_name)
        if fee_type:
            stmt = stmt.where(FeePaymentRequest.fee_type == fee_type)
        if sales_user_id:
            stmt = stmt.where(FeePaymentRequest.sales_user_id == sales_user_id)
        if status:
            stmt = stmt.where(FeePaymentRequest.status == status)
        return stmt

    # ------------------------------------------------------------------
    # 5. 报关回单催收查询
    # ------------------------------------------------------------------
    async def list_customs_receipt_collections(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        owner_user_id: str | None = None,
        reminder_status: str | None = None,
        include_registered: bool = False,
    ) -> list[CustomsReceiptCollectionRowData]:
        stmt = select(VerificationDocument).order_by(
            VerificationDocument.reminder_date.asc(),
            VerificationDocument.document_no.asc(),
        )
        stmt = self._apply_customs_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            owner_user_id=owner_user_id,
            reminder_status=reminder_status,
            include_registered=include_registered,
        )
        rows = await self.session.scalars(stmt)
        return [
            CustomsReceiptCollectionRowData(
                document_no=item.document_no,
                received_at=item.received_at,
                owner_user_name=item.owner_user_name,
                shipment_no=item.shipment_no,
                customer_name=item.customer_name,
                customs_declaration_no=item.customs_declaration_no,
                customs_receipt_no=item.customs_receipt_no,
                reminder_date=item.reminder_date,
                reminder_status=item.reminder_status,
                valid_until=item.valid_until,
                currency=item.currency,
                refundable_amount=_money(item.refundable_amount),
            )
            for item in rows
        ]

    async def list_customs_receipt_status_summaries(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        owner_user_id: str | None = None,
        reminder_status: str | None = None,
        include_registered: bool = False,
    ) -> list[CustomsReceiptStatusSummaryData]:
        stmt = (
            select(
                VerificationDocument.reminder_status,
                func.count(VerificationDocument.id),
            )
            .group_by(VerificationDocument.reminder_status)
            .order_by(VerificationDocument.reminder_status.asc())
        )
        stmt = self._apply_customs_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            owner_user_id=owner_user_id,
            reminder_status=reminder_status,
            include_registered=include_registered,
        )
        result = await self.session.execute(stmt)
        return [
            CustomsReceiptStatusSummaryData(
                reminder_status=str(status_value),
                count=int(count or 0),
            )
            for status_value, count in result.all()
        ]

    def _apply_customs_filters(
        self,
        stmt,  # noqa: ANN001 - SQLAlchemy Select, kept loose for reuse
        *,
        date_from: date | None,
        date_to: date | None,
        owner_user_id: str | None,
        reminder_status: str | None,
        include_registered: bool,
    ):
        # By default only documents whose customs receipt has NOT been registered
        # are returned (the actual "催收" collection list).
        if not include_registered:
            stmt = stmt.where(VerificationDocument.customs_receipt_no.is_(None))
        if date_from is not None:
            stmt = stmt.where(VerificationDocument.received_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(VerificationDocument.received_at <= date_to)
        if owner_user_id:
            stmt = stmt.where(VerificationDocument.owner_user_id == owner_user_id)
        if reminder_status:
            stmt = stmt.where(VerificationDocument.reminder_status == reminder_status)
        return stmt

    # ------------------------------------------------------------------
    # 6. 申报退税统计
    # ------------------------------------------------------------------
    async def list_tax_refund_status_summaries(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        status: str | None = None,
    ) -> list[TaxRefundStatusSummaryData]:
        stmt = (
            select(
                VerificationDocument.status,
                VerificationDocument.currency,
                func.count(VerificationDocument.id),
                func.coalesce(func.sum(VerificationDocument.refundable_amount), 0),
                func.coalesce(func.sum(VerificationDocument.refunded_amount), 0),
            )
            .group_by(VerificationDocument.status, VerificationDocument.currency)
            .order_by(
                VerificationDocument.status.asc(),
                VerificationDocument.currency.asc(),
            )
        )
        stmt = self._apply_tax_refund_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            status=status,
        )
        result = await self.session.execute(stmt)
        summaries: list[TaxRefundStatusSummaryData] = []
        for status_value, row_currency, count, refundable, refunded in result.all():
            refundable_amount = _decimal(refundable)
            refunded_amount = _decimal(refunded)
            summaries.append(
                TaxRefundStatusSummaryData(
                    status=str(status_value),
                    currency=str(row_currency),
                    document_count=int(count or 0),
                    refundable_amount=_format(refundable_amount),
                    refunded_amount=_format(refunded_amount),
                    outstanding_amount=_format(refundable_amount - refunded_amount),
                )
            )
        return summaries

    async def list_tax_refund_currency_totals(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        status: str | None = None,
    ) -> list[TaxRefundCurrencyTotalData]:
        stmt = (
            select(
                VerificationDocument.currency,
                func.count(VerificationDocument.id),
                func.coalesce(func.sum(VerificationDocument.refundable_amount), 0),
                func.coalesce(func.sum(VerificationDocument.refunded_amount), 0),
            )
            .group_by(VerificationDocument.currency)
            .order_by(VerificationDocument.currency.asc())
        )
        stmt = self._apply_tax_refund_filters(
            stmt,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            status=status,
        )
        result = await self.session.execute(stmt)
        totals: list[TaxRefundCurrencyTotalData] = []
        for row_currency, count, refundable, refunded in result.all():
            refundable_amount = _decimal(refundable)
            refunded_amount = _decimal(refunded)
            totals.append(
                TaxRefundCurrencyTotalData(
                    currency=str(row_currency),
                    document_count=int(count or 0),
                    refundable_amount=_format(refundable_amount),
                    refunded_amount=_format(refunded_amount),
                    outstanding_amount=_format(refundable_amount - refunded_amount),
                )
            )
        return totals

    async def count_tax_refund_records(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
    ) -> int:
        stmt = select(func.count(VerificationTaxRefund.id))
        if date_from is not None:
            stmt = stmt.where(VerificationTaxRefund.refunded_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(VerificationTaxRefund.refunded_at <= date_to)
        if currency:
            stmt = stmt.where(VerificationTaxRefund.currency == currency)
        return int(await self.session.scalar(stmt) or 0)

    def _apply_tax_refund_filters(
        self,
        stmt,  # noqa: ANN001 - SQLAlchemy Select, kept loose for reuse
        *,
        date_from: date | None,
        date_to: date | None,
        currency: str | None,
        status: str | None,
    ):
        if date_from is not None:
            stmt = stmt.where(VerificationDocument.received_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(VerificationDocument.received_at <= date_to)
        if currency:
            stmt = stmt.where(VerificationDocument.currency == currency)
        if status:
            stmt = stmt.where(VerificationDocument.status == status)
        return stmt


def _payment_currency_summary(row) -> PaymentCurrencySummaryData:  # noqa: ANN001 - SQLAlchemy Row
    row_currency, count, requested, approved, paid = row
    requested_amount = _decimal(requested)
    paid_amount = _decimal(paid)
    return PaymentCurrencySummaryData(
        currency=str(row_currency),
        request_count=int(count or 0),
        requested_amount=_format(requested_amount),
        approved_amount=_format(approved),
        paid_amount=_format(paid_amount),
        outstanding_amount=_format(requested_amount - paid_amount),
    )


def _money(value: Decimal | int | str | None) -> str:
    return _format(_decimal(value))


def _format(value: Decimal | int | str | None) -> str:
    return f"{_decimal(value):.2f}"


def _decimal(value: Decimal | int | str | None) -> Decimal:
    return Decimal(str(value or 0))
