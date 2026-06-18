from dataclasses import dataclass
from datetime import date, timedelta

from app.db.uow import UnitOfWork
from app.modules.followup.repositories import (
    FollowProcessNodeRow,
    FollowProcessTemplateRow,
    FollowupRepository,
    PurchaseFollowNodeRow,
    PurchaseFollowOverdueNodeRow,
    PurchaseFollowPlanRow,
)
from app.modules.followup.schemas import (
    VALID_FOLLOW_PLAN_STATUSES,
    FollowProcessTemplateCreate,
    FollowProcessTemplateListResponse,
    FollowProcessTemplateNodeResponse,
    FollowProcessTemplateResponse,
    FollowSourceEventSync,
    PurchaseFollowNodeResponse,
    PurchaseFollowOverdueNodeListResponse,
    PurchaseFollowOverdueNodeResponse,
    PurchaseFollowPlanListResponse,
    PurchaseFollowPlanResponse,
)
from app.modules.purchase.contracts.repositories import (
    PurchaseContractRepository,
    PurchaseContractRow,
)
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class FollowupTemplateNotFoundError(Exception):
    pass


class FollowupPlanNotFoundError(Exception):
    pass


class FollowupNodeNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class _DefaultFollowupNode:
    node_code: str
    node_name: str
    sequence_no: int
    standard_days: int
    remind_before_days: int
    actual_date_source: str


DEFAULT_FOLLOWUP_NODES = (
    _DefaultFollowupNode(
        node_code="contract_confirmed",
        node_name="合同下单确立",
        sequence_no=10,
        standard_days=0,
        remind_before_days=0,
        actual_date_source="purchase_contract",
    ),
    _DefaultFollowupNode(
        node_code="confirm_sample_submitted",
        node_name="确认样提交",
        sequence_no=20,
        standard_days=3,
        remind_before_days=1,
        actual_date_source="sample_confirm",
    ),
    _DefaultFollowupNode(
        node_code="bulk_sample_submitted",
        node_name="大货样提交",
        sequence_no=30,
        standard_days=7,
        remind_before_days=2,
        actual_date_source="sample_bulk",
    ),
    _DefaultFollowupNode(
        node_code="quality_inspection",
        node_name="QC 查验",
        sequence_no=40,
        standard_days=14,
        remind_before_days=2,
        actual_date_source="qc",
    ),
    _DefaultFollowupNode(
        node_code="inbound_completed",
        node_name="入库",
        sequence_no=50,
        standard_days=20,
        remind_before_days=3,
        actual_date_source="inbound",
    ),
    _DefaultFollowupNode(
        node_code="outbound_completed",
        node_name="出库",
        sequence_no=60,
        standard_days=25,
        remind_before_days=3,
        actual_date_source="outbound",
    ),
)


