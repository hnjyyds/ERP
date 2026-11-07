from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import resolve_limit, resolve_offset
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
    reviewer_id: str | None
    reviewer_name: str | None
    owner_user_id: str
    cancelled_at: datetime | None
    cancelled_by_id: str | None
    cancelled_by_name: str | None
    cancel_reason: str | None
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
        owner_user_ids: list[str] | None,
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
        else:
            # 常规列表默认过滤已作废单据，只有显式按“已作废”筛选时才展示。
            conditions.append(OutboundOrder.status != "cancelled")
        if outbound_mode:
            conditions.append(OutboundOrder.outbound_mode == outbound_mode)
        if outbound_type:
            conditions.append(OutboundOrder.outbound_type == outbound_type)
        if customer_id:
            conditions.append(OutboundOrder.customer_id == customer_id)
        if source_id:
            conditions.append(OutboundOrder.source_id == source_id)
        if owner_user_ids is not None:
            conditions.append(OutboundOrder.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(OutboundOrder.outbound_at.desc(), OutboundOrder.code.desc())
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = await self._order_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_order(row) for row in rows], int(total or 0)

    async def submit_order(
        self,
        order_id: str,
        *,
        reviewer_id: str | None = None,
        reviewer_name: str | None = None,
    ) -> OutboundOrderRow | None:
        order = await self.session.get(OutboundOrder, order_id)
        if order is None:
            return None
        order.status = "submitted"
        order.submitted_at = order.outbound_at
        order.reviewer_id = reviewer_id
        order.reviewer_name = reviewer_name
        await self.session.flush()
        return self._map_order(order)

    async def approve_order(
        self,
        order_id: str,
        approved_at: date,
        reviewer_id: str | None = None,
        reviewer_name: str | None = None,
    ) -> OutboundOrderRow | None:
        order = await self.session.get(OutboundOrder, order_id)
        if order is None:
            return None
        order.status = "approved"
        if reviewer_id is not None:
            order.reviewer_id = reviewer_id
        if reviewer_name is not None:
            order.reviewer_name = reviewer_name
        order.approved_at = approved_at
        await self.session.flush()
        return self._map_order(order)

    async def cancel_order(
        self,
        order_id: str,
        *,
        cancel_reason: str,
        cancelled_by_id: str,
        cancelled_by_name: str,
        cancelled_at: datetime,
    ) -> OutboundOrderRow | None:
        order = await self.session.get(OutboundOrder, order_id)
        if order is None:
            return None
        order.status = "cancelled"
        order.cancel_reason = cancel_reason
        order.cancelled_by_id = cancelled_by_id
        order.cancelled_by_name = cancelled_by_name
        order.cancelled_at = cancelled_at
        await self.session.flush()
        return self._map_order(order)

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
            reviewer_id=order.reviewer_id,
            reviewer_name=order.reviewer_name,
            owner_user_id=order.owner_user_id,
            cancelled_at=order.cancelled_at,
            cancelled_by_id=order.cancelled_by_id,
            cancelled_by_name=order.cancelled_by_name,
            cancel_reason=order.cancel_reason,
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

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
