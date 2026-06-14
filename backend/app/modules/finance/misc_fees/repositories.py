from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.misc_fees.models import MiscFeeAllocation, MiscFeeItem
from app.modules.sales.shipments.models import ShipmentPlan


@dataclass(frozen=True)
class MiscFeeItemRow:
    id: str
    code: str
    name: str
    category: str
    default_allocation_method: str
    is_active: bool
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime


@dataclass(frozen=True)
class MiscFeeAllocationRow:
    id: str
    allocation_no: str
    item_id: str
    item_code: str
    item_name: str
    item_category: str
    shipment_plan_id: str
    shipment_no: str
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    allocated_at: date
    amount: str
    currency: str
    allocation_method: str
    basis: str | None
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime


class MiscFeeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_item(
        self,
        *,
        code: str,
        name: str,
        category: str,
        default_allocation_method: str,
        is_active: bool,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> MiscFeeItemRow:
        item = MiscFeeItem(
            code=code,
            name=name,
            category=category,
            default_allocation_method=default_allocation_method,
            is_active=is_active,
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(item)
        await self.session.flush()
        return self._map_item(item)

    async def get_item(self, item_id: str) -> MiscFeeItemRow | None:
        item = await self.session.get(MiscFeeItem, item_id)
        if item is None:
            return None
        return self._map_item(item)

    async def list_items(
        self,
        *,
        q: str | None = None,
        category: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[MiscFeeItemRow], int]:
        statement = select(MiscFeeItem)
        count_statement = select(func.count()).select_from(MiscFeeItem)
        conditions = self._item_conditions(q=q, category=category, status=status)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(MiscFeeItem.category.asc(), MiscFeeItem.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._item_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_item(row) for row in rows], int(total or 0)

    async def create_allocation(
        self,
        *,
        allocation_no: str,
        item: MiscFeeItemRow,
        shipment_plan_id: str,
        shipment_no: str,
        customer_name: str,
        sales_user_id: str | None,
        sales_user_name: str | None,
        allocated_at: date,
        amount: Decimal | str,
        currency: str,
        allocation_method: str,
        basis: str | None,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> MiscFeeAllocationRow:
        allocation = MiscFeeAllocation(
            allocation_no=allocation_no,
            item_id=item.id,
            item_code=item.code,
            item_name=item.name,
            item_category=item.category,
            shipment_plan_id=shipment_plan_id,
            shipment_no=shipment_no,
            customer_name=customer_name,
            sales_user_id=sales_user_id,
            sales_user_name=sales_user_name,
            allocated_at=allocated_at,
            amount=Decimal(str(amount)),
            currency=currency,
            allocation_method=allocation_method,
            basis=basis,
            status="allocated",
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(allocation)
        await self.session.flush()
        return self._map_allocation(allocation)

    async def list_allocations(
        self,
        *,
        q: str | None = None,
        item_id: str | None = None,
        category: str | None = None,
        shipment_no: str | None = None,
        sales_user_id: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[MiscFeeAllocationRow], int]:
        statement = select(MiscFeeAllocation)
        count_statement = select(func.count()).select_from(MiscFeeAllocation)
        conditions = self._allocation_conditions(
            q=q,
            item_id=item_id,
            category=category,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            status=status,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                MiscFeeAllocation.allocated_at.desc(),
                MiscFeeAllocation.allocation_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._allocation_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_allocation(row) for row in rows], int(total or 0)

    async def subtract_allocation_from_shipment_profit(
        self,
        *,
        shipment_plan_id: str,
        amount: Decimal | str,
    ) -> None:
        shipment = await self.session.get(ShipmentPlan, shipment_plan_id)
        if shipment is None:
            return
        shipment.profit_amount -= Decimal(str(amount))
        if shipment.receivable_amount == 0:
            shipment.profit_rate = Decimal("0")
        else:
            shipment.profit_rate = (
                shipment.profit_amount / shipment.receivable_amount
            ) * Decimal("100")
        await self.session.flush()

    def _item_conditions(
        self,
        *,
        q: str | None,
        category: str | None,
        status: str | None,
    ) -> list[object]:
        conditions: list[object] = []
        if q:
            pattern = f"%{q}%"
            conditions.append(or_(MiscFeeItem.code.ilike(pattern), MiscFeeItem.name.ilike(pattern)))
        if category:
            conditions.append(MiscFeeItem.category == category)
        if status == "active":
            conditions.append(MiscFeeItem.is_active.is_(True))
        if status == "inactive":
            conditions.append(MiscFeeItem.is_active.is_(False))
        return conditions

    def _allocation_conditions(
        self,
        *,
        q: str | None,
        item_id: str | None,
        category: str | None,
        shipment_no: str | None,
        sales_user_id: str | None,
        status: str | None,
    ) -> list[object]:
        conditions: list[object] = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    MiscFeeAllocation.allocation_no.ilike(pattern),
                    MiscFeeAllocation.item_code.ilike(pattern),
                    MiscFeeAllocation.item_name.ilike(pattern),
                    MiscFeeAllocation.shipment_no.ilike(pattern),
                    MiscFeeAllocation.customer_name.ilike(pattern),
                    MiscFeeAllocation.sales_user_name.ilike(pattern),
                )
            )
        if item_id:
            conditions.append(MiscFeeAllocation.item_id == item_id)
        if category:
            conditions.append(MiscFeeAllocation.item_category == category)
        if shipment_no:
            conditions.append(MiscFeeAllocation.shipment_no == shipment_no)
        if sales_user_id:
            conditions.append(MiscFeeAllocation.sales_user_id == sales_user_id)
        if status:
            conditions.append(MiscFeeAllocation.status == status)
        return conditions

    async def _item_scalars(self, statement: Select[tuple[MiscFeeItem]]) -> list[MiscFeeItem]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _allocation_scalars(
        self,
        statement: Select[tuple[MiscFeeAllocation]],
    ) -> list[MiscFeeAllocation]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_item(self, item: MiscFeeItem) -> MiscFeeItemRow:
        return MiscFeeItemRow(
            id=item.id,
            code=item.code,
            name=item.name,
            category=item.category,
            default_allocation_method=item.default_allocation_method,
            is_active=item.is_active,
            status="active" if item.is_active else "inactive",
            remark=item.remark,
            created_by_user_id=item.created_by_user_id,
            created_by_user_name=item.created_by_user_name,
            created_at=item.created_at,
        )

    def _map_allocation(self, allocation: MiscFeeAllocation) -> MiscFeeAllocationRow:
        return MiscFeeAllocationRow(
            id=allocation.id,
            allocation_no=allocation.allocation_no,
            item_id=allocation.item_id,
            item_code=allocation.item_code,
            item_name=allocation.item_name,
            item_category=allocation.item_category,
            shipment_plan_id=allocation.shipment_plan_id,
            shipment_no=allocation.shipment_no,
            customer_name=allocation.customer_name,
            sales_user_id=allocation.sales_user_id,
            sales_user_name=allocation.sales_user_name,
            allocated_at=allocation.allocated_at,
            amount=self._decimal(allocation.amount),
            currency=allocation.currency,
            allocation_method=allocation.allocation_method,
            basis=allocation.basis,
            status=allocation.status,
            remark=allocation.remark,
            created_by_user_id=allocation.created_by_user_id,
            created_by_user_name=allocation.created_by_user_name,
            created_at=allocation.created_at,
        )

    def _decimal(self, value: Decimal) -> str:
        return f"{Decimal(str(value)):.2f}"
