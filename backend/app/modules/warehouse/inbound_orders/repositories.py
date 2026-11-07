from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import resolve_limit, resolve_offset
from app.modules.warehouse.inbound_orders.models import InboundOrder, InboundOrderLine


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
    reviewer_id: str | None
    reviewer_name: str | None
    owner_user_id: str
    cancelled_at: datetime | None
    cancelled_by_id: str | None
    cancelled_by_name: str | None
    cancel_reason: str | None
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
        else:
            # 常规列表默认过滤已作废单据，只有显式按“已作废”筛选时才展示。
            conditions.append(InboundOrder.status != "cancelled")
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
        reviewer_id: str,
        reviewer_name: str,
    ) -> InboundOrderRow | None:
        order = await self.session.get(InboundOrder, order_id)
        if order is None:
            return None
        order.status = "submitted"
        order.submitted_at = order.inbound_at
        order.reviewer_id = reviewer_id
        order.reviewer_name = reviewer_name
        await self.session.flush()
        return self._map_order(order)

    async def approve_order(
        self,
        order_id: str,
        reviewer_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> InboundOrderRow | None:
        order = await self.session.get(InboundOrder, order_id)
        if order is None:
            return None
        order.status = "approved"
        order.reviewer_id = reviewer_id
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
    ) -> InboundOrderRow | None:
        order = await self.session.get(InboundOrder, order_id)
        if order is None:
            return None
        order.status = "cancelled"
        order.cancel_reason = cancel_reason
        order.cancelled_by_id = cancelled_by_id
        order.cancelled_by_name = cancelled_by_name
        order.cancelled_at = cancelled_at
        await self.session.flush()
        return self._map_order(order)

    async def _order_scalars(self, statement: Select[tuple[InboundOrder]]) -> list[InboundOrder]:
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
            reviewer_id=order.reviewer_id,
            reviewer_name=order.reviewer_name,
            owner_user_id=order.owner_user_id,
            cancelled_at=order.cancelled_at,
            cancelled_by_id=order.cancelled_by_id,
            cancelled_by_name=order.cancelled_by_name,
            cancel_reason=order.cancel_reason,
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

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