class FollowupService:
    def __init__(
        self,
        *,
        followup_repository: FollowupRepository,
        purchase_contract_repository: PurchaseContractRepository,
        sample_record_repository: SampleRecordRepository,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = followup_repository
        self._purchase_contract_repository = purchase_contract_repository
        self._sample_record_repository = sample_record_repository
        self._data_scope_resolver = data_scope_resolver

    async def list_templates(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> FollowProcessTemplateListResponse:
        self._require(current_user, "followup:template:view")
        await self.ensure_default_template(owner_user_id=current_user.id)
        rows, total = await self._repository.list_templates()
        return FollowProcessTemplateListResponse(
            items=[await self._template_response(row) for row in rows],
            total=total,
        )

    async def create_template(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: FollowProcessTemplateCreate,
    ) -> FollowProcessTemplateResponse:
        self._require(current_user, "followup:template:edit")
        async with UnitOfWork(self._repository.session):
            template = await self._repository.create_template(
                name=payload.name,
                enabled=payload.enabled,
                is_default=payload.is_default,
                owner_user_id=current_user.id,
            )
            for node in payload.nodes:
                await self._repository.add_template_node(
                    template_id=template.id,
                    node_code=node.node_code,
                    node_name=node.node_name,
                    sequence_no=node.sequence_no,
                    standard_days=node.standard_days,
                    remind_before_days=node.remind_before_days,
                    actual_date_source=node.actual_date_source,
                )
        return await self._template_response(template)

    async def update_template(
        self,
        *,
        current_user: CurrentUserResponse,
        template_id: str,
        payload: FollowProcessTemplateCreate,
    ) -> FollowProcessTemplateResponse:
        self._require(current_user, "followup:template:edit")
        async with UnitOfWork(self._repository.session):
            template = await self._repository.update_template(
                template_id=template_id,
                name=payload.name,
                enabled=payload.enabled,
                is_default=payload.is_default,
            )
            if template is None:
                raise FollowupTemplateNotFoundError
            await self._repository.delete_template_nodes(template.id)
            for node in payload.nodes:
                await self._repository.add_template_node(
                    template_id=template.id,
                    node_code=node.node_code,
                    node_name=node.node_name,
                    sequence_no=node.sequence_no,
                    standard_days=node.standard_days,
                    remind_before_days=node.remind_before_days,
                    actual_date_source=node.actual_date_source,
                )
        return await self._template_response(template)

    async def generate_plan_from_purchase_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        purchase_contract_id: str,
        as_of: date | None,
    ) -> PurchaseFollowPlanResponse:
        self._require(current_user, "followup:plan:edit")
        contract = await self._purchase_contract_repository.get_contract(purchase_contract_id)
        if contract is None:
            raise FollowupPlanNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and contract.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        plan = await self.ensure_plan_for_contract(contract=contract, as_of=as_of)
        return await self._plan_response(plan)

    async def ensure_plan_for_contract(
        self,
        *,
        contract: PurchaseContractRow,
        as_of: date | None = None,
    ) -> PurchaseFollowPlanRow:
        if contract.approval_status != "approved":
            raise ValueError("采购合同审批通过后才能生成跟单计划")
        existing = await self._repository.get_plan_by_contract(contract.id)
        if existing is not None:
            return existing
        base_date = as_of or contract.approved_at or contract.contract_date
        template = await self.ensure_default_template(owner_user_id=contract.owner_user_id)
        template_nodes = await self._repository.list_template_nodes(template.id)
        async with UnitOfWork(self._repository.session):
            plan = await self._repository.create_plan(
                purchase_contract_id=contract.id,
                purchase_contract_no=contract.code,
                supplier_id=contract.supplier_id,
                supplier_name=contract.supplier_name,
                template_id=template.id,
                base_date=base_date,
                owner_user_id=contract.owner_user_id,
            )
            for node in template_nodes:
                planned_date = base_date + timedelta(days=node.standard_days)
                remind_date = planned_date - timedelta(days=node.remind_before_days)
                is_contract_node = node.node_code == "contract_confirmed"
                await self._repository.add_plan_node(
                    follow_plan_id=plan.id,
                    node_code=node.node_code,
                    node_name=node.node_name,
                    sequence_no=node.sequence_no,
                    planned_date=planned_date,
                    remind_date=remind_date,
                    actual_date=base_date if is_contract_node else None,
                    status="completed" if is_contract_node else "pending",
                    source_record_type="purchase_contract" if is_contract_node else None,
                    source_record_id=contract.id if is_contract_node else None,
                    source_summary="采购合同审批通过" if is_contract_node else None,
                )
            refreshed = await self._repository.refresh_plan_status(plan.id)
            if refreshed is None:
                raise FollowupPlanNotFoundError
        return refreshed

    async def list_plans(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        overall_status: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
    ) -> PurchaseFollowPlanListResponse:
        self._require(current_user, "followup:plan:view")
        if overall_status is not None:
            self._validate_plan_status(overall_status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows, total = await self._repository.list_plans(
            q=q,
            overall_status=overall_status,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
        )
        return PurchaseFollowPlanListResponse(
            items=[await self._plan_response(row) for row in rows],
            total=total,
        )

    async def get_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> PurchaseFollowPlanResponse:
        plan = await self._get_accessible_plan(current_user=current_user, plan_id=plan_id)
        return await self._plan_response(plan)

    async def sync_sample_followup_events(
        self,
        *,
        current_user: CurrentUserResponse,
        purchase_contract_id: str,
    ) -> PurchaseFollowPlanResponse:
        self._require(current_user, "followup:plan:edit")
        plan = await self._get_accessible_plan_by_contract(
            current_user=current_user,
            purchase_contract_id=purchase_contract_id,
        )
        events = await self._sample_record_repository.list_followup_events_for_purchase_contract(
            purchase_contract_id
        )
        async with UnitOfWork(self._repository.session):
            for event in events:
                node = await self._repository.get_plan_node(
                    plan_id=plan.id,
                    node_code=event.node_code,
                )
                if node is None:
                    continue
                await self._repository.complete_node(
                    node_id=node.id,
                    actual_date=event.actual_date,
                    source_record_type="sample_followup_event",
                    source_record_id=event.id,
                    source_summary=event.node_label,
                )
            refreshed = await self._repository.refresh_plan_status(plan.id)
            if refreshed is None:
                raise FollowupPlanNotFoundError
        return await self._plan_response(refreshed)

    async def sync_source_event(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: FollowSourceEventSync,
    ) -> PurchaseFollowPlanResponse:
        self._require(current_user, "followup:plan:edit")
        plan = await self._get_accessible_plan_by_contract(
            current_user=current_user,
            purchase_contract_id=payload.purchase_contract_id,
        )
        node = await self._repository.get_plan_node(
            plan_id=plan.id,
            node_code=payload.node_code,
        )
        if node is None:
            raise FollowupNodeNotFoundError
        async with UnitOfWork(self._repository.session):
            await self._repository.complete_node(
                node_id=node.id,
                actual_date=payload.actual_date,
                source_record_type=payload.source_record_type,
                source_record_id=payload.source_record_id,
                source_summary=payload.source_summary,
            )
            refreshed = await self._repository.refresh_plan_status(plan.id)
            if refreshed is None:
                raise FollowupPlanNotFoundError
        return await self._plan_response(refreshed)

    async def complete_node_from_source(
        self,
        *,
        purchase_contract_id: str,
        node_code: str,
        source_record_type: str,
        source_record_id: str,
        actual_date: date,
        source_summary: str,
    ) -> PurchaseFollowPlanRow | None:
        plan = await self._repository.get_plan_by_contract(purchase_contract_id)
        if plan is None:
            return None
        node = await self._repository.get_plan_node(
            plan_id=plan.id,
            node_code=node_code,
        )
        if node is None:
            return None
        async with UnitOfWork(self._repository.session):
            await self._repository.complete_node(
                node_id=node.id,
                actual_date=actual_date,
                source_record_type=source_record_type,
                source_record_id=source_record_id,
                source_summary=source_summary,
            )
            return await self._repository.refresh_plan_status(plan.id)

    async def scan_overdue_nodes(
        self,
        *,
        current_user: CurrentUserResponse,
        as_of: date,
    ) -> PurchaseFollowOverdueNodeListResponse:
        self._require(current_user, "followup:plan:view")
        async with UnitOfWork(self._repository.session):
            await self._repository.mark_overdue_nodes(as_of=as_of)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows = await self._repository.list_overdue_nodes(
            as_of=as_of,
            owner_user_ids=owner_user_ids,
        )
        return PurchaseFollowOverdueNodeListResponse(
            items=[self._overdue_response(row) for row in rows],
            total=len(rows),
        )

    async def ensure_default_template(
        self,
        *,
        owner_user_id: str,
    ) -> FollowProcessTemplateRow:
        existing = await self._repository.get_default_template()
        if existing is not None:
            return existing
        async with UnitOfWork(self._repository.session):
            template = await self._repository.create_template(
                name="标准采购跟单流程",
                enabled=True,
                is_default=True,
                owner_user_id=owner_user_id,
            )
            for node in DEFAULT_FOLLOWUP_NODES:
                await self._repository.add_template_node(
                    template_id=template.id,
                    node_code=node.node_code,
                    node_name=node.node_name,
                    sequence_no=node.sequence_no,
                    standard_days=node.standard_days,
                    remind_before_days=node.remind_before_days,
                    actual_date_source=node.actual_date_source,
                )
        return template

    async def _get_accessible_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> PurchaseFollowPlanRow:
        self._require(current_user, "followup:plan:view")
        plan = await self._repository.get_plan(plan_id)
        if plan is None:
            raise FollowupPlanNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and plan.owner_user_id not in allowed_user_ids:
            raise FollowupPlanNotFoundError
        return plan

    async def _get_accessible_plan_by_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        purchase_contract_id: str,
    ) -> PurchaseFollowPlanRow:
        self._require(current_user, "followup:plan:view")
        plan = await self._repository.get_plan_by_contract(purchase_contract_id)
        if plan is None:
            raise FollowupPlanNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and plan.owner_user_id not in allowed_user_ids:
            raise FollowupPlanNotFoundError
        return plan

    async def _template_response(
        self,
        template: FollowProcessTemplateRow,
    ) -> FollowProcessTemplateResponse:
        nodes = await self._repository.list_template_nodes(template.id)
        return FollowProcessTemplateResponse(
            id=template.id,
            name=template.name,
            enabled=template.enabled,
            is_default=template.is_default,
            owner_user_id=template.owner_user_id,
            nodes=[self._template_node_response(node) for node in nodes],
        )

    def _template_node_response(
        self,
        node: FollowProcessNodeRow,
    ) -> FollowProcessTemplateNodeResponse:
        return FollowProcessTemplateNodeResponse(
            id=node.id,
            template_id=node.template_id,
            node_code=node.node_code,
            node_name=node.node_name,
            sequence_no=node.sequence_no,
            standard_days=node.standard_days,
            remind_before_days=node.remind_before_days,
            actual_date_source=node.actual_date_source,
        )

    async def _plan_response(self, plan: PurchaseFollowPlanRow) -> PurchaseFollowPlanResponse:
        nodes = await self._repository.list_plan_nodes(plan.id)
        return PurchaseFollowPlanResponse(
            id=plan.id,
            purchase_contract_id=plan.purchase_contract_id,
            purchase_contract_no=plan.purchase_contract_no,
            supplier_id=plan.supplier_id,
            supplier_name=plan.supplier_name,
            template_id=plan.template_id,
            base_date=plan.base_date,
            overall_status=plan.overall_status,
            owner_user_id=plan.owner_user_id,
            nodes=[self._plan_node_response(node) for node in nodes],
        )

    def _plan_node_response(
        self,
        node: PurchaseFollowNodeRow,
    ) -> PurchaseFollowNodeResponse:
        overdue_days = 0
        if node.status == "overdue":
            overdue_days = max((date.today() - node.planned_date).days, 0)
        return PurchaseFollowNodeResponse(
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
            overdue_days=overdue_days,
        )

    def _overdue_response(
        self,
        node: PurchaseFollowOverdueNodeRow,
    ) -> PurchaseFollowOverdueNodeResponse:
        return PurchaseFollowOverdueNodeResponse(
            id=node.id,
            follow_plan_id=node.follow_plan_id,
            purchase_contract_id=node.purchase_contract_id,
            purchase_contract_no=node.purchase_contract_no,
            supplier_name=node.supplier_name,
            node_code=node.node_code,
            node_name=node.node_name,
            planned_date=node.planned_date,
            remind_date=node.remind_date,
            overdue_days=node.overdue_days,
            source_record_type=node.source_record_type,
            source_record_id=node.source_record_id,
        )

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_plan_status(self, status: str) -> None:
        if status not in VALID_FOLLOW_PLAN_STATUSES:
            raise ValueError("跟单计划状态无效")
