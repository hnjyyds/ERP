from collections.abc import Iterable
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.settlements.repositories import (
    FinancialSettlementRepository,
    FinancialSettlementRow,
    ProfitCostLinkRow,
    SettlementSourceAmountsRow,
    ShipmentSettlementSnapshotRow,
)
from app.modules.finance.settlements.schemas import (
    VALID_MANUAL_PROFIT_COST_TYPES,
    VALID_SETTLEMENT_STATUSES,
    FinancialSettlementCreate,
    FinancialSettlementListResponse,
    FinancialSettlementResponse,
    ManualProfitCostCreate,
    ProfitCalculationListResponse,
    ProfitCostItemResponse,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class FinancialSettlementNotFoundError(Exception):
    pass


class FinancialSettlementService:
    def __init__(self, repository: FinancialSettlementRepository) -> None:
        self._repository = repository

    async def create_settlement(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: FinancialSettlementCreate,
    ) -> FinancialSettlementResponse:
        self._require_finance(current_user)
        shipment = await self._resolve_shipment(payload)
        existing = await self._repository.get_settlement_by_shipment(shipment.id)
        if existing is not None:
            raise ValueError("该出运单已经生成财务结算")
        source_amounts = await self._repository.get_source_amounts(
            shipment=shipment,
            settlement_date=payload.settlement_date,
        )
        gross_profit = self._gross_profit(source_amounts=source_amounts, manual_cost_amount=0)
        gross_profit_rate = self._gross_profit_rate(
            gross_profit,
            self._decimal(source_amounts.sales_income),
        )

        async with UnitOfWork(self._repository.session):
            settlement = await self._repository.create_settlement(
                settlement_no=payload.settlement_no,
                shipment=shipment,
                settlement_date=payload.settlement_date,
                source_amounts=source_amounts,
                gross_profit=gross_profit,
                gross_profit_rate=gross_profit_rate,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
            await self._create_snapshot_cost_items(
                settlement=settlement,
                shipment=shipment,
                source_amounts=source_amounts,
                current_user=current_user,
            )
        return await self._settlement_response(settlement)

    async def list_settlements(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        shipment_no: str | None,
    ) -> FinancialSettlementListResponse:
        self._require_finance(current_user)
        self._validate_status(status)
        settlements, total = await self._repository.list_settlements(
            q=q,
            status=status,
            shipment_no=shipment_no,
        )
        responses = [await self._settlement_response(row) for row in settlements]
        return FinancialSettlementListResponse(
            items=responses,
            total=total,
            total_sales_income=self._money_sum(row.sales_income for row in settlements),
            total_gross_profit=self._money_sum(row.gross_profit for row in settlements),
        )

    async def add_manual_cost(
        self,
        *,
        current_user: CurrentUserResponse,
        settlement_id: str,
        payload: ManualProfitCostCreate,
    ) -> FinancialSettlementResponse:
        self._require_finance(current_user)
        self._validate_manual_cost_type(payload.cost_type)
        settlement = await self._get_settlement(settlement_id)
        if payload.currency != settlement.currency:
            raise ValueError("手工成本币种必须和结算单币种一致")
        if payload.cost_date > settlement.settlement_date:
            raise ValueError("手工成本日期不能晚于结算日期")

        async with UnitOfWork(self._repository.session):
            await self._repository.create_cost_item(
                settlement=settlement,
                cost_no=payload.cost_no,
                cost_type=payload.cost_type,
                source_type="manual_cost",
                source_id=None,
                source_no=payload.source_no,
                cost_date=payload.cost_date,
                amount=payload.amount,
                currency=payload.currency,
                direction="cost",
                reason=payload.reason,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
            refreshed = await self._repository.refresh_settlement_profit(settlement.id)
            if refreshed is None:
                raise FinancialSettlementNotFoundError
        return await self._settlement_response(refreshed)

    async def list_profit_calculations(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        shipment_no: str | None,
    ) -> ProfitCalculationListResponse:
        self._require_finance(current_user)
        settlements, total = await self._repository.list_settlements(
            q=q,
            status="locked",
            shipment_no=shipment_no,
        )
        responses = [await self._settlement_response(row) for row in settlements]
        return ProfitCalculationListResponse(
            items=responses,
            total=total,
            total_sales_income=self._money_sum(row.sales_income for row in settlements),
            total_gross_profit=self._money_sum(row.gross_profit for row in settlements),
        )

    async def _resolve_shipment(
        self,
        payload: FinancialSettlementCreate,
    ) -> ShipmentSettlementSnapshotRow:
        shipment = await self._repository.get_shipment_snapshot(payload.shipment_plan_id)
        if shipment is None:
            raise FinancialSettlementNotFoundError
        if payload.shipment_no is not None and payload.shipment_no != shipment.code:
            raise ValueError("结算出运单号和出运单标识不一致")
        if shipment.approval_status != "approved":
            raise ValueError("只有已审批出运单可以财务结算")
        if payload.settlement_date < shipment.shipment_date:
            raise ValueError("结算日期不能早于出运日期")
        return shipment

    async def _get_settlement(self, settlement_id: str) -> FinancialSettlementRow:
        settlement = await self._repository.get_settlement(settlement_id)
        if settlement is None:
            raise FinancialSettlementNotFoundError
        return settlement

    async def _create_snapshot_cost_items(
        self,
        *,
        settlement: FinancialSettlementRow,
        shipment: ShipmentSettlementSnapshotRow,
        source_amounts: SettlementSourceAmountsRow,
        current_user: CurrentUserResponse,
    ) -> None:
        await self._create_snapshot_cost_item(
            settlement=settlement,
            suffix="sales",
            cost_type="sales_income",
            source_type="shipment",
            source_id=shipment.id,
            source_no=shipment.code,
            amount=source_amounts.sales_income,
            direction="income",
            reason="结算销售收入快照",
            current_user=current_user,
        )
        await self._create_snapshot_cost_item(
            settlement=settlement,
            suffix="purchase",
            cost_type="purchase_cost",
            source_type="shipment",
            source_id=shipment.id,
            source_no=shipment.code,
            amount=source_amounts.purchase_cost_amount,
            direction="cost",
            reason="结算采购成本快照",
            current_user=current_user,
        )
        await self._create_nonzero_snapshot_item(
            settlement=settlement,
            suffix="partner-fee",
            cost_type="partner_fee",
            source_type="partner_fee_summary",
            source_id=shipment.id,
            source_no=shipment.code,
            amount=source_amounts.partner_fee_amount,
            direction="cost",
            reason="结算合作伙伴费用汇总",
            current_user=current_user,
        )
        await self._create_nonzero_snapshot_item(
            settlement=settlement,
            suffix="misc-fee",
            cost_type="misc_fee",
            source_type="misc_fee_summary",
            source_id=shipment.id,
            source_no=shipment.code,
            amount=source_amounts.misc_fee_amount,
            direction="cost",
            reason="结算杂费分摊汇总",
            current_user=current_user,
        )
        await self._create_nonzero_snapshot_item(
            settlement=settlement,
            suffix="tax-refund",
            cost_type="tax_refund",
            source_type="tax_refund_summary",
            source_id=shipment.id,
            source_no=shipment.code,
            amount=source_amounts.tax_refund_amount,
            direction="income",
            reason="结算退税收入汇总",
            current_user=current_user,
        )

    async def _create_nonzero_snapshot_item(
        self,
        *,
        settlement: FinancialSettlementRow,
        suffix: str,
        cost_type: str,
        source_type: str,
        source_id: str,
        source_no: str,
        amount: str,
        direction: str,
        reason: str,
        current_user: CurrentUserResponse,
    ) -> None:
        if self._decimal(amount) == 0:
            return
        await self._create_snapshot_cost_item(
            settlement=settlement,
            suffix=suffix,
            cost_type=cost_type,
            source_type=source_type,
            source_id=source_id,
            source_no=source_no,
            amount=amount,
            direction=direction,
            reason=reason,
            current_user=current_user,
        )

    async def _create_snapshot_cost_item(
        self,
        *,
        settlement: FinancialSettlementRow,
        suffix: str,
        cost_type: str,
        source_type: str,
        source_id: str,
        source_no: str,
        amount: str,
        direction: str,
        reason: str,
        current_user: CurrentUserResponse,
    ) -> None:
        await self._repository.create_cost_item(
            settlement=settlement,
            cost_no=self._snapshot_cost_no(settlement.settlement_no, suffix),
            cost_type=cost_type,
            source_type=source_type,
            source_id=source_id,
            source_no=source_no,
            cost_date=settlement.settlement_date,
            amount=amount,
            currency=settlement.currency,
            direction=direction,
            reason=reason,
            remark=None,
            created_by_user_id=current_user.id,
            created_by_user_name=current_user.display_name,
        )

    async def _settlement_response(
        self,
        settlement: FinancialSettlementRow,
    ) -> FinancialSettlementResponse:
        cost_items = await self._repository.list_cost_items(settlement.id)
        return FinancialSettlementResponse(
            id=settlement.id,
            settlement_no=settlement.settlement_no,
            shipment_plan_id=settlement.shipment_plan_id,
            shipment_no=settlement.shipment_no,
            customer_name=settlement.customer_name,
            settlement_date=settlement.settlement_date,
            currency=settlement.currency,
            sales_income=settlement.sales_income,
            purchase_cost_amount=settlement.purchase_cost_amount,
            partner_fee_amount=settlement.partner_fee_amount,
            misc_fee_amount=settlement.misc_fee_amount,
            tax_refund_amount=settlement.tax_refund_amount,
            manual_cost_amount=settlement.manual_cost_amount,
            gross_profit=settlement.gross_profit,
            gross_profit_rate=settlement.gross_profit_rate,
            status=settlement.status,
            remark=settlement.remark,
            created_by_user_id=settlement.created_by_user_id,
            created_by_user_name=settlement.created_by_user_name,
            created_at=settlement.created_at,
            cost_items=[self._cost_item_response(item) for item in cost_items],
        )

    def _cost_item_response(self, item: ProfitCostLinkRow) -> ProfitCostItemResponse:
        return ProfitCostItemResponse(
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
            amount=item.amount,
            currency=item.currency,
            direction=item.direction,
            reason=item.reason,
            remark=item.remark,
            created_by_user_id=item.created_by_user_id,
            created_by_user_name=item.created_by_user_name,
        )

    def _validate_status(self, status: str | None) -> None:
        if status is not None and status not in VALID_SETTLEMENT_STATUSES:
            raise ValueError("财务结算状态无效")

    def _validate_manual_cost_type(self, cost_type: str) -> None:
        if cost_type not in VALID_MANUAL_PROFIT_COST_TYPES:
            raise ValueError("手工成本类型无效")

    def _snapshot_cost_no(self, settlement_no: str, suffix: str) -> str:
        tail = f"-{suffix}"
        return f"{settlement_no[: 120 - len(tail)]}{tail}"

    def _gross_profit(
        self,
        *,
        source_amounts: SettlementSourceAmountsRow,
        manual_cost_amount: Decimal | int | str,
    ) -> Decimal:
        return (
            self._decimal(source_amounts.sales_income)
            + self._decimal(source_amounts.tax_refund_amount)
            - self._decimal(source_amounts.purchase_cost_amount)
            - self._decimal(source_amounts.partner_fee_amount)
            - self._decimal(source_amounts.misc_fee_amount)
            - self._decimal(manual_cost_amount)
        )

    def _gross_profit_rate(self, gross_profit: Decimal, sales_income: Decimal) -> Decimal:
        if sales_income == 0:
            return Decimal("0")
        return (gross_profit / sales_income) * Decimal("100")

    def _money_sum(self, values: Iterable[str]) -> str:
        return self._money(sum((self._decimal(value) for value in values), Decimal("0")))

    def _money(self, value: Decimal | int | str) -> str:
        return f"{self._decimal(value):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError
