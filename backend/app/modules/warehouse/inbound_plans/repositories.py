from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import resolve_limit, resolve_offset
from app.modules.warehouse.inbound_plans.models import InboundPlan, InboundPlanLine


@dataclass(frozen=True)
class InboundPlanRow:
    id: str
    code: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    inbound_type: str
    planned_date: date
    status: str
    warehouse_id: str | None
    warehouse_name: str | None
    location_id: str | None
    location_name: str | None
    operator_name: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class InboundPlanLineRow:
    id: str
    plan_id: str
    purchase_contract_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    planned_quantity: str
    received_quantity: str
    unit: str
    status: str
    remark: str | None
    created_at: datetime


class InboundPlanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_plan(
        self,
        *,
        code: str,
        purchase_contract_id: str,
        purchase_contract_no: str,
        supplier_id: str | None,
        supplier_name: str,
        inbound_type: str,
        planned_date: date,
        status: str,
        owner_user_id: str,
    ) -> InboundPlanRow:
        plan = InboundPlan(
            code=code,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            inbound_type=inbound_type,
            planned_date=planned_date,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(plan)
        await self.session.flush()
        return self._map_plan(plan)

    async def add_line(
        self,
        *,
        plan_id: str,
        purchase_contract_line_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        planned_quantity: Decimal | str,
        unit: str,
        remark: str | None,
    ) -> InboundPlanLineRow:
        line = InboundPlanLine(
            plan_id=plan_id,
            purchase_contract_line_id=purchase_contract_line_id,
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

    async def get_plan(self, plan_id: str) -> InboundPlanRow | None:
        plan = await self.session.get(InboundPlan, plan_id)
        if plan is None:
            return None
        return self._map_plan(plan)

    async def get_line(self, line_id: str) -> InboundPlanLineRow | None:
        line = await self.session.get(InboundPlanLine, line_id)
        if line is None:
            return None
        return self._map_line(line)

    async def get_plan_by_contract(self, purchase_contract_id: str) -> InboundPlanRow | None:
        plan = await self.session.scalar(
            select(InboundPlan).where(InboundPlan.purchase_contract_id == purchase_contract_id)
        )
        if plan is None:
            return None
        return self._map_plan(plan)

    async def list_lines(self, plan_id: str) -> list[InboundPlanLineRow]:
        rows = await self.session.scalars(
            select(InboundPlanLine)
            .where(InboundPlanLine.plan_id == plan_id)
            .order_by(InboundPlanLine.created_at.asc(), InboundPlanLine.id.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_plans(
        self,
        *,
        q: str | None = None,
        inbound_type: str | None = None,
        status: str | None = None,
        supplier_id: str | None = None,
        purchase_contract_id: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[InboundPlanRow], int]:
        conditions = self._plan_conditions(
            q=q,
            inbound_type=inbound_type,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
        )
        statement = select(InboundPlan)
        count_statement = select(func.count()).select_from(InboundPlan)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(InboundPlan.planned_date.asc(), InboundPlan.code.asc())
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_plan(row) for row in rows], int(total or 0)

    async def summarize_plans(
        self,
        *,
        q: str | None,
        inbound_type: str | None,
        status: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
    ) -> tuple[dict[str, int], str, int]:
        """同一筛选条件下的状态计数、计划总量与类型数，不受分页影响。"""
        conditions = self._plan_conditions(
            q=q,
            inbound_type=inbound_type,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
        )
        status_statement = (
            select(InboundPlan.status, func.count())
            .select_from(InboundPlan)
            .group_by(InboundPlan.status)
        )
        quantity_statement = (
            select(func.coalesce(func.sum(InboundPlanLine.planned_quantity), 0))
            .select_from(InboundPlan)
            .join(InboundPlanLine, InboundPlanLine.plan_id == InboundPlan.id)
        )
        type_statement = select(func.count(func.distinct(InboundPlan.inbound_type))).select_from(
            InboundPlan
        )
        for condition in conditions:
            status_statement = status_statement.where(condition)
            quantity_statement = quantity_statement.where(condition)
            type_statement = type_statement.where(condition)
        status_rows = await self.session.execute(status_statement)
        total_quantity = await self.session.scalar(quantity_statement)
        type_count = await self.session.scalar(type_statement)
        return (
            {row[0]: int(row[1]) for row in status_rows},
            self._quantity(Decimal(str(total_quantity or 0))),
            int(type_count or 0),
        )

    def _plan_conditions(
        self,
        *,
        q: str | None,
        inbound_type: str | None,
        status: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
    ) -> list:
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(InboundPlanLine.id)
                .where(InboundPlanLine.plan_id == InboundPlan.id)
                .where(
                    or_(
                        InboundPlanLine.product_code.ilike(pattern),
                        InboundPlanLine.product_name.ilike(pattern),
                        InboundPlanLine.specification.ilike(pattern),
                        InboundPlanLine.model.ilike(pattern),
                    )
                )
                .correlate(InboundPlan)
                .exists()
            )
            conditions.append(
                or_(
                    InboundPlan.code.ilike(pattern),
                    InboundPlan.purchase_contract_no.ilike(pattern),
                    InboundPlan.supplier_name.ilike(pattern),
                    line_exists,
                )
            )
        if inbound_type:
            conditions.append(InboundPlan.inbound_type == inbound_type)
        if status:
            conditions.append(InboundPlan.status == status)
        if supplier_id:
            conditions.append(InboundPlan.supplier_id == supplier_id)
        if purchase_contract_id:
            conditions.append(InboundPlan.purchase_contract_id == purchase_contract_id)
        if owner_user_ids is not None:
            conditions.append(InboundPlan.owner_user_id.in_(owner_user_ids))
        return conditions

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
    ) -> InboundPlanRow | None:
        plan = await self.session.get(InboundPlan, plan_id)
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

    async def increase_line_received_quantity(
        self,
        line_id: str,
        quantity: Decimal | str,
    ) -> InboundPlanLineRow | None:
        line = await self.session.get(InboundPlanLine, line_id)
        if line is None:
            return None
        line.received_quantity += Decimal(str(quantity))
        if line.received_quantity >= line.planned_quantity:
            line.status = "closed"
        elif line.received_quantity > 0:
            line.status = "partial"
        await self.session.flush()
        return self._map_line(line)

    async def refresh_plan_status(self, plan_id: str) -> InboundPlanRow | None:
        plan = await self.session.get(InboundPlan, plan_id)
        if plan is None:
            return None
        lines = list(
            await self.session.scalars(
                select(InboundPlanLine).where(InboundPlanLine.plan_id == plan_id)
            )
        )
        if lines and all(line.received_quantity >= line.planned_quantity for line in lines):
            plan.status = "closed"
        elif plan.warehouse_id is not None and plan.location_id is not None:
            plan.status = "scheduled"
        else:
            plan.status = "planned"
        await self.session.flush()
        return self._map_plan(plan)

    async def _scalars(self, statement: Select[tuple[InboundPlan]]) -> list[InboundPlan]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_plan(self, plan: InboundPlan) -> InboundPlanRow:
        return InboundPlanRow(
            id=plan.id,
            code=plan.code,
            purchase_contract_id=plan.purchase_contract_id,
            purchase_contract_no=plan.purchase_contract_no,
            supplier_id=plan.supplier_id,
            supplier_name=plan.supplier_name,
            inbound_type=plan.inbound_type,
            planned_date=plan.planned_date,
            status=plan.status,
            warehouse_id=plan.warehouse_id,
            warehouse_name=plan.warehouse_name,
            location_id=plan.location_id,
            location_name=plan.location_name,
            operator_name=plan.operator_name,
            owner_user_id=plan.owner_user_id,
            created_at=plan.created_at,
        )

    def _map_line(self, line: InboundPlanLine) -> InboundPlanLineRow:
        return InboundPlanLineRow(
            id=line.id,
            plan_id=line.plan_id,
            purchase_contract_line_id=line.purchase_contract_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            planned_quantity=self._quantity(line.planned_quantity),
            received_quantity=self._quantity(line.received_quantity),
            unit=line.unit,
            status=line.status,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
