from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.warehouse.inbound_orders.models import (
    InboundOrder,
    InboundOrderLine,
    InventoryBalance,
    InventoryLedger,
)


@dataclass(frozen=True)
class InboundOrderRow:
    id: str
    code: str
    plan_id: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    inbound_type: str
    inbound_mode: str
    inbound_at: date
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    operator_name: str
    status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class InboundOrderLineRow:
    id: str
    order_id: str
    plan_line_id: str
    purchase_contract_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str
    stock_status: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class InventoryBalanceRow:
    id: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    product_id: str | None
    product_code: str | None
    product_name: str
    available_quantity: str
    locked_quantity: str
    pending_inspection_quantity: str
    unit: str
    created_at: datetime


@dataclass(frozen=True)
class InventoryLedgerRow:
    id: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    product_id: str | None
    product_code: str | None
    product_name: str
    direction: str
    quantity: str
    unit: str
    stock_status: str
    source_type: str
    source_id: str
    source_code: str
    occurred_at: date
    remark: str | None
    created_at: datetime


class InboundOrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_order(
        self,
        *,
        code: str,
        plan_id: str,
        purchase_contract_id: str,
        purchase_contract_no: str,
        supplier_id: str | None,
        supplier_name: str,
        inbound_type: str,
        inbound_mode: str,
        inbound_at: date,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        operator_name: str,
        status: str,
        owner_user_id: str,
    ) -> InboundOrderRow:
        order = InboundOrder(
            code=code,
            plan_id=plan_id,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            inbound_type=inbound_type,
            inbound_mode=inbound_mode,
            inbound_at=inbound_at,
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            operator_name=operator_name,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(order)
        await self.session.flush()
        return self._map_order(order)

    async def add_line(
        self,
        *,
        order_id: str,
        plan_line_id: str,
        purchase_contract_line_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        quantity: Decimal | str,
        unit: str,
        stock_status: str,
        remark: str | None,
    ) -> InboundOrderLineRow:
        line = InboundOrderLine(
            order_id=order_id,
            plan_line_id=plan_line_id,
            purchase_contract_line_id=purchase_contract_line_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            model=model,
            quantity=Decimal(str(quantity)),
            unit=unit,
            stock_status=stock_status,
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def get_order(self, order_id: str) -> InboundOrderRow | None:
        order = await self.session.get(InboundOrder, order_id)
        if order is None:
            return None
        return self._map_order(order)

    async def list_lines(self, order_id: str) -> list[InboundOrderLineRow]:
        rows = await self.session.scalars(
            select(InboundOrderLine)
            .where(InboundOrderLine.order_id == order_id)
            .order_by(InboundOrderLine.created_at.asc(), InboundOrderLine.id.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_orders(
        self,
        *,
        q: str | None,
        status: str | None,
        inbound_mode: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[InboundOrderRow], int]:
        statement = select(InboundOrder)
        count_statement = select(func.count()).select_from(InboundOrder)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(InboundOrderLine.id)
                .where(InboundOrderLine.order_id == InboundOrder.id)
                .where(
                    or_(
                        InboundOrderLine.product_code.ilike(pattern),
                        InboundOrderLine.product_name.ilike(pattern),
                        InboundOrderLine.specification.ilike(pattern),
                        InboundOrderLine.model.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    InboundOrder.code.ilike(pattern),
                    InboundOrder.purchase_contract_no.ilike(pattern),
                    InboundOrder.supplier_name.ilike(pattern),
                    line_exists,
                )
            )
        if status:
            conditions.append(InboundOrder.status == status)
        if inbound_mode:
            conditions.append(InboundOrder.inbound_mode == inbound_mode)
        if supplier_id:
            conditions.append(InboundOrder.supplier_id == supplier_id)
        if purchase_contract_id:
            conditions.append(InboundOrder.purchase_contract_id == purchase_contract_id)
        if owner_user_ids is not None:
            conditions.append(InboundOrder.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(InboundOrder.inbound_at.desc(), InboundOrder.code.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._order_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_order(row) for row in rows], int(total or 0)

    async def submit_order(self, order_id: str) -> InboundOrderRow | None:
        order = await self.session.get(InboundOrder, order_id)
        if order is None:
            return None
        order.status = "submitted"
        order.submitted_at = order.inbound_at
        await self.session.flush()
        return self._map_order(order)

    async def approve_order(
        self,
        order_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> InboundOrderRow | None:
        order = await self.session.get(InboundOrder, order_id)
        if order is None:
            return None
        order.status = "approved"
        order.reviewer_name = reviewer_name
        order.approved_at = approved_at
        await self.session.flush()
        return self._map_order(order)

    async def increase_balance(
        self,
        *,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        available_delta: Decimal | str,
        pending_delta: Decimal | str,
        unit: str,
    ) -> InventoryBalanceRow:
        statement = (
            select(InventoryBalance)
            .where(InventoryBalance.warehouse_id == warehouse_id)
            .where(InventoryBalance.location_id == location_id)
            .where(InventoryBalance.product_code == product_code)
            .where(InventoryBalance.product_name == product_name)
            .where(InventoryBalance.unit == unit)
        )
        if product_id is None:
            statement = statement.where(InventoryBalance.product_id.is_(None))
        else:
            statement = statement.where(InventoryBalance.product_id == product_id)
        balance = await self.session.scalar(statement)
        if balance is None:
            balance = InventoryBalance(
                warehouse_id=warehouse_id,
                warehouse_name=warehouse_name,
                location_id=location_id,
                location_name=location_name,
                product_id=product_id,
                product_code=product_code,
                product_name=product_name,
                available_quantity=Decimal("0"),
                locked_quantity=Decimal("0"),
                pending_inspection_quantity=Decimal("0"),
                unit=unit,
            )
            self.session.add(balance)
        balance.warehouse_name = warehouse_name
        balance.location_name = location_name
        balance.product_name = product_name
        balance.available_quantity += Decimal(str(available_delta))
        balance.pending_inspection_quantity += Decimal(str(pending_delta))
        await self.session.flush()
        return self._map_balance(balance)

    async def add_ledger(
        self,
        *,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        direction: str,
        quantity: Decimal | str,
        unit: str,
        stock_status: str,
        source_type: str,
        source_id: str,
        source_code: str,
        occurred_at: date,
        remark: str | None,
    ) -> InventoryLedgerRow:
        ledger = InventoryLedger(
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            direction=direction,
            quantity=Decimal(str(quantity)),
            unit=unit,
            stock_status=stock_status,
            source_type=source_type,
            source_id=source_id,
            source_code=source_code,
            occurred_at=occurred_at,
            remark=remark,
        )
        self.session.add(ledger)
        await self.session.flush()
        return self._map_ledger(ledger)

    async def list_balances(
        self,
        *,
        q: str | None = None,
        warehouse_id: str | None = None,
        location_id: str | None = None,
        product_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[InventoryBalanceRow], int]:
        statement = select(InventoryBalance)
        count_statement = select(func.count()).select_from(InventoryBalance)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    InventoryBalance.warehouse_name.ilike(pattern),
                    InventoryBalance.location_name.ilike(pattern),
                    InventoryBalance.product_code.ilike(pattern),
                    InventoryBalance.product_name.ilike(pattern),
                )
            )
        if warehouse_id:
            conditions.append(InventoryBalance.warehouse_id == warehouse_id)
        if location_id:
            conditions.append(InventoryBalance.location_id == location_id)
        if product_id:
            conditions.append(InventoryBalance.product_id == product_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                InventoryBalance.warehouse_name.asc(),
                InventoryBalance.location_name.asc(),
                InventoryBalance.product_name.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._balance_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_balance(row) for row in rows], int(total or 0)

    async def list_ledgers(
        self,
        *,
        q: str | None = None,
        source_id: str | None = None,
        product_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[InventoryLedgerRow], int]:
        statement = select(InventoryLedger)
        count_statement = select(func.count()).select_from(InventoryLedger)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    InventoryLedger.source_code.ilike(pattern),
                    InventoryLedger.product_code.ilike(pattern),
                    InventoryLedger.product_name.ilike(pattern),
                    InventoryLedger.warehouse_name.ilike(pattern),
                )
            )
        if source_id:
            conditions.append(InventoryLedger.source_id == source_id)
        if product_id:
            conditions.append(InventoryLedger.product_id == product_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                InventoryLedger.occurred_at.desc(),
                InventoryLedger.created_at.desc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._ledger_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_ledger(row) for row in rows], int(total or 0)

    async def _order_scalars(self, statement: Select[tuple[InboundOrder]]) -> list[InboundOrder]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _balance_scalars(
        self,
        statement: Select[tuple[InventoryBalance]],
    ) -> list[InventoryBalance]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _ledger_scalars(
        self,
        statement: Select[tuple[InventoryLedger]],
    ) -> list[InventoryLedger]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_order(self, order: InboundOrder) -> InboundOrderRow:
        return InboundOrderRow(
            id=order.id,
            code=order.code,
            plan_id=order.plan_id,
            purchase_contract_id=order.purchase_contract_id,
            purchase_contract_no=order.purchase_contract_no,
            supplier_id=order.supplier_id,
            supplier_name=order.supplier_name,
            inbound_type=order.inbound_type,
            inbound_mode=order.inbound_mode,
            inbound_at=order.inbound_at,
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            operator_name=order.operator_name,
            status=order.status,
            submitted_at=order.submitted_at,
            approved_at=order.approved_at,
            reviewer_name=order.reviewer_name,
            owner_user_id=order.owner_user_id,
            created_at=order.created_at,
        )

    def _map_line(self, line: InboundOrderLine) -> InboundOrderLineRow:
        return InboundOrderLineRow(
            id=line.id,
            order_id=line.order_id,
            plan_line_id=line.plan_line_id,
            purchase_contract_line_id=line.purchase_contract_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            stock_status=line.stock_status,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _map_balance(self, balance: InventoryBalance) -> InventoryBalanceRow:
        return InventoryBalanceRow(
            id=balance.id,
            warehouse_id=balance.warehouse_id,
            warehouse_name=balance.warehouse_name,
            location_id=balance.location_id,
            location_name=balance.location_name,
            product_id=balance.product_id,
            product_code=balance.product_code,
            product_name=balance.product_name,
            available_quantity=self._quantity(balance.available_quantity),
            locked_quantity=self._quantity(balance.locked_quantity),
            pending_inspection_quantity=self._quantity(balance.pending_inspection_quantity),
            unit=balance.unit,
            created_at=balance.created_at,
        )

    def _map_ledger(self, ledger: InventoryLedger) -> InventoryLedgerRow:
        return InventoryLedgerRow(
            id=ledger.id,
            warehouse_id=ledger.warehouse_id,
            warehouse_name=ledger.warehouse_name,
            location_id=ledger.location_id,
            location_name=ledger.location_name,
            product_id=ledger.product_id,
            product_code=ledger.product_code,
            product_name=ledger.product_name,
            direction=ledger.direction,
            quantity=self._quantity(ledger.quantity),
            unit=ledger.unit,
            stock_status=ledger.stock_status,
            source_type=ledger.source_type,
            source_id=ledger.source_id,
            source_code=ledger.source_code,
            occurred_at=ledger.occurred_at,
            remark=ledger.remark,
            created_at=ledger.created_at,
        )

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
