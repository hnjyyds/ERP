from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import resolve_limit, resolve_offset
from app.modules.warehouse.stocktakes.models import StocktakeOrder, StocktakeOrderLine


@dataclass(frozen=True)
class StocktakeOrderRow:
    id: str
    code: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    count_date: date
    status: str
    operator_name: str
    owner_user_id: str
    reviewer_id: str | None
    reviewer_name: str | None
    remark: str | None
    submitted_at: date | None
    approved_at: date | None
    created_at: datetime


@dataclass(frozen=True)
class StocktakeLineRow:
    id: str
    order_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    unit: str
    book_quantity: str
    actual_quantity: str
    difference_quantity: str
    remark: str | None
    created_at: datetime


class StocktakeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_order(
        self,
        *,
        code: str,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        count_date: date,
        operator_name: str,
        owner_user_id: str,
        remark: str | None,
    ) -> StocktakeOrderRow:
        order = StocktakeOrder(
            code=code,
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            count_date=count_date,
            status="draft",
            operator_name=operator_name,
            owner_user_id=owner_user_id,
            remark=remark,
        )
        self.session.add(order)
        await self.session.flush()
        return self._map_order(order)

    async def add_line(
        self,
        *,
        order_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        unit: str,
        book_quantity: Decimal | str,
        actual_quantity: Decimal | str,
        difference_quantity: Decimal | str,
        remark: str | None,
    ) -> StocktakeLineRow:
        line = StocktakeOrderLine(
            order_id=order_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            unit=unit,
            book_quantity=Decimal(str(book_quantity)),
            actual_quantity=Decimal(str(actual_quantity)),
            difference_quantity=Decimal(str(difference_quantity)),
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def get_order(self, order_id: str) -> StocktakeOrderRow | None:
        order = await self.session.get(StocktakeOrder, order_id)
        return self._map_order(order) if order is not None else None

    async def list_lines(self, order_id: str) -> list[StocktakeLineRow]:
        rows = await self.session.scalars(
            select(StocktakeOrderLine)
            .where(StocktakeOrderLine.order_id == order_id)
            .order_by(StocktakeOrderLine.created_at.asc(), StocktakeOrderLine.id.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_orders(
        self,
        *,
        q: str | None,
        status: str | None,
        warehouse_id: str | None,
        allowed_user_ids: list[str] | None,
        limit: int,
        offset: int,
    ) -> tuple[list[StocktakeOrderRow], int]:
        statement = select(StocktakeOrder)
        count_statement = select(func.count()).select_from(StocktakeOrder)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    StocktakeOrder.code.ilike(pattern),
                    StocktakeOrder.warehouse_name.ilike(pattern),
                    StocktakeOrder.location_name.ilike(pattern),
                    StocktakeOrder.operator_name.ilike(pattern),
                )
            )
        if status:
            conditions.append(StocktakeOrder.status == status)
        if warehouse_id:
            conditions.append(StocktakeOrder.warehouse_id == warehouse_id)
        if allowed_user_ids is not None:
            conditions.append(StocktakeOrder.owner_user_id.in_(allowed_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                StocktakeOrder.count_date.desc(),
                StocktakeOrder.created_at.desc(),
            )
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = await self.session.scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_order(row) for row in rows], int(total or 0)

    async def submit_order(
        self,
        order_id: str,
        *,
        reviewer_id: str,
        reviewer_name: str,
        submitted_at: date,
    ) -> StocktakeOrderRow | None:
        result = await self.session.execute(
            update(StocktakeOrder)
            .where(StocktakeOrder.id == order_id)
            .where(StocktakeOrder.status == "draft")
            .values(
                status="submitted",
                reviewer_id=reviewer_id,
                reviewer_name=reviewer_name,
                submitted_at=submitted_at,
            )
        )
        if not result.rowcount:
            return None
        await self.session.flush()
        return await self.get_order(order_id)

    async def approve_order(
        self,
        order_id: str,
        *,
        reviewer_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> StocktakeOrderRow | None:
        """状态条件更新：并发审批时只有一个请求能完成调整。"""
        result = await self.session.execute(
            update(StocktakeOrder)
            .where(StocktakeOrder.id == order_id)
            .where(StocktakeOrder.status == "submitted")
            .values(
                status="approved",
                reviewer_id=reviewer_id,
                reviewer_name=reviewer_name,
                approved_at=approved_at,
            )
        )
        if not result.rowcount:
            return None
        await self.session.flush()
        return await self.get_order(order_id)

    def _map_order(self, order: StocktakeOrder) -> StocktakeOrderRow:
        return StocktakeOrderRow(
            id=order.id,
            code=order.code,
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            count_date=order.count_date,
            status=order.status,
            operator_name=order.operator_name,
            owner_user_id=order.owner_user_id,
            reviewer_id=order.reviewer_id,
            reviewer_name=order.reviewer_name,
            remark=order.remark,
            submitted_at=order.submitted_at,
            approved_at=order.approved_at,
            created_at=order.created_at,
        )

    def _map_line(self, line: StocktakeOrderLine) -> StocktakeLineRow:
        return StocktakeLineRow(
            id=line.id,
            order_id=line.order_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            unit=line.unit,
            book_quantity=self._quantity(line.book_quantity),
            actual_quantity=self._quantity(line.actual_quantity),
            difference_quantity=self._quantity(line.difference_quantity),
            remark=line.remark,
            created_at=line.created_at,
        )

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
