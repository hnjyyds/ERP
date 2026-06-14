from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.modules.finance.fee_payments.models import PartnerFeeInvoice
from app.modules.finance.misc_fees.models import MiscFeeAllocation
from app.modules.finance.settlements.models import FinancialSettlement, ProfitCostLink
from app.modules.finance.tax_refunds.models import VerificationDocument, VerificationTaxRefund
from app.modules.sales.shipments.models import ShipmentPlan


@dataclass(frozen=True)
class ShipmentSettlementSnapshotRow:
    id: str
    code: str
    shipment_date: date
    customer_name: str
    currency: str
    receivable_amount: str
    payable_amount: str
    approval_status: str


@dataclass(frozen=True)
class SettlementSourceAmountsRow:
    sales_income: str
    purchase_cost_amount: str
    partner_fee_amount: str
    misc_fee_amount: str
    tax_refund_amount: str


@dataclass(frozen=True)
class FinancialSettlementRow:
    id: str
    settlement_no: str
    shipment_plan_id: str
    shipment_no: str
    customer_name: str
    settlement_date: date
    currency: str
    sales_income: str
    purchase_cost_amount: str
    partner_fee_amount: str
    misc_fee_amount: str
    tax_refund_amount: str
    manual_cost_amount: str
    gross_profit: str
    gross_profit_rate: str
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime


@dataclass(frozen=True)
class ProfitCostLinkRow:
    id: str
    settlement_id: str
    shipment_plan_id: str
    shipment_no: str
    cost_no: str
    cost_type: str
    source_type: str
    source_id: str | None
    source_no: str | None
    cost_date: date
    amount: str
    currency: str
    direction: str
    reason: str | None
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime


class FinancialSettlementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_shipment_snapshot(
        self,
        shipment_plan_id: str,
    ) -> ShipmentSettlementSnapshotRow | None:
        shipment = await self.session.get(ShipmentPlan, shipment_plan_id)
        if shipment is None:
            return None
        return self._map_shipment_snapshot(shipment)

    async def get_settlement(self, settlement_id: str) -> FinancialSettlementRow | None:
        settlement = await self.session.get(FinancialSettlement, settlement_id)
        if settlement is None:
            return None
        return self._map_settlement(settlement)

    async def get_settlement_by_shipment(
        self,
        shipment_plan_id: str,
    ) -> FinancialSettlementRow | None:
        settlement = await self.session.scalar(
            select(FinancialSettlement).where(
                FinancialSettlement.shipment_plan_id == shipment_plan_id
            )
        )
        if settlement is None:
            return None
        return self._map_settlement(settlement)

    async def get_source_amounts(
        self,
        *,
        shipment: ShipmentSettlementSnapshotRow,
        settlement_date: date,
    ) -> SettlementSourceAmountsRow:
        partner_fee_amount = await self._sum_partner_fees(
            shipment_plan_id=shipment.id,
            currency=shipment.currency,
            settlement_date=settlement_date,
        )
        misc_fee_amount = await self._sum_misc_fees(
            shipment_plan_id=shipment.id,
            currency=shipment.currency,
            settlement_date=settlement_date,
        )
        tax_refund_amount = await self._sum_tax_refunds(
            shipment_plan_id=shipment.id,
            currency=shipment.currency,
            settlement_date=settlement_date,
        )
        return SettlementSourceAmountsRow(
            sales_income=shipment.receivable_amount,
            purchase_cost_amount=shipment.payable_amount,
            partner_fee_amount=self._money(partner_fee_amount),
            misc_fee_amount=self._money(misc_fee_amount),
            tax_refund_amount=self._money(tax_refund_amount),
        )

    async def create_settlement(
        self,
        *,
        settlement_no: str,
        shipment: ShipmentSettlementSnapshotRow,
        settlement_date: date,
        source_amounts: SettlementSourceAmountsRow,
        gross_profit: Decimal,
        gross_profit_rate: Decimal,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> FinancialSettlementRow:
        settlement = FinancialSettlement(
            settlement_no=settlement_no,
            shipment_plan_id=shipment.id,
            shipment_no=shipment.code,
            customer_name=shipment.customer_name,
            settlement_date=settlement_date,
            currency=shipment.currency,
            sales_income=Decimal(source_amounts.sales_income),
            purchase_cost_amount=Decimal(source_amounts.purchase_cost_amount),
            partner_fee_amount=Decimal(source_amounts.partner_fee_amount),
            misc_fee_amount=Decimal(source_amounts.misc_fee_amount),
            tax_refund_amount=Decimal(source_amounts.tax_refund_amount),
            manual_cost_amount=Decimal("0"),
            gross_profit=gross_profit,
            gross_profit_rate=gross_profit_rate,
            status="locked",
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(settlement)
        await self.session.flush()
        return self._map_settlement(settlement)

    async def create_cost_item(
        self,
        *,
        settlement: FinancialSettlementRow,
        cost_no: str,
        cost_type: str,
        source_type: str,
        source_id: str | None,
        source_no: str | None,
        cost_date: date,
        amount: Decimal | str,
        currency: str,
        direction: str,
        reason: str | None,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> ProfitCostLinkRow:
        item = ProfitCostLink(
            settlement_id=settlement.id,
            shipment_plan_id=settlement.shipment_plan_id,
            shipment_no=settlement.shipment_no,
            cost_no=cost_no,
            cost_type=cost_type,
            source_type=source_type,
            source_id=source_id,
            source_no=source_no,
            cost_date=cost_date,
            amount=Decimal(str(amount)),
            currency=currency,
            direction=direction,
            reason=reason,
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(item)
        await self.session.flush()
        return self._map_cost_item(item)

    async def refresh_settlement_profit(
        self,
        settlement_id: str,
    ) -> FinancialSettlementRow | None:
        settlement = await self.session.get(FinancialSettlement, settlement_id)
        if settlement is None:
            return None
        manual_cost_amount = await self.session.scalar(
            select(func.coalesce(func.sum(ProfitCostLink.amount), 0)).where(
                ProfitCostLink.settlement_id == settlement_id,
                ProfitCostLink.source_type == "manual_cost",
                ProfitCostLink.direction == "cost",
            )
        )
        settlement.manual_cost_amount = self._decimal(manual_cost_amount)
        gross_profit = (
            self._decimal(settlement.sales_income)
            + self._decimal(settlement.tax_refund_amount)
            - self._decimal(settlement.purchase_cost_amount)
            - self._decimal(settlement.partner_fee_amount)
            - self._decimal(settlement.misc_fee_amount)
            - settlement.manual_cost_amount
        )
        settlement.gross_profit = gross_profit
        settlement.gross_profit_rate = self._gross_profit_rate(
            gross_profit,
            self._decimal(settlement.sales_income),
        )
        await self.session.flush()
        return self._map_settlement(settlement)

    async def list_settlements(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        shipment_no: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[FinancialSettlementRow], int]:
        statement = select(FinancialSettlement)
        count_statement = select(func.count()).select_from(FinancialSettlement)
        for condition in self._settlement_conditions(q=q, status=status, shipment_no=shipment_no):
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                FinancialSettlement.settlement_date.desc(),
                FinancialSettlement.settlement_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._settlement_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_settlement(row) for row in rows], int(total or 0)

    async def list_cost_items(self, settlement_id: str) -> list[ProfitCostLinkRow]:
        rows = await self.session.scalars(
            select(ProfitCostLink)
            .where(ProfitCostLink.settlement_id == settlement_id)
            .order_by(
                ProfitCostLink.cost_date.asc(),
                ProfitCostLink.direction.desc(),
                ProfitCostLink.cost_no.asc(),
            )
        )
        return [self._map_cost_item(row) for row in rows]

    async def _sum_partner_fees(
        self,
        *,
        shipment_plan_id: str,
        currency: str,
        settlement_date: date,
    ) -> Decimal:
        amount = await self.session.scalar(
            select(func.coalesce(func.sum(PartnerFeeInvoice.total_amount), 0)).where(
                PartnerFeeInvoice.shipment_plan_id == shipment_plan_id,
                PartnerFeeInvoice.currency == currency,
                PartnerFeeInvoice.invoice_date <= settlement_date,
            )
        )
        return self._decimal(amount)

    async def _sum_misc_fees(
        self,
        *,
        shipment_plan_id: str,
        currency: str,
        settlement_date: date,
    ) -> Decimal:
        amount = await self.session.scalar(
            select(func.coalesce(func.sum(MiscFeeAllocation.amount), 0)).where(
                MiscFeeAllocation.shipment_plan_id == shipment_plan_id,
                MiscFeeAllocation.currency == currency,
                MiscFeeAllocation.status == "allocated",
                MiscFeeAllocation.allocated_at <= settlement_date,
            )
        )
        return self._decimal(amount)

    async def _sum_tax_refunds(
        self,
        *,
        shipment_plan_id: str,
        currency: str,
        settlement_date: date,
    ) -> Decimal:
        amount = await self.session.scalar(
            select(func.coalesce(func.sum(VerificationTaxRefund.amount), 0))
            .join(
                VerificationDocument,
                VerificationTaxRefund.verification_document_id == VerificationDocument.id,
            )
            .where(
                VerificationDocument.shipment_plan_id == shipment_plan_id,
                VerificationTaxRefund.currency == currency,
                VerificationTaxRefund.refunded_at <= settlement_date,
            )
        )
        return self._decimal(amount)

    def _settlement_conditions(
        self,
        *,
        q: str | None,
        status: str | None,
        shipment_no: str | None,
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    FinancialSettlement.settlement_no.ilike(pattern),
                    FinancialSettlement.shipment_no.ilike(pattern),
                    FinancialSettlement.customer_name.ilike(pattern),
                )
            )
        if status:
            conditions.append(FinancialSettlement.status == status)
        if shipment_no:
            conditions.append(FinancialSettlement.shipment_no == shipment_no)
        return conditions

    async def _settlement_scalars(
        self,
        statement: Select[tuple[FinancialSettlement]],
    ) -> list[FinancialSettlement]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_shipment_snapshot(self, shipment: ShipmentPlan) -> ShipmentSettlementSnapshotRow:
        return ShipmentSettlementSnapshotRow(
            id=shipment.id,
            code=shipment.code,
            shipment_date=shipment.shipment_date,
            customer_name=shipment.customer_name,
            currency=shipment.currency,
            receivable_amount=self._money(shipment.receivable_amount),
            payable_amount=self._money(shipment.payable_amount),
            approval_status=shipment.approval_status,
        )

    def _map_settlement(self, settlement: FinancialSettlement) -> FinancialSettlementRow:
        return FinancialSettlementRow(
            id=settlement.id,
            settlement_no=settlement.settlement_no,
            shipment_plan_id=settlement.shipment_plan_id,
            shipment_no=settlement.shipment_no,
            customer_name=settlement.customer_name,
            settlement_date=settlement.settlement_date,
            currency=settlement.currency,
            sales_income=self._money(settlement.sales_income),
            purchase_cost_amount=self._money(settlement.purchase_cost_amount),
            partner_fee_amount=self._money(settlement.partner_fee_amount),
            misc_fee_amount=self._money(settlement.misc_fee_amount),
            tax_refund_amount=self._money(settlement.tax_refund_amount),
            manual_cost_amount=self._money(settlement.manual_cost_amount),
            gross_profit=self._money(settlement.gross_profit),
            gross_profit_rate=self._money(settlement.gross_profit_rate),
            status=settlement.status,
            remark=settlement.remark,
            created_by_user_id=settlement.created_by_user_id,
            created_by_user_name=settlement.created_by_user_name,
            created_at=settlement.created_at,
        )

    def _map_cost_item(self, item: ProfitCostLink) -> ProfitCostLinkRow:
        return ProfitCostLinkRow(
            id=item.id,
            settlement_id=item.settlement_id,
            shipment_plan_id=item.shipment_plan_id,
            shipment_no=item.shipment_no,
            cost_no=item.cost_no,
            cost_type=item.cost_type,
            source_type=item.source_type,
            source_id=item.source_id,
            source_no=item.source_no,
            cost_date=item.cost_date,
            amount=self._money(item.amount),
            currency=item.currency,
            direction=item.direction,
            reason=item.reason,
            remark=item.remark,
            created_by_user_id=item.created_by_user_id,
            created_by_user_name=item.created_by_user_name,
            created_at=item.created_at,
        )

    def _gross_profit_rate(self, gross_profit: Decimal, sales_income: Decimal) -> Decimal:
        if sales_income == 0:
            return Decimal("0")
        return (gross_profit / sales_income) * Decimal("100")

    def _money(self, value: Decimal | int | str) -> str:
        return f"{self._decimal(value):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
