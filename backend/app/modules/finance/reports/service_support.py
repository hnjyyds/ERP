"""Internal mapping, export, and drill-down helpers for finance reports."""

import csv
from collections.abc import Sequence
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
    CustomsReceiptCollectionRow,
    CustomsReceiptStatusSummary,
    FeePaymentCurrencySummary,
    FeePaymentQueryRow,
    FinanceReportDrilldownItem,
    FinanceReportExportResponse,
    GoodsPaymentCurrencySummary,
    GoodsPaymentQueryRow,
    ReceiptUsageCurrencySummary,
    ReceiptUsageDetailRow,
    TaxRefundCurrencyTotal,
    TaxRefundStatusSummary,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ReportsServiceSupport:
    _repository: ReportsRepository

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
