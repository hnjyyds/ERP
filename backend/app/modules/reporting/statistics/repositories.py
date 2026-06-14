from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.modules.finance.settlements.models import FinancialSettlement
from app.modules.purchase.contracts.models import PurchaseContract
from app.modules.sales.contracts.models import ExportContract
from app.modules.sales.shipments.models import ShipmentLine, ShipmentPlan


@dataclass(frozen=True)
class ContractStatisticRow:
    document_id: str
    document_no: str
    party_id: str | None
    party_name: str
    business_user_id: str | None
    business_user_name: str | None
    business_date: date
    status: str
    amount: str
    currency: str
    source_path: str


@dataclass(frozen=True)
class ShipmentStatisticRow:
    shipment_id: str
    shipment_no: str
    customer_id: str | None
    customer_name: str
    shipment_date: date
    status: str
    receivable_amount: str
    profit_amount: str
    currency: str
    source_path: str


@dataclass(frozen=True)
class SalesShipmentLineStatisticRow:
    shipment_id: str
    period: str
    sales_user_id: str | None
    sales_user_name: str | None
    amount: str
    currency: str


@dataclass(frozen=True)
class SettlementStatisticRow:
    settlement_id: str
    settlement_no: str
    settlement_date: date
    customer_name: str
    gross_profit: str
    currency: str


class StatisticsQueryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_export_contracts(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        sales_user_id: str | None,
        approval_status: str | None,
    ) -> list[ContractStatisticRow]:
        statement = select(ExportContract)
        for condition in self._export_contract_conditions(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            sales_user_id=sales_user_id,
            approval_status=approval_status,
        ):
            statement = statement.where(condition)
        statement = statement.order_by(
            ExportContract.contract_date.desc(),
            ExportContract.code.asc(),
        )
        contracts = await self._export_contract_scalars(statement)
        return [self._map_export_contract(contract) for contract in contracts]

    async def list_purchase_contracts(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        supplier_id: str | None,
        approval_status: str | None,
    ) -> list[ContractStatisticRow]:
        statement = select(PurchaseContract)
        for condition in self._purchase_contract_conditions(
            date_from=date_from,
            date_to=date_to,
            supplier_id=supplier_id,
            approval_status=approval_status,
        ):
            statement = statement.where(condition)
        statement = statement.order_by(
            PurchaseContract.contract_date.desc(),
            PurchaseContract.code.asc(),
        )
        contracts = await self._purchase_contract_scalars(statement)
        return [self._map_purchase_contract(contract) for contract in contracts]

    async def list_shipments(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        approval_status: str | None,
        sales_user_id: str | None,
    ) -> list[ShipmentStatisticRow]:
        statement = select(ShipmentPlan)
        for condition in self._shipment_conditions(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            approval_status=approval_status,
        ):
            statement = statement.where(condition)
        statement = statement.order_by(ShipmentPlan.shipment_date.desc(), ShipmentPlan.code.asc())
        shipments = await self._shipment_scalars(statement)
        if sales_user_id:
            sales_rows = await self.list_sales_shipment_lines(
                date_from=date_from,
                date_to=date_to,
                customer_id=customer_id,
                approval_status=approval_status,
                sales_user_id=sales_user_id,
            )
            allowed_ids = {row.shipment_id for row in sales_rows}
            shipments = [shipment for shipment in shipments if shipment.id in allowed_ids]
        return [self._map_shipment(shipment) for shipment in shipments]

    async def list_sales_shipment_lines(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        approval_status: str | None,
        sales_user_id: str | None,
    ) -> list[SalesShipmentLineStatisticRow]:
        statement = (
            select(ShipmentPlan, ShipmentLine, ExportContract)
            .join(ShipmentLine, ShipmentLine.shipment_id == ShipmentPlan.id)
            .join(ExportContract, ExportContract.id == ShipmentLine.contract_id)
        )
        for condition in self._shipment_conditions(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            approval_status=approval_status,
        ):
            statement = statement.where(condition)
        if sales_user_id:
            statement = statement.where(ExportContract.sales_user_id == sales_user_id)
        statement = statement.order_by(ShipmentPlan.shipment_date.desc(), ShipmentPlan.code.asc())
        result = await self.session.execute(statement)
        rows: list[SalesShipmentLineStatisticRow] = []
        for shipment, line, contract in result.all():
            rows.append(
                SalesShipmentLineStatisticRow(
                    shipment_id=shipment.id,
                    period=shipment.shipment_date.strftime("%Y-%m"),
                    sales_user_id=contract.sales_user_id,
                    sales_user_name=contract.sales_user_name,
                    amount=self._money(line.amount),
                    currency=shipment.currency,
                )
            )
        return rows

    async def list_settlements(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
    ) -> list[SettlementStatisticRow]:
        statement = select(FinancialSettlement)
        conditions: list[ColumnElement[bool]] = []
        if date_from is not None:
            conditions.append(FinancialSettlement.settlement_date >= date_from)
        if date_to is not None:
            conditions.append(FinancialSettlement.settlement_date <= date_to)
        for condition in conditions:
            statement = statement.where(condition)
        statement = statement.order_by(
            FinancialSettlement.settlement_date.desc(),
            FinancialSettlement.settlement_no.asc(),
        )
        result = await self.session.scalars(statement)
        return [
            SettlementStatisticRow(
                settlement_id=settlement.id,
                settlement_no=settlement.settlement_no,
                settlement_date=settlement.settlement_date,
                customer_name=settlement.customer_name,
                gross_profit=self._money(settlement.gross_profit),
                currency=settlement.currency,
            )
            for settlement in result.unique()
        ]

    def _export_contract_conditions(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        sales_user_id: str | None,
        approval_status: str | None,
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = []
        if date_from is not None:
            conditions.append(ExportContract.contract_date >= date_from)
        if date_to is not None:
            conditions.append(ExportContract.contract_date <= date_to)
        if customer_id:
            conditions.append(ExportContract.customer_id == customer_id)
        if sales_user_id:
            conditions.append(ExportContract.sales_user_id == sales_user_id)
        if approval_status:
            conditions.append(ExportContract.approval_status == approval_status)
        return conditions

    def _purchase_contract_conditions(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        supplier_id: str | None,
        approval_status: str | None,
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = []
        if date_from is not None:
            conditions.append(PurchaseContract.contract_date >= date_from)
        if date_to is not None:
            conditions.append(PurchaseContract.contract_date <= date_to)
        if supplier_id:
            conditions.append(PurchaseContract.supplier_id == supplier_id)
        if approval_status:
            conditions.append(PurchaseContract.approval_status == approval_status)
        return conditions

    def _shipment_conditions(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        approval_status: str | None,
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = []
        if date_from is not None:
            conditions.append(ShipmentPlan.shipment_date >= date_from)
        if date_to is not None:
            conditions.append(ShipmentPlan.shipment_date <= date_to)
        if customer_id:
            conditions.append(ShipmentPlan.customer_id == customer_id)
        if approval_status:
            conditions.append(ShipmentPlan.approval_status == approval_status)
        return conditions

    async def _export_contract_scalars(
        self,
        statement: Select[tuple[ExportContract]],
    ) -> list[ExportContract]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _purchase_contract_scalars(
        self,
        statement: Select[tuple[PurchaseContract]],
    ) -> list[PurchaseContract]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _shipment_scalars(
        self,
        statement: Select[tuple[ShipmentPlan]],
    ) -> list[ShipmentPlan]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_export_contract(self, contract: ExportContract) -> ContractStatisticRow:
        return ContractStatisticRow(
            document_id=contract.id,
            document_no=contract.code,
            party_id=contract.customer_id,
            party_name=contract.customer_name,
            business_user_id=contract.sales_user_id,
            business_user_name=contract.sales_user_name,
            business_date=contract.contract_date,
            status=contract.approval_status,
            amount=self._money(contract.total_amount),
            currency=contract.currency,
            source_path=f"/sales/contracts/{contract.id}",
        )

    def _map_purchase_contract(self, contract: PurchaseContract) -> ContractStatisticRow:
        return ContractStatisticRow(
            document_id=contract.id,
            document_no=contract.code,
            party_id=contract.supplier_id,
            party_name=contract.supplier_name,
            business_user_id=contract.buyer_user_id,
            business_user_name=contract.buyer_user_name,
            business_date=contract.contract_date,
            status=contract.approval_status,
            amount=self._money(contract.total_amount),
            currency=contract.currency,
            source_path=f"/purchase/contracts/{contract.id}",
        )

    def _map_shipment(self, shipment: ShipmentPlan) -> ShipmentStatisticRow:
        return ShipmentStatisticRow(
            shipment_id=shipment.id,
            shipment_no=shipment.code,
            customer_id=shipment.customer_id,
            customer_name=shipment.customer_name,
            shipment_date=shipment.shipment_date,
            status=shipment.approval_status,
            receivable_amount=self._money(shipment.receivable_amount),
            profit_amount=self._money(shipment.profit_amount),
            currency=shipment.currency,
            source_path=f"/sales/shipments/{shipment.id}",
        )

    def _money(self, value: Decimal | int | str) -> str:
        return f"{Decimal(str(value or 0)):.2f}"
