"""Service layer for finance statistical reports.

Every report method enforces the ``finance:view`` permission and converts the
read-only repository rows into response schemas.
"""

from datetime import date

from app.modules.finance.reports.repositories import (
    BankReceiptCurrencySummaryData,
    BankReceiptOperatorSummaryData,
    CustomsReceiptCollectionRowData,
    CustomsReceiptStatusSummaryData,
    PaymentCurrencySummaryData,
    PaymentQueryRowData,
    ReceiptUsageCurrencySummaryData,
    ReceiptUsageDetailRowData,
    ReportsRepository,
    TaxRefundCurrencyTotalData,
    TaxRefundStatusSummaryData,
)
from app.modules.finance.reports.schemas import (
    BankReceiptCurrencySummary,
    BankReceiptOperatorSummary,
    BankReceiptSummaryResponse,
    CustomsReceiptCollectionResponse,
    CustomsReceiptCollectionRow,
    CustomsReceiptStatusSummary,
    FeePaymentCurrencySummary,
    FeePaymentQueryResponse,
    FeePaymentQueryRow,
    GoodsPaymentCurrencySummary,
    GoodsPaymentQueryResponse,
    GoodsPaymentQueryRow,
    ReceiptUsageCurrencySummary,
    ReceiptUsageDetailResponse,
    ReceiptUsageDetailRow,
    TaxRefundCurrencyTotal,
    TaxRefundStatisticsResponse,
    TaxRefundStatusSummary,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ReportsService:
    def __init__(self, repository: ReportsRepository) -> None:
        self._repository = repository

    # 1. 水单使用情况明细表 ------------------------------------------------
    async def get_receipt_usage(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_no: str | None = None,
    ) -> ReceiptUsageDetailResponse:
        self._require_finance(current_user)
        rows = await self._repository.list_receipt_usage_details(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_no=receipt_no,
        )
        summaries = await self._repository.list_receipt_usage_currency_summaries(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_no=receipt_no,
        )
        return ReceiptUsageDetailResponse(
            rows=[self._receipt_usage_row(row) for row in rows],
            currency_summaries=[self._receipt_usage_summary(item) for item in summaries],
            total_count=len(rows),
        )

    # 2. 银行水单汇总表 --------------------------------------------------
    async def get_bank_receipt_summary(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_type: str | None = None,
    ) -> BankReceiptSummaryResponse:
        self._require_finance(current_user)
        currency_summaries = await self._repository.list_bank_receipt_currency_summaries(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_type=receipt_type,
        )
        operator_summaries = await self._repository.list_bank_receipt_operator_summaries(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_type=receipt_type,
        )
        return BankReceiptSummaryResponse(
            currency_summaries=[
                self._bank_currency_summary(item) for item in currency_summaries
            ],
            operator_summaries=[
                self._bank_operator_summary(item) for item in operator_summaries
            ],
            receipt_count=sum(item.receipt_count for item in currency_summaries),
        )

    # 3. 货款支付情况查询 ------------------------------------------------
    async def get_goods_payment(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        supplier_name: str | None = None,
        status: str | None = None,
    ) -> GoodsPaymentQueryResponse:
        self._require_finance(current_user)
        rows = await self._repository.list_goods_payments(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            supplier_name=supplier_name,
            status=status,
        )
        summaries = await self._repository.list_goods_payment_currency_summaries(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            supplier_name=supplier_name,
            status=status,
        )
        return GoodsPaymentQueryResponse(
            rows=[self._goods_payment_row(row) for row in rows],
            currency_summaries=[
                self._goods_currency_summary(item) for item in summaries
            ],
            total_count=len(rows),
        )

    # 4. 费用支付情况查询 ------------------------------------------------
    async def get_fee_payment(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        partner_name: str | None = None,
        fee_type: str | None = None,
        sales_user_id: str | None = None,
        status: str | None = None,
    ) -> FeePaymentQueryResponse:
        self._require_finance(current_user)
        rows = await self._repository.list_fee_payments(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            partner_name=partner_name,
            fee_type=fee_type,
            sales_user_id=sales_user_id,
            status=status,
        )
        summaries = await self._repository.list_fee_payment_currency_summaries(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            partner_name=partner_name,
            fee_type=fee_type,
            sales_user_id=sales_user_id,
            status=status,
        )
        return FeePaymentQueryResponse(
            rows=[self._fee_payment_row(row) for row in rows],
            currency_summaries=[self._fee_currency_summary(item) for item in summaries],
            total_count=len(rows),
        )

    # 5. 报关回单催收查询 ------------------------------------------------
    async def get_customs_receipt_collection(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        owner_user_id: str | None = None,
        reminder_status: str | None = None,
        include_registered: bool = False,
    ) -> CustomsReceiptCollectionResponse:
        self._require_finance(current_user)
        rows = await self._repository.list_customs_receipt_collections(
            date_from=date_from,
            date_to=date_to,
            owner_user_id=owner_user_id,
            reminder_status=reminder_status,
            include_registered=include_registered,
        )
        summaries = await self._repository.list_customs_receipt_status_summaries(
            date_from=date_from,
            date_to=date_to,
            owner_user_id=owner_user_id,
            reminder_status=reminder_status,
            include_registered=include_registered,
        )
        return CustomsReceiptCollectionResponse(
            rows=[self._customs_row(row) for row in rows],
            status_summaries=[self._customs_status_summary(item) for item in summaries],
            total_count=len(rows),
        )

    # 6. 申报退税统计 ----------------------------------------------------
    async def get_tax_refund_statistics(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        status: str | None = None,
    ) -> TaxRefundStatisticsResponse:
        self._require_finance(current_user)
        status_summaries = await self._repository.list_tax_refund_status_summaries(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            status=status,
        )
        currency_totals = await self._repository.list_tax_refund_currency_totals(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            status=status,
        )
        refund_record_count = await self._repository.count_tax_refund_records(
            date_from=date_from,
            date_to=date_to,
            currency=currency,
        )
        return TaxRefundStatisticsResponse(
            status_summaries=[
                self._tax_status_summary(item) for item in status_summaries
            ],
            currency_totals=[self._tax_currency_total(item) for item in currency_totals],
            document_count=sum(item.document_count for item in currency_totals),
            refund_record_count=refund_record_count,
        )

    # -- mappers --------------------------------------------------------
    def _receipt_usage_row(
        self,
        row: ReceiptUsageDetailRowData,
    ) -> ReceiptUsageDetailRow:
        return ReceiptUsageDetailRow(
            receipt_no=row.receipt_no,
            received_at=row.received_at,
            payer_name=row.payer_name,
            customer_name=row.customer_name,
            allocation_type=row.allocation_type,
            contract_no=row.contract_no,
            invoice_no=row.invoice_no,
            allocated_at=row.allocated_at,
            currency=row.currency,
            amount=row.amount,
        )

    def _receipt_usage_summary(
        self,
        item: ReceiptUsageCurrencySummaryData,
    ) -> ReceiptUsageCurrencySummary:
        return ReceiptUsageCurrencySummary(
            currency=item.currency,
            allocation_count=item.allocation_count,
            allocated_amount=item.allocated_amount,
        )

    def _bank_currency_summary(
        self,
        item: BankReceiptCurrencySummaryData,
    ) -> BankReceiptCurrencySummary:
        return BankReceiptCurrencySummary(
            currency=item.currency,
            receipt_count=item.receipt_count,
            total_amount=item.total_amount,
            allocated_amount=item.allocated_amount,
            unallocated_amount=item.unallocated_amount,
        )

    def _bank_operator_summary(
        self,
        item: BankReceiptOperatorSummaryData,
    ) -> BankReceiptOperatorSummary:
        return BankReceiptOperatorSummary(
            operator_name=item.operator_name,
            currency=item.currency,
            receipt_count=item.receipt_count,
            total_amount=item.total_amount,
        )

    def _goods_payment_row(self, row: PaymentQueryRowData) -> GoodsPaymentQueryRow:
        return GoodsPaymentQueryRow(
            request_no=row.request_no,
            request_date=row.request_date,
            supplier_invoice_no=row.reference_no,
            supplier_name=row.party_name,
            purchase_contract_no=row.secondary_ref,
            payment_type=row.type_label,
            currency=row.currency,
            requested_amount=row.requested_amount,
            approved_amount=row.approved_amount,
            paid_amount=row.paid_amount,
            outstanding_amount=row.outstanding_amount,
            status=row.status,
        )

    def _goods_currency_summary(
        self,
        item: PaymentCurrencySummaryData,
    ) -> GoodsPaymentCurrencySummary:
        return GoodsPaymentCurrencySummary(
            currency=item.currency,
            request_count=item.request_count,
            requested_amount=item.requested_amount,
            approved_amount=item.approved_amount,
            paid_amount=item.paid_amount,
            outstanding_amount=item.outstanding_amount,
        )

    def _fee_payment_row(self, row: PaymentQueryRowData) -> FeePaymentQueryRow:
        return FeePaymentQueryRow(
            request_no=row.request_no,
            request_date=row.request_date,
            partner_fee_invoice_no=row.reference_no,
            partner_name=row.party_name,
            partner_type=row.partner_type,
            fee_type=row.type_label,
            shipment_no=row.shipment_no,
            sales_user_name=row.sales_user_name,
            currency=row.currency,
            requested_amount=row.requested_amount,
            approved_amount=row.approved_amount,
            paid_amount=row.paid_amount,
            outstanding_amount=row.outstanding_amount,
            status=row.status,
        )

    def _fee_currency_summary(
        self,
        item: PaymentCurrencySummaryData,
    ) -> FeePaymentCurrencySummary:
        return FeePaymentCurrencySummary(
            currency=item.currency,
            request_count=item.request_count,
            requested_amount=item.requested_amount,
            approved_amount=item.approved_amount,
            paid_amount=item.paid_amount,
            outstanding_amount=item.outstanding_amount,
        )

    def _customs_row(
        self,
        row: CustomsReceiptCollectionRowData,
    ) -> CustomsReceiptCollectionRow:
        return CustomsReceiptCollectionRow(
            document_no=row.document_no,
            received_at=row.received_at,
            owner_user_name=row.owner_user_name,
            shipment_no=row.shipment_no,
            customer_name=row.customer_name,
            customs_declaration_no=row.customs_declaration_no,
            customs_receipt_no=row.customs_receipt_no,
            reminder_date=row.reminder_date,
            reminder_status=row.reminder_status,
            valid_until=row.valid_until,
            currency=row.currency,
            refundable_amount=row.refundable_amount,
        )

    def _customs_status_summary(
        self,
        item: CustomsReceiptStatusSummaryData,
    ) -> CustomsReceiptStatusSummary:
        return CustomsReceiptStatusSummary(
            reminder_status=item.reminder_status,
            count=item.count,
        )

    def _tax_status_summary(
        self,
        item: TaxRefundStatusSummaryData,
    ) -> TaxRefundStatusSummary:
        return TaxRefundStatusSummary(
            status=item.status,
            currency=item.currency,
            document_count=item.document_count,
            refundable_amount=item.refundable_amount,
            refunded_amount=item.refunded_amount,
            outstanding_amount=item.outstanding_amount,
        )

    def _tax_currency_total(
        self,
        item: TaxRefundCurrencyTotalData,
    ) -> TaxRefundCurrencyTotal:
        return TaxRefundCurrencyTotal(
            currency=item.currency,
            document_count=item.document_count,
            refundable_amount=item.refundable_amount,
            refunded_amount=item.refunded_amount,
            outstanding_amount=item.outstanding_amount,
        )

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError
