from collections.abc import Iterable
from decimal import Decimal

from app.modules.finance.overview.repositories import (
    FinanceCurrencySummaryRow,
    FinanceOverviewRepository,
    FinanceStatusAmountRow,
)
from app.modules.finance.overview.schemas import (
    FinanceCurrencySummaryResponse,
    FinanceOverviewResponse,
    FinanceOverviewSummaryResponse,
    FinancePartnerTypeSummaryResponse,
    FinanceShipmentProfitResponse,
    FinanceStatusAmountResponse,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class FinanceOverviewService:
    def __init__(self, repository: FinanceOverviewRepository) -> None:
        self._repository = repository

    async def get_overview(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> FinanceOverviewResponse:
        self._require(current_user, "finance:view")
        currency_summaries = await self._repository.list_currency_summaries()
        invoice_statuses = await self._repository.list_invoice_notice_statuses()
        sample_fee_statuses = await self._repository.list_sample_fee_statuses()
        partner_summary = await self._repository.get_partner_summary()
        partner_type_summaries = await self._repository.list_partner_type_summaries()
        shipment_profit_items = await self._repository.list_recent_shipment_profits()

        return FinanceOverviewResponse(
            summary=FinanceOverviewSummaryResponse(
                shipment_count=sum(item.shipment_count for item in currency_summaries),
                currency_label=self._currency_label(currency_summaries),
                receivable_amount=self._money_sum(
                    item.receivable_amount for item in currency_summaries
                ),
                payable_amount=self._money_sum(item.payable_amount for item in currency_summaries),
                profit_amount=self._money_sum(item.profit_amount for item in currency_summaries),
                profit_rate=self._combined_profit_rate(currency_summaries),
                invoice_notice_count=sum(item.count for item in invoice_statuses),
                invoice_notice_amount=self._money_sum(item.amount for item in invoice_statuses),
                sample_fee_count=sum(item.count for item in sample_fee_statuses),
                sample_fee_amount=self._money_sum(item.amount for item in sample_fee_statuses),
                partner_count=partner_summary.total_count,
                active_partner_count=partner_summary.active_count,
            ),
            currency_summaries=[
                FinanceCurrencySummaryResponse(
                    currency=item.currency,
                    shipment_count=item.shipment_count,
                    receivable_amount=item.receivable_amount,
                    payable_amount=item.payable_amount,
                    profit_amount=item.profit_amount,
                    profit_rate=item.profit_rate,
                )
                for item in currency_summaries
            ],
            invoice_notice_statuses=[
                self._status_amount_response(item) for item in invoice_statuses
            ],
            sample_fee_statuses=[
                self._status_amount_response(item) for item in sample_fee_statuses
            ],
            partner_type_summaries=[
                FinancePartnerTypeSummaryResponse(
                    partner_type=item.partner_type,
                    count=item.count,
                )
                for item in partner_type_summaries
            ],
            shipment_profit_items=[
                FinanceShipmentProfitResponse(
                    id=item.id,
                    code=item.code,
                    shipment_date=item.shipment_date,
                    planned_ship_date=item.planned_ship_date,
                    customer_name=item.customer_name,
                    currency=item.currency,
                    approval_status=item.approval_status,
                    receivable_amount=item.receivable_amount,
                    payable_amount=item.payable_amount,
                    profit_amount=item.profit_amount,
                    profit_rate=item.profit_rate,
                )
                for item in shipment_profit_items
            ],
        )

    def _status_amount_response(
        self,
        row: FinanceStatusAmountRow,
    ) -> FinanceStatusAmountResponse:
        return FinanceStatusAmountResponse(
            status=row.status,
            currency=row.currency,
            count=row.count,
            amount=row.amount,
        )

    def _currency_label(self, rows: list[FinanceCurrencySummaryRow]) -> str:
        if not rows:
            return "-"
        if len(rows) == 1:
            return rows[0].currency
        return "多币种"

    def _combined_profit_rate(self, rows: list[FinanceCurrencySummaryRow]) -> str:
        receivable_amount = sum(
            (self._decimal(item.receivable_amount) for item in rows),
            Decimal("0"),
        )
        profit_amount = sum((self._decimal(item.profit_amount) for item in rows), Decimal("0"))
        if receivable_amount == 0:
            return "0.00"
        return self._money((profit_amount / receivable_amount) * Decimal("100"))

    def _money_sum(self, values: Iterable[str]) -> str:
        return self._money(sum((self._decimal(value) for value in values), Decimal("0")))

    def _money(self, value: Decimal | int | str) -> str:
        return f"{self._decimal(value):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError
