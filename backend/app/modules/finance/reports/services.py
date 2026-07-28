"""Service layer for finance statistical reports.

Every report method enforces the ``finance:view`` permission and converts the
read-only repository rows into response schemas.
"""

from datetime import date

from app.modules.finance.reports.report_definitions import (
    REPORT_EXPLANATIONS,
    REPORT_SOURCE_TYPES,
)
from app.modules.finance.reports.repositories import ReportsRepository
from app.modules.finance.reports.schemas import (
    BankReceiptSummaryResponse,
    CustomsReceiptCollectionResponse,
    FeePaymentQueryResponse,
    FinanceReportDrilldownResponse,
    FinanceReportExplanationResponse,
    FinanceReportExportResponse,
    GoodsPaymentQueryResponse,
    ReceiptUsageDetailResponse,
    TaxRefundStatisticsResponse,
)
from app.modules.finance.reports.service_support import (
    PermissionDeniedError as PermissionDeniedError,
)
from app.modules.finance.reports.service_support import (
    ReportsServiceSupport,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class ReportsService(ReportsServiceSupport):
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
            currency_summaries=[self._bank_currency_summary(item) for item in currency_summaries],
            operator_summaries=[self._bank_operator_summary(item) for item in operator_summaries],
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
            currency_summaries=[self._goods_currency_summary(item) for item in summaries],
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
            status_summaries=[self._tax_status_summary(item) for item in status_summaries],
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
            return REPORT_EXPLANATIONS[report_key]
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
        source_type = REPORT_SOURCE_TYPES.get(report_key)
        if source_type is None:
            raise ValueError("财务报表不存在")
        items = await self._drilldown_items(report_key=report_key, source_no=source_no)
        return FinanceReportDrilldownResponse(
            report_key=report_key,
            source_type=source_type,
            source_no=source_no,
            items=items,
        )
