from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.warehouse.outbound_plans.models import OutboundPlan, OutboundPlanLine


@dataclass(frozen=True)
class OutboundPlanRow:
    id: str
    code: str
    source_type: str
    source_id: str
    source_code: str
    outbound_type: str
    planned_date: date
    status: str
    customer_id: str | None
    customer_name: str | None
    warehouse_id: str | None
    warehouse_name: str | None
    location_id: str | None
    location_name: str | None
    operator_name: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class OutboundPlanLineRow:
    id: str
    plan_id: str
    source_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    planned_quantity: str
    outbound_quantity: str
    unit: str
    status: str
    remark: str | None
    created_at: datetime


class OutboundPlanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_plan(
        self,
        *,
        code: str,
        source_type: str,
        source_id: str,
        source_code: str,
        outbound_type: str,
        planned_date: date,
        status: str,
        customer_id: str | None,
        customer_name: str | None,
        owner_user_id: str,
    ) -> OutboundPlanRow:
        plan = OutboundPlan(
            code=code,
            source_type=source_type,
            source_id=source_id,
            source_code=source_code,
            outbound_type=outbound_type,
            planned_date=planned_date,
            status=status,
            customer_id=customer_id,
            customer_name=customer_name,
            owner_user_id=owner_user_id,
        )
        self.session.add(plan)
        await self.session.flush()
        return self._map_plan(plan)

    async def add_line(
        self,
        *,
        plan_id: str,
        source_line_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        planned_quantity: Decimal | str,
        unit: str,
        remark: str | None,
    ) -> OutboundPlanLineRow:
        line = OutboundPlanLine(
            plan_id=plan_id,
            source_line_id=source_line_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            model=model,
            planned_quantity=Decimal(str(planned_quantity)),
            unit=unit,
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def get_plan(self, plan_id: str) -> OutboundPlanRow | None:
        plan = await self.session.get(OutboundPlan, plan_id)
        if plan is None:
            return None
        return self._map_plan(plan)

    async def get_plan_by_source(
        self,
        *,
        source_type: str,
        source_id: str,
        outbound_type: str,
    ) -> OutboundPlanRow | None:
        plan = await self.session.scalar(
            select(OutboundPlan)
            .where(OutboundPlan.source_type == source_type)
            .where(OutboundPlan.source_id == source_id)
            .where(OutboundPlan.outbound_type == outbound_type)
        )
        if plan is None:
            return None
        return self._map_plan(plan)

    async def list_lines(self, plan_id: str) -> list[OutboundPlanLineRow]:
        rows = await self.session.scalars(
            select(OutboundPlanLine)
            .where(OutboundPlanLine.plan_id == plan_id)
            .order_by(OutboundPlanLine.created_at.asc(), OutboundPlanLine.id.asc())
        )
        return [self._map_line(row) for row in rows]

    async def get_line(self, line_id: str) -> OutboundPlanLineRow | None:
        line = await self.session.get(OutboundPlanLine, line_id)
        if line is None:
            return None
        return self._map_line(line)

    async def list_plans(
        self,
        *,
        q: str | None,
        status: str | None,
        outbound_type: str | None,
        source_type: str | None,
        customer_id: str | None,
        source_id: str | None,
        owner_user_id: str | None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[OutboundPlanRow], int]:
        statement = select(OutboundPlan)
        count_statement = select(func.count()).select_from(OutboundPlan)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(OutboundPlanLine.id)
                .where(OutboundPlanLine.plan_id == OutboundPlan.id)
                .where(
                    or_(
                        OutboundPlanLine.product_code.ilike(pattern),
                        OutboundPlanLine.product_name.ilike(pattern),
                        OutboundPlanLine.specification.ilike(pattern),
                        OutboundPlanLine.model.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    OutboundPlan.code.ilike(pattern),
                    OutboundPlan.source_code.ilike(pattern),
                    OutboundPlan.customer_name.ilike(pattern),
                    line_exists,
                )
            )
        if status:
            conditions.append(OutboundPlan.status == status)
        if outbound_type:
            conditions.append(OutboundPlan.outbound_type == outbound_type)
        if source_type:
            conditions.append(OutboundPlan.source_type == source_type)
        if customer_id:
            conditions.append(OutboundPlan.customer_id == customer_id)
        if source_id:
            conditions.append(OutboundPlan.source_id == source_id)
        if owner_user_id:
            conditions.append(OutboundPlan.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(OutboundPlan.planned_date.asc(), OutboundPlan.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_plan(row) for row in rows], int(total or 0)

    async def schedule_plan(
        self,
        *,
        plan_id: str,
        planned_date: date,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        operator_name: str,
    ) -> OutboundPlanRow | None:
        plan = await self.session.get(OutboundPlan, plan_id)
        if plan is None:
            return None
        plan.planned_date = planned_date
        plan.warehouse_id = warehouse_id
        plan.warehouse_name = warehouse_name
        plan.location_id = location_id
        plan.location_name = location_name
        plan.operator_name = operator_name
        plan.status = "scheduled"
        await self.session.flush()
        return self._map_plan(plan)

    async def increase_line_outbound_quantity(
        self,
        line_id: str,
        quantity: Decimal | str,
    ) -> OutboundPlanLineRow | None:
        line = await self.session.get(OutboundPlanLine, line_id)
        if line is None:
            return None
        line.outbound_quantity += Decimal(str(quantity))
        if line.outbound_quantity >= line.planned_quantity:
            line.status = "shipped"
        elif line.outbound_quantity > 0:
            line.status = "partial"
        await self.session.flush()
        return self._map_line(line)

    async def refresh_plan_status(self, plan_id: str) -> OutboundPlanRow | None:
        plan = await self.session.get(OutboundPlan, plan_id)
        if plan is None:
            return None
        lines = list(
            await self.session.scalars(
                select(OutboundPlanLine).where(OutboundPlanLine.plan_id == plan_id)
            )
        )
        if lines and all(line.outbound_quantity >= line.planned_quantity for line in lines):
            plan.status = "closed"
        elif plan.status == "planned" and any(line.outbound_quantity > 0 for line in lines):
            plan.status = "scheduled"
        await self.session.flush()
        return self._map_plan(plan)

    async def _scalars(self, statement: Select[tuple[OutboundPlan]]) -> list[OutboundPlan]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_plan(self, plan: OutboundPlan) -> OutboundPlanRow:
        return OutboundPlanRow(
            id=plan.id,
            code=plan.code,
            source_type=plan.source_type,
            source_id=plan.source_id,
            source_code=plan.source_code,
            outbound_type=plan.outbound_type,
            planned_date=plan.planned_date,
            status=plan.status,
            customer_id=plan.customer_id,
            customer_name=plan.customer_name,
            warehouse_id=plan.warehouse_id,
            warehouse_name=plan.warehouse_name,
            location_id=plan.location_id,
            location_name=plan.location_name,
            operator_name=plan.operator_name,
            owner_user_id=plan.owner_user_id,
            created_at=plan.created_at,
        )

    def _map_line(self, line: OutboundPlanLine) -> OutboundPlanLineRow:
        return OutboundPlanLineRow(
            id=line.id,
            plan_id=line.plan_id,
            source_line_id=line.source_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            planned_quantity=self._quantity(line.planned_quantity),
            outbound_quantity=self._quantity(line.outbound_quantity),
            unit=line.unit,
            status=line.status,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
