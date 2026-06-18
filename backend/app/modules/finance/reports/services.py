"""Service layer for finance statistical reports.

Every report method enforces the ``finance:view`` permission and converts the
read-only repository rows into response schemas.
"""

import csv
from collections.abc import Sequence
from datetime import date
from io import StringIO

from app.modules.finance.reports.repositories import ReportsRepository
from app.modules.finance.reports.row_data import (
    BankReceiptCurrencySummaryData,
    BankReceiptOperatorSummaryData,
    CustomsReceiptCollectionRowData,
    CustomsReceiptStatusSummaryData,
    PaymentCurrencySummaryData,
    PaymentQueryRowData,
    ReceiptUsageCurrencySummaryData,
    ReceiptUsageDetailRowData,
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
    FinanceReportDrilldownItem,
    FinanceReportDrilldownResponse,
    FinanceReportExplanationResponse,
    FinanceReportExportResponse,
    FinanceReportFieldExplanation,
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

    async def export_receipt_usage(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_no: str | None = None,
    ) -> FinanceReportExportResponse:
        self._require_export(current_user)
        report = await self.get_receipt_usage(
            current_user=current_user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_no=receipt_no,
        )
        rows = [
            [
                row.receipt_no,
                row.received_at.isoformat(),
                row.payer_name,
                row.customer_name or "",
                row.allocation_type,
                row.contract_no or "",
                row.invoice_no or "",
                row.allocated_at.isoformat(),
                row.currency,
                row.amount,
            ]
            for row in report.rows
        ]
        return self._export_response(
            filename="finance-receipt-usage.csv",
            headers=[
                "水单号",
                "收款日期",
                "付款方",
                "客户",
                "分摊类型",
                "合同号",
                "发票号",
                "分摊日期",
                "币种",
                "金额",
            ],
            rows=rows,
        )

    async def export_bank_receipt_summary(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        receipt_type: str | None = None,
    ) -> FinanceReportExportResponse:
        self._require_export(current_user)
        report = await self.get_bank_receipt_summary(
            current_user=current_user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            receipt_type=receipt_type,
        )
        rows = [
            [
                "币种汇总",
                item.currency,
                "",
                item.receipt_count,
                item.total_amount,
                item.allocated_amount,
                item.unallocated_amount,
            ]
            for item in report.currency_summaries
        ]
        rows.extend(
            [
                "经办人汇总",
                item.currency,
                item.operator_name,
                item.receipt_count,
                item.total_amount,
                "",
                "",
            ]
            for item in report.operator_summaries
        )
        return self._export_response(
            filename="finance-bank-receipt-summary.csv",
            headers=["汇总类型", "币种", "经办人", "水单数", "总金额", "已分摊", "未分摊"],
            rows=rows,
        )

    async def export_goods_payment(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        supplier_name: str | None = None,
        status: str | None = None,
    ) -> FinanceReportExportResponse:
        self._require_export(current_user)
        report = await self.get_goods_payment(
            current_user=current_user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            supplier_name=supplier_name,
            status=status,
        )
        rows = [
            [
                row.request_no,
                row.request_date.isoformat(),
                row.supplier_invoice_no,
                row.supplier_name,
                row.purchase_contract_no or "",
                row.payment_type,
                row.currency,
                row.requested_amount,
                row.approved_amount,
                row.paid_amount,
                row.outstanding_amount,
                row.status,
            ]
            for row in report.rows
        ]
        return self._export_response(
            filename="finance-goods-payment.csv",
            headers=[
                "付款单号",
                "日期",
                "供应商发票号",
                "供应商",
                "采购合同号",
                "付款类型",
                "币种",
                "申请金额",
                "审批金额",
                "已付金额",
                "未付金额",
                "状态",
            ],
            rows=rows,
        )

    async def export_fee_payment(
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
    ) -> FinanceReportExportResponse:
        self._require_export(current_user)
        report = await self.get_fee_payment(
            current_user=current_user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            partner_name=partner_name,
            fee_type=fee_type,
            sales_user_id=sales_user_id,
            status=status,
        )
        rows = [
            [
                row.request_no,
                row.request_date.isoformat(),
                row.partner_fee_invoice_no,
                row.partner_name,
                row.partner_type or "",
                row.fee_type,
                row.shipment_no or "",
                row.sales_user_name or "",
                row.currency,
                row.requested_amount,
                row.approved_amount,
                row.paid_amount,
                row.outstanding_amount,
                row.status,
            ]
            for row in report.rows
        ]
        return self._export_response(
            filename="finance-fee-payment.csv",
            headers=[
                "付费单号",
                "日期",
                "合作伙伴发票号",
                "合作伙伴",
                "伙伴类型",
                "费用类型",
                "出运单",
                "业务员",
                "币种",
                "申请金额",
                "审批金额",
                "已付金额",
                "未付金额",
                "状态",
            ],
            rows=rows,
        )

    async def export_customs_receipt_collection(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        owner_user_id: str | None = None,
        reminder_status: str | None = None,
        include_registered: bool = False,
    ) -> FinanceReportExportResponse:
        self._require_export(current_user)
        report = await self.get_customs_receipt_collection(
            current_user=current_user,
            date_from=date_from,
            date_to=date_to,
            owner_user_id=owner_user_id,
            reminder_status=reminder_status,
            include_registered=include_registered,
        )
        rows = [
            [
                row.document_no,
                row.received_at.isoformat(),
                row.owner_user_name or "",
                row.shipment_no or "",
                row.customer_name or "",
                row.customs_declaration_no or "",
                row.customs_receipt_no or "",
                row.reminder_date.isoformat(),
                row.reminder_status,
                row.valid_until.isoformat(),
                row.currency,
                row.refundable_amount,
            ]
            for row in report.rows
        ]
        return self._export_response(
            filename="finance-customs-receipt-collection.csv",
            headers=[
                "核销单号",
                "领用日期",
                "业务员",
                "出运单",
                "客户",
                "报关单号",
                "报关回单号",
                "提醒日期",
                "催收状态",
                "有效期",
                "币种",
                "可退税额",
            ],
            rows=rows,
        )

    async def export_tax_refund_statistics(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None = None,
        date_to: date | None = None,
        currency: str | None = None,
        status: str | None = None,
    ) -> FinanceReportExportResponse:
        self._require_export(current_user)
        report = await self.get_tax_refund_statistics(
            current_user=current_user,
            date_from=date_from,
            date_to=date_to,
            currency=currency,
            status=status,
        )
        rows = [
            [
                "状态汇总",
                item.status,
                item.currency,
                item.document_count,
                item.refundable_amount,
                item.refunded_amount,
                item.outstanding_amount,
            ]
            for item in report.status_summaries
        ]
        rows.extend(
            [
                "币种汇总",
                "",
                item.currency,
                item.document_count,
                item.refundable_amount,
                item.refunded_amount,
                item.outstanding_amount,
            ]
            for item in report.currency_totals
        )
        return self._export_response(
            filename="finance-tax-refund-statistics.csv",
            headers=["汇总类型", "状态", "币种", "核销单数", "可退税额", "已退税额", "待退税额"],
            rows=rows,
        )

    async def explain_report(
        self,
        *,
        current_user: CurrentUserResponse,
        report_key: str,
    ) -> FinanceReportExplanationResponse:
        self._require_finance(current_user)
        try:
            return _REPORT_EXPLANATIONS[report_key]
        except KeyError as exc:
            raise ValueError("财务报表不存在") from exc

    async def drilldown_report(
        self,
        *,
        current_user: CurrentUserResponse,
        report_key: str,
        source_no: str,
    ) -> FinanceReportDrilldownResponse:
        self._require_finance(current_user)
        source_type = _REPORT_SOURCE_TYPES.get(report_key)
        if source_type is None:
            raise ValueError("财务报表不存在")
        items = await self._drilldown_items(report_key=report_key, source_no=source_no)
        return FinanceReportDrilldownResponse(
            report_key=report_key,
            source_type=source_type,
            source_no=source_no,
            items=items,
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

    def _require_export(self, current_user: CurrentUserResponse) -> None:
        self._require_finance(current_user)
        if "finance:report:export" not in current_user.permissions:
            raise PermissionDeniedError

    def _export_response(
        self,
        *,
        filename: str,
        headers: list[str],
        rows: Sequence[Sequence[object]],
    ) -> FinanceReportExportResponse:
        csv_content = self._tabular_content(headers=headers, rows=rows)
        return FinanceReportExportResponse(
            filename=filename,
            content_type="text/csv",
            content=csv_content,
            total=len(rows),
        )

    def _tabular_content(
        self,
        *,
        headers: list[str],
        rows: Sequence[Sequence[object]],
    ) -> str:
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(rows)
        return output.getvalue()

    async def _drilldown_items(
        self,
        *,
        report_key: str,
        source_no: str,
    ) -> list[FinanceReportDrilldownItem]:
        if not source_no:
            return []
        if not await self._source_exists(report_key=report_key, source_no=source_no):
            return []
        route_by_report = {
            "receipt-usage": "/finance/receipts",
            "goods-payment": "/finance/payments",
            "fee-payment": "/finance/fees",
            "customs-receipt-collection": "/finance/tax",
        }
        return [
            FinanceReportDrilldownItem(
                label="来源单据",
                value=source_no,
                target_path=route_by_report.get(report_key),
            )
        ]

    async def _source_exists(self, *, report_key: str, source_no: str) -> bool:
        if report_key == "receipt-usage":
            return await self._repository.exists_bank_receipt(source_no)
        if report_key == "goods-payment":
            return await self._repository.exists_goods_payment(source_no)
        if report_key == "fee-payment":
            return await self._repository.exists_fee_payment(source_no)
        if report_key == "customs-receipt-collection":
            return await self._repository.exists_verification_document(source_no)
        return False


_REPORT_SOURCE_TYPES = {
    "receipt-usage": "bank_receipt",
    "goods-payment": "payment_request",
    "fee-payment": "fee_payment_request",
    "customs-receipt-collection": "verification_document",
}


_REPORT_EXPLANATIONS = {
    "receipt-usage": FinanceReportExplanationResponse(
        report_key="receipt-usage",
        title="水单使用情况明细表",
        source_tables=["finance_bank_receipts", "finance_receipt_allocations"],
        metric_rules=[
            "按水单分摊日期筛选。",
            "金额取银行水单分摊明细金额，币种取分摊币种。",
        ],
        fields=[
            FinanceReportFieldExplanation(
                label="水单号",
                field="receipt_no",
                formula="finance_bank_receipts.receipt_no",
            ),
            FinanceReportFieldExplanation(
                label="分摊金额",
                field="amount",
                formula="finance_receipt_allocations.amount",
            ),
        ],
    ),
    "bank-receipt-summary": FinanceReportExplanationResponse(
        report_key="bank-receipt-summary",
        title="银行水单汇总表",
        source_tables=["finance_bank_receipts"],
        metric_rules=["按收款日期筛选，并按币种/经办人汇总。"],
        fields=[
            FinanceReportFieldExplanation(
                label="总金额",
                field="total_amount",
                formula="sum(amount)",
            ),
            FinanceReportFieldExplanation(
                label="未分摊",
                field="unallocated_amount",
                formula="sum(amount) - sum(allocated_amount)",
            ),
        ],
    ),
    "goods-payment": FinanceReportExplanationResponse(
        report_key="goods-payment",
        title="货款支付情况查询",
        source_tables=["finance_payment_requests"],
        metric_rules=["按付款申请日期筛选，未付金额=申请金额-已付金额。"],
        fields=[
            FinanceReportFieldExplanation(
                label="付款单号",
                field="request_no",
                formula="finance_payment_requests.request_no",
            ),
            FinanceReportFieldExplanation(
                label="未付金额",
                field="outstanding_amount",
                formula="requested_amount - paid_amount",
            ),
        ],
    ),
    "fee-payment": FinanceReportExplanationResponse(
        report_key="fee-payment",
        title="费用支付情况查询",
        source_tables=["finance_fee_payment_requests"],
        metric_rules=["按付费申请日期筛选，支持合作伙伴、费用类型、业务员和状态筛选。"],
        fields=[
            FinanceReportFieldExplanation(
                label="付费单号",
                field="request_no",
                formula="finance_fee_payment_requests.request_no",
            ),
            FinanceReportFieldExplanation(
                label="未付金额",
                field="outstanding_amount",
                formula="requested_amount - paid_amount",
            ),
        ],
    ),
    "customs-receipt-collection": FinanceReportExplanationResponse(
        report_key="customs-receipt-collection",
        title="报关回单催收查询",
        source_tables=["finance_verification_documents"],
        metric_rules=["默认仅统计未登记报关回单的核销单，可选择包含已登记记录。"],
        fields=[
            FinanceReportFieldExplanation(
                label="核销单号",
                field="document_no",
                formula="finance_verification_documents.document_no",
            ),
            FinanceReportFieldExplanation(
                label="催收状态",
                field="reminder_status",
                formula="finance_verification_documents.reminder_status",
            ),
        ],
    ),
    "tax-refund-statistics": FinanceReportExplanationResponse(
        report_key="tax-refund-statistics",
        title="申报退税统计",
        source_tables=[
            "finance_verification_documents",
            "finance_verification_tax_refunds",
        ],
        metric_rules=["可退税额来自核销单，已退税额来自退税登记，待退税额=可退税额-已退税额。"],
        fields=[
            FinanceReportFieldExplanation(
                label="可退税额",
                field="refundable_amount",
                formula="sum(finance_verification_documents.refundable_amount)",
            ),
            FinanceReportFieldExplanation(
                label="已退税额",
                field="refunded_amount",
                formula="sum(finance_verification_documents.refunded_amount)",
            ),
        ],
    ),
}
