from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.partners.models import Partner
from app.modules.purchase.invoice_notices.models import PurchaseInvoiceNotice
from app.modules.sales.shipments.models import ShipmentPlan
from app.modules.sample.requests.models import SampleFee


@dataclass(frozen=True)
class FinanceCurrencySummaryRow:
    currency: str
    shipment_count: int
    receivable_amount: str
    payable_amount: str
    profit_amount: str
    profit_rate: str


@dataclass(frozen=True)
class FinanceStatusAmountRow:
    status: str
    currency: str
    count: int
    amount: str


@dataclass(frozen=True)
class FinancePartnerSummaryRow:
    total_count: int
    active_count: int


@dataclass(frozen=True)
class FinancePartnerTypeSummaryRow:
    partner_type: str
    count: int


@dataclass(frozen=True)
class FinanceShipmentProfitRow:
    id: str
    code: str
    shipment_date: date
    planned_ship_date: date
    customer_name: str
    currency: str
    approval_status: str
    receivable_amount: str
    payable_amount: str
    profit_amount: str
    profit_rate: str


class FinanceOverviewRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_currency_summaries(self) -> list[FinanceCurrencySummaryRow]:
        result = await self.session.execute(
            select(
                ShipmentPlan.currency,
                func.count(ShipmentPlan.id),
                func.coalesce(func.sum(ShipmentPlan.receivable_amount), 0),
                func.coalesce(func.sum(ShipmentPlan.payable_amount), 0),
                func.coalesce(func.sum(ShipmentPlan.profit_amount), 0),
            )
            .group_by(ShipmentPlan.currency)
            .order_by(ShipmentPlan.currency.asc())
        )
        rows: list[FinanceCurrencySummaryRow] = []
        for currency, count, receivable, payable, profit in result.all():
            receivable_amount = self._decimal(receivable)
            profit_amount = self._decimal(profit)
            rows.append(
                FinanceCurrencySummaryRow(
                    currency=str(currency),
                    shipment_count=int(count or 0),
                    receivable_amount=self._money(receivable_amount),
                    payable_amount=self._money(payable),
                    profit_amount=self._money(profit_amount),
                    profit_rate=self._rate(profit_amount, receivable_amount),
                )
            )
        return rows

    async def list_invoice_notice_statuses(self) -> list[FinanceStatusAmountRow]:
        result = await self.session.execute(
            select(
                PurchaseInvoiceNotice.status,
                PurchaseInvoiceNotice.currency,
                func.count(PurchaseInvoiceNotice.id),
                func.coalesce(func.sum(PurchaseInvoiceNotice.total_amount), 0),
            )
            .group_by(PurchaseInvoiceNotice.status, PurchaseInvoiceNotice.currency)
            .order_by(PurchaseInvoiceNotice.status.asc(), PurchaseInvoiceNotice.currency.asc())
        )
        return [
            FinanceStatusAmountRow(
                status=str(status),
                currency=str(currency),
                count=int(count or 0),
                amount=self._money(amount),
            )
            for status, currency, count, amount in result.all()
        ]

    async def list_sample_fee_statuses(self) -> list[FinanceStatusAmountRow]:
        result = await self.session.execute(
            select(
                SampleFee.payment_status,
                SampleFee.currency,
                func.count(SampleFee.id),
                func.coalesce(func.sum(SampleFee.amount), 0),
            )
            .group_by(SampleFee.payment_status, SampleFee.currency)
            .order_by(SampleFee.payment_status.asc(), SampleFee.currency.asc())
        )
        return [
            FinanceStatusAmountRow(
                status=str(status),
                currency=str(currency),
                count=int(count or 0),
                amount=self._money(amount),
            )
            for status, currency, count, amount in result.all()
        ]

    async def get_partner_summary(self) -> FinancePartnerSummaryRow:
        total_count = await self.session.scalar(select(func.count(Partner.id)))
        active_count = await self.session.scalar(
            select(func.count(Partner.id)).where(Partner.status == "active")
        )
        return FinancePartnerSummaryRow(
            total_count=int(total_count or 0),
            active_count=int(active_count or 0),
        )

    async def list_partner_type_summaries(self) -> list[FinancePartnerTypeSummaryRow]:
        result = await self.session.execute(
            select(Partner.partner_type, func.count(Partner.id))
            .where(Partner.status == "active")
            .group_by(Partner.partner_type)
            .order_by(Partner.partner_type.asc())
        )
        return [
            FinancePartnerTypeSummaryRow(
                partner_type=str(partner_type),
                count=int(count or 0),
            )
            for partner_type, count in result.all()
        ]

    async def list_recent_shipment_profits(
        self,
        *,
        limit: int = 8,
    ) -> list[FinanceShipmentProfitRow]:
        rows = await self.session.scalars(
            select(ShipmentPlan)
            .order_by(ShipmentPlan.shipment_date.desc(), ShipmentPlan.code.asc())
            .limit(limit)
        )
        return [self._map_shipment_profit(row) for row in rows]

    def _map_shipment_profit(self, shipment: ShipmentPlan) -> FinanceShipmentProfitRow:
        return FinanceShipmentProfitRow(
            id=shipment.id,
            code=shipment.code,
            shipment_date=shipment.shipment_date,
            planned_ship_date=shipment.planned_ship_date,
            customer_name=shipment.customer_name,
            currency=shipment.currency,
            approval_status=shipment.approval_status,
            receivable_amount=self._money(shipment.receivable_amount),
            payable_amount=self._money(shipment.payable_amount),
            profit_amount=self._money(shipment.profit_amount),
            profit_rate=self._money(shipment.profit_rate),
        )

    def _rate(self, profit_amount: Decimal, receivable_amount: Decimal) -> str:
        if receivable_amount == 0:
            return "0.00"
        return self._money((profit_amount / receivable_amount) * Decimal("100"))

    def _money(self, value: Decimal | int | str) -> str:
        return f"{self._decimal(value):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
