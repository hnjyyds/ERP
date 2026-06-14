from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.warehouse.inbound_orders.models import InventoryBalance, InventoryLedger
from app.modules.warehouse.inbound_orders.repositories import (
    InventoryBalanceRow,
    InventoryLedgerRow,
)
from app.modules.warehouse.outbound_orders.models import OutboundOrder, OutboundOrderLine


@dataclass(frozen=True)
class OutboundOrderRow:
    id: str
    code: str
    plan_id: str
    source_type: str
    source_id: str
    source_code: str
    outbound_type: str
    customer_id: str | None
    customer_name: str | None
    outbound_mode: str
    outbound_at: date
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    operator_name: str
    status: str
    exception_reason: str | None
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class OutboundOrderLineRow:
    id: str
    order_id: str
    plan_line_id: str
    source_line_id: str
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


class OutboundOrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_order(
        self,
        *,
        code: str,
        plan_id: str,
        source_type: str,
        source_id: str,
        source_code: str,
        outbound_type: str,
        customer_id: str | None,
        customer_name: str | None,
        outbound_mode: str,
        outbound_at: date,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        operator_name: str,
        status: str,
        exception_reason: str | None,
        owner_user_id: str,
    ) -> OutboundOrderRow:
        order = OutboundOrder(
            code=code,
            plan_id=plan_id,
            source_type=source_type,
            source_id=source_id,
            source_code=source_code,
            outbound_type=outbound_type,
            customer_id=customer_id,
            customer_name=customer_name,
            outbound_mode=outbound_mode,
            outbound_at=outbound_at,
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            operator_name=operator_name,
            status=status,
            exception_reason=exception_reason,
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
        source_line_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        quantity: Decimal | str,
        unit: str,
        remark: str | None,
    ) -> OutboundOrderLineRow:
        line = OutboundOrderLine(
            order_id=order_id,
            plan_line_id=plan_line_id,
            source_line_id=source_line_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            model=model,
            quantity=Decimal(str(quantity)),
            unit=unit,
            stock_status="available",
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def get_order(self, order_id: str) -> OutboundOrderRow | None:
        order = await self.session.get(OutboundOrder, order_id)
        if order is None:
            return None
        return self._map_order(order)

    async def list_lines(self, order_id: str) -> list[OutboundOrderLineRow]:
        rows = await self.session.scalars(
            select(OutboundOrderLine)
            .where(OutboundOrderLine.order_id == order_id)
            .order_by(OutboundOrderLine.created_at.asc(), OutboundOrderLine.id.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_orders(
        self,
        *,
        q: str | None,
        status: str | None,
        outbound_mode: str | None,
        outbound_type: str | None,
        customer_id: str | None,
        source_id: str | None,
        owner_user_id: str | None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[OutboundOrderRow], int]:
        statement = select(OutboundOrder)
        count_statement = select(func.count()).select_from(OutboundOrder)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(OutboundOrderLine.id)
                .where(OutboundOrderLine.order_id == OutboundOrder.id)
                .where(
                    or_(
                        OutboundOrderLine.product_code.ilike(pattern),
                        OutboundOrderLine.product_name.ilike(pattern),
                        OutboundOrderLine.specification.ilike(pattern),
                        OutboundOrderLine.model.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    OutboundOrder.code.ilike(pattern),
                    OutboundOrder.source_code.ilike(pattern),
                    OutboundOrder.customer_name.ilike(pattern),
                    line_exists,
                )
            )
        if status:
            conditions.append(OutboundOrder.status == status)
        if outbound_mode:
            conditions.append(OutboundOrder.outbound_mode == outbound_mode)
        if outbound_type:
            conditions.append(OutboundOrder.outbound_type == outbound_type)
        if customer_id:
            conditions.append(OutboundOrder.customer_id == customer_id)
        if source_id:
            conditions.append(OutboundOrder.source_id == source_id)
        if owner_user_id:
            conditions.append(OutboundOrder.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(OutboundOrder.outbound_at.desc(), OutboundOrder.code.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._order_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_order(row) for row in rows], int(total or 0)

    async def submit_order(self, order_id: str) -> OutboundOrderRow | None:
        order = await self.session.get(OutboundOrder, order_id)
        if order is None:
            return None
        order.status = "submitted"
        order.submitted_at = order.outbound_at
        await self.session.flush()
        return self._map_order(order)

    async def approve_order(
        self,
        order_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> OutboundOrderRow | None:
        order = await self.session.get(OutboundOrder, order_id)
        if order is None:
            return None
        order.status = "approved"
        order.reviewer_name = reviewer_name
        order.approved_at = approved_at
        await self.session.flush()
        return self._map_order(order)

    async def decrease_available_balance(
        self,
        *,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        quantity: Decimal | str,
        unit: str,
        allow_negative: bool,
    ) -> InventoryBalanceRow | None:
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
        quantity_decimal = Decimal(str(quantity))
        if balance is None:
            if not allow_negative:
                return None
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
        if balance.available_quantity < quantity_decimal and not allow_negative:
            return None
        balance.warehouse_name = warehouse_name
        balance.location_name = location_name
        balance.product_name = product_name
        balance.available_quantity -= quantity_decimal
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

    async def _order_scalars(self, statement: Select[tuple[OutboundOrder]]) -> list[OutboundOrder]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_order(self, order: OutboundOrder) -> OutboundOrderRow:
        return OutboundOrderRow(
            id=order.id,
            code=order.code,
            plan_id=order.plan_id,
            source_type=order.source_type,
            source_id=order.source_id,
            source_code=order.source_code,
            outbound_type=order.outbound_type,
            customer_id=order.customer_id,
            customer_name=order.customer_name,
            outbound_mode=order.outbound_mode,
            outbound_at=order.outbound_at,
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            operator_name=order.operator_name,
            status=order.status,
            exception_reason=order.exception_reason,
            submitted_at=order.submitted_at,
            approved_at=order.approved_at,
            reviewer_name=order.reviewer_name,
            owner_user_id=order.owner_user_id,
            created_at=order.created_at,
        )

    def _map_line(self, line: OutboundOrderLine) -> OutboundOrderLineRow:
        return OutboundOrderLineRow(
            id=line.id,
            order_id=line.order_id,
            plan_line_id=line.plan_line_id,
            source_line_id=line.source_line_id,
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
