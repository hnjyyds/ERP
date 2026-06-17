from dataclasses import dataclass
from datetime import date, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.followup.models import (
    FollowProcessNode,
    FollowProcessTemplate,
    PurchaseFollowNode,
    PurchaseFollowPlan,
)


@dataclass(frozen=True)
class FollowProcessTemplateRow:
    id: str
    name: str
    enabled: bool
    is_default: bool
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class FollowProcessNodeRow:
    id: str
    template_id: str
    node_code: str
    node_name: str
    sequence_no: int
    standard_days: int
    remind_before_days: int
    actual_date_source: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseFollowPlanRow:
    id: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    template_id: str
    base_date: date
    overall_status: str
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseFollowNodeRow:
    id: str
    follow_plan_id: str
    node_code: str
    node_name: str
    sequence_no: int
    planned_date: date
    remind_date: date
    actual_date: date | None
    status: str
    source_record_type: str | None
    source_record_id: str | None
    source_summary: str | None
    created_at: datetime


@dataclass(frozen=True)
class PurchaseFollowOverdueNodeRow:
    id: str
    follow_plan_id: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_name: str
    node_code: str
    node_name: str
    planned_date: date
    remind_date: date
    overdue_days: int
    source_record_type: str | None
    source_record_id: str | None


class FollowupRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_template(
        self,
        *,
        name: str,
        enabled: bool,
        is_default: bool,
        owner_user_id: str,
    ) -> FollowProcessTemplateRow:
        template = FollowProcessTemplate(
            name=name,
            enabled=enabled,
            is_default=is_default,
            owner_user_id=owner_user_id,
        )
        self.session.add(template)
        await self.session.flush()
        return self._map_template(template)

    async def update_template(
        self,
        *,
        template_id: str,
        name: str,
        enabled: bool,
        is_default: bool,
    ) -> FollowProcessTemplateRow | None:
        template = await self.session.get(FollowProcessTemplate, template_id)
        if template is None:
            return None
        template.name = name
        template.enabled = enabled
        template.is_default = is_default
        await self.session.flush()
        return self._map_template(template)

    async def add_template_node(
        self,
        *,
        template_id: str,
        node_code: str,
        node_name: str,
        sequence_no: int,
        standard_days: int,
        remind_before_days: int,
        actual_date_source: str,
    ) -> FollowProcessNodeRow:
        node = FollowProcessNode(
            template_id=template_id,
            node_code=node_code,
            node_name=node_name,
            sequence_no=sequence_no,
            standard_days=standard_days,
            remind_before_days=remind_before_days,
            actual_date_source=actual_date_source,
        )
        self.session.add(node)
        await self.session.flush()
        return self._map_template_node(node)

    async def delete_template_nodes(self, template_id: str) -> None:
        rows = await self.session.scalars(
            select(FollowProcessNode).where(FollowProcessNode.template_id == template_id)
        )
        for row in rows:
            await self.session.delete(row)
        await self.session.flush()

    async def get_template(self, template_id: str) -> FollowProcessTemplateRow | None:
        template = await self.session.get(FollowProcessTemplate, template_id)
        if template is None:
            return None
        return self._map_template(template)

    async def get_default_template(self) -> FollowProcessTemplateRow | None:
        template = await self.session.scalar(
            select(FollowProcessTemplate)
            .where(FollowProcessTemplate.enabled.is_(True))
            .where(FollowProcessTemplate.is_default.is_(True))
            .order_by(FollowProcessTemplate.created_at.asc())
        )
        if template is None:
            return None
        return self._map_template(template)

    async def list_templates(self) -> tuple[list[FollowProcessTemplateRow], int]:
        statement = select(FollowProcessTemplate).order_by(
            FollowProcessTemplate.is_default.desc(),
            FollowProcessTemplate.created_at.asc(),
        )
        rows = await self._template_scalars(statement)
        total = await self.session.scalar(select(func.count()).select_from(FollowProcessTemplate))
        return [self._map_template(row) for row in rows], int(total or 0)

    async def list_template_nodes(self, template_id: str) -> list[FollowProcessNodeRow]:
        rows = await self.session.scalars(
            select(FollowProcessNode)
            .where(FollowProcessNode.template_id == template_id)
            .order_by(FollowProcessNode.sequence_no.asc(), FollowProcessNode.id.asc())
        )
        return [self._map_template_node(row) for row in rows]

    async def create_plan(
        self,
        *,
        purchase_contract_id: str,
        purchase_contract_no: str,
        supplier_id: str | None,
        supplier_name: str,
        template_id: str,
        base_date: date,
        owner_user_id: str,
    ) -> PurchaseFollowPlanRow:
        plan = PurchaseFollowPlan(
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            template_id=template_id,
            base_date=base_date,
            overall_status="pending",
            owner_user_id=owner_user_id,
        )
        self.session.add(plan)
        await self.session.flush()
        return self._map_plan(plan)

    async def add_plan_node(
        self,
        *,
        follow_plan_id: str,
        node_code: str,
        node_name: str,
        sequence_no: int,
        planned_date: date,
        remind_date: date,
        actual_date: date | None,
        status: str,
        source_record_type: str | None,
        source_record_id: str | None,
        source_summary: str | None,
    ) -> PurchaseFollowNodeRow:
        node = PurchaseFollowNode(
            follow_plan_id=follow_plan_id,
            node_code=node_code,
            node_name=node_name,
            sequence_no=sequence_no,
            planned_date=planned_date,
            remind_date=remind_date,
            actual_date=actual_date,
            status=status,
            source_record_type=source_record_type,
            source_record_id=source_record_id,
            source_summary=source_summary,
        )
        self.session.add(node)
        await self.session.flush()
        return self._map_plan_node(node)

    async def get_plan(self, plan_id: str) -> PurchaseFollowPlanRow | None:
        plan = await self.session.get(PurchaseFollowPlan, plan_id)
        if plan is None:
            return None
        return self._map_plan(plan)

    async def get_plan_by_contract(
        self,
        purchase_contract_id: str,
    ) -> PurchaseFollowPlanRow | None:
        plan = await self.session.scalar(
            select(PurchaseFollowPlan).where(
                PurchaseFollowPlan.purchase_contract_id == purchase_contract_id
            )
        )
        if plan is None:
            return None
        return self._map_plan(plan)

    async def list_plan_nodes(self, plan_id: str) -> list[PurchaseFollowNodeRow]:
        rows = await self.session.scalars(
            select(PurchaseFollowNode)
            .where(PurchaseFollowNode.follow_plan_id == plan_id)
            .order_by(PurchaseFollowNode.sequence_no.asc(), PurchaseFollowNode.id.asc())
        )
        return [self._map_plan_node(row) for row in rows]

    async def get_plan_node(
        self,
        *,
        plan_id: str,
        node_code: str,
    ) -> PurchaseFollowNodeRow | None:
        node = await self.session.scalar(
            select(PurchaseFollowNode)
            .where(PurchaseFollowNode.follow_plan_id == plan_id)
            .where(PurchaseFollowNode.node_code == node_code)
        )
        if node is None:
            return None
        return self._map_plan_node(node)

    async def complete_node(
        self,
        *,
        node_id: str,
        actual_date: date,
        source_record_type: str,
        source_record_id: str,
        source_summary: str,
    ) -> PurchaseFollowNodeRow | None:
        node = await self.session.get(PurchaseFollowNode, node_id)
        if node is None:
            return None
        node.actual_date = actual_date
        node.status = "completed"
        node.source_record_type = source_record_type
        node.source_record_id = source_record_id
        node.source_summary = source_summary
        await self.session.flush()
        return self._map_plan_node(node)

    async def refresh_plan_status(self, plan_id: str) -> PurchaseFollowPlanRow | None:
        plan = await self.session.get(PurchaseFollowPlan, plan_id)
        if plan is None:
            return None
        nodes = list(
            await self.session.scalars(
                select(PurchaseFollowNode).where(PurchaseFollowNode.follow_plan_id == plan_id)
            )
        )
        if nodes and all(node.status == "completed" for node in nodes):
            plan.overall_status = "completed"
        elif any(node.status == "overdue" for node in nodes):
            plan.overall_status = "overdue"
        elif any(node.status == "completed" for node in nodes):
            plan.overall_status = "in_progress"
        else:
            plan.overall_status = "pending"
        await self.session.flush()
        return self._map_plan(plan)

    async def mark_overdue_nodes(self, *, as_of: date) -> int:
        rows = list(
            await self.session.scalars(
                select(PurchaseFollowNode)
                .where(PurchaseFollowNode.actual_date.is_(None))
                .where(PurchaseFollowNode.planned_date < as_of)
                .where(PurchaseFollowNode.status != "completed")
            )
        )
        affected_plan_ids: list[str] = []
        for node in rows:
            node.status = "overdue"
            if node.follow_plan_id not in affected_plan_ids:
                affected_plan_ids.append(node.follow_plan_id)
        await self.session.flush()
        for plan_id in affected_plan_ids:
            await self.refresh_plan_status(plan_id)
        return len(rows)

    async def list_plans(
        self,
        *,
        q: str | None,
        overall_status: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
        owner_user_ids: list[str] | None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PurchaseFollowPlanRow], int]:
        statement = select(PurchaseFollowPlan)
        count_statement = select(func.count()).select_from(PurchaseFollowPlan)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    PurchaseFollowPlan.purchase_contract_no.ilike(pattern),
                    PurchaseFollowPlan.supplier_name.ilike(pattern),
                )
            )
        if overall_status:
            conditions.append(PurchaseFollowPlan.overall_status == overall_status)
        if supplier_id:
            conditions.append(PurchaseFollowPlan.supplier_id == supplier_id)
        if purchase_contract_id:
            conditions.append(PurchaseFollowPlan.purchase_contract_id == purchase_contract_id)
        if owner_user_ids is not None:
            conditions.append(PurchaseFollowPlan.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                PurchaseFollowPlan.base_date.desc(),
                PurchaseFollowPlan.purchase_contract_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._plan_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_plan(row) for row in rows], int(total or 0)

    async def list_overdue_nodes(
        self,
        *,
        as_of: date,
        owner_user_ids: list[str] | None,
    ) -> list[PurchaseFollowOverdueNodeRow]:
        statement = (
            select(PurchaseFollowNode, PurchaseFollowPlan)
            .join(PurchaseFollowPlan, PurchaseFollowNode.follow_plan_id == PurchaseFollowPlan.id)
            .where(PurchaseFollowNode.actual_date.is_(None))
            .where(PurchaseFollowNode.planned_date < as_of)
        )
        if owner_user_ids is not None:
            statement = statement.where(PurchaseFollowPlan.owner_user_id.in_(owner_user_ids))
        statement = statement.order_by(
            PurchaseFollowNode.planned_date.asc(),
            PurchaseFollowPlan.purchase_contract_no.asc(),
        )
        rows = (await self.session.execute(statement)).all()
        return [
            self._map_overdue_node(node, plan, as_of)
            for node, plan in rows
        ]

    async def _template_scalars(
        self,
        statement: Select[tuple[FollowProcessTemplate]],
    ) -> list[FollowProcessTemplate]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _plan_scalars(
        self,
        statement: Select[tuple[PurchaseFollowPlan]],
    ) -> list[PurchaseFollowPlan]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_template(self, template: FollowProcessTemplate) -> FollowProcessTemplateRow:
        return FollowProcessTemplateRow(
            id=template.id,
            name=template.name,
            enabled=template.enabled,
            is_default=template.is_default,
            owner_user_id=template.owner_user_id,
            created_at=template.created_at,
        )

    def _map_template_node(self, node: FollowProcessNode) -> FollowProcessNodeRow:
        return FollowProcessNodeRow(
            id=node.id,
            template_id=node.template_id,
            node_code=node.node_code,
            node_name=node.node_name,
            sequence_no=node.sequence_no,
            standard_days=node.standard_days,
            remind_before_days=node.remind_before_days,
            actual_date_source=node.actual_date_source,
            created_at=node.created_at,
        )

    def _map_plan(self, plan: PurchaseFollowPlan) -> PurchaseFollowPlanRow:
        return PurchaseFollowPlanRow(
            id=plan.id,
            purchase_contract_id=plan.purchase_contract_id,
            purchase_contract_no=plan.purchase_contract_no,
            supplier_id=plan.supplier_id,
            supplier_name=plan.supplier_name,
            template_id=plan.template_id,
            base_date=plan.base_date,
            overall_status=plan.overall_status,
            owner_user_id=plan.owner_user_id,
            created_at=plan.created_at,
        )

    def _map_plan_node(self, node: PurchaseFollowNode) -> PurchaseFollowNodeRow:
        return PurchaseFollowNodeRow(
            id=node.id,
            follow_plan_id=node.follow_plan_id,
            node_code=node.node_code,
            node_name=node.node_name,
            sequence_no=node.sequence_no,
            planned_date=node.planned_date,
            remind_date=node.remind_date,
            actual_date=node.actual_date,
            status=node.status,
            source_record_type=node.source_record_type,
            source_record_id=node.source_record_id,
            source_summary=node.source_summary,
            created_at=node.created_at,
        )

    def _map_overdue_node(
        self,
        node: PurchaseFollowNode,
        plan: PurchaseFollowPlan,
        as_of: date,
    ) -> PurchaseFollowOverdueNodeRow:
        return PurchaseFollowOverdueNodeRow(
            id=node.id,
            follow_plan_id=node.follow_plan_id,
            purchase_contract_id=plan.purchase_contract_id,
            purchase_contract_no=plan.purchase_contract_no,
            supplier_name=plan.supplier_name,
            node_code=node.node_code,
            node_name=node.node_name,
            planned_date=node.planned_date,
            remind_date=node.remind_date,
            overdue_days=(as_of - node.planned_date).days,
            source_record_type=node.source_record_type,
            source_record_id=node.source_record_id,
        )
