from datetime import date

from app.db.uow import UnitOfWork
from app.modules.purchase.contracts.repositories import (
    PurchaseContractRepository,
    PurchaseContractRow,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.inbound_plans.repositories import (
    InboundPlanLineRow,
    InboundPlanRepository,
    InboundPlanRow,
)
from app.modules.warehouse.inbound_plans.schemas import (
    VALID_INBOUND_PLAN_STATUSES,
    VALID_INBOUND_TYPES,
    InboundPlanGenerateFromPurchaseContract,
    InboundPlanLineResponse,
    InboundPlanListResponse,
    InboundPlanResponse,
    InboundPlanSchedule,
)


class PermissionDeniedError(Exception):
    pass


class InboundPlanNotFoundError(Exception):
    pass


class InboundPlanPurchaseContractNotFoundError(Exception):
    pass


class InboundPlanService:
    def __init__(
        self,
        *,
        inbound_repository: InboundPlanRepository,
        purchase_contract_repository: PurchaseContractRepository,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = inbound_repository
        self._purchase_contract_repository = purchase_contract_repository
        self._data_scope_resolver = data_scope_resolver

    async def generate_from_purchase_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: InboundPlanGenerateFromPurchaseContract,
    ) -> InboundPlanResponse:
        self._require(current_user, "warehouse:inbound_plan:edit")
        contract = await self._get_accessible_contract(
            current_user=current_user,
            purchase_contract_id=payload.purchase_contract_id,
        )
        if contract.approval_status != "approved":
            raise ValueError("采购合同审批通过后才能生成入库计划")
        async with UnitOfWork(self._repository.session):
            plan = await self.ensure_plan_for_contract(
                contract=contract,
                inbound_type=payload.inbound_type,
                planned_date=payload.planned_date,
            )
        return await self._plan_response(plan)

    async def ensure_plan_for_contract(
        self,
        *,
        contract: PurchaseContractRow,
        inbound_type: str = "purchase_inbound",
        planned_date: date | None = None,
    ) -> InboundPlanRow:
        existing = await self._repository.get_plan_by_contract(contract.id)
        if existing is not None:
            return existing
        self._validate_inbound_type(inbound_type)
        lines = await self._purchase_contract_repository.list_lines(contract.id)
        if not lines:
            raise ValueError("采购合同没有明细，无法生成入库计划")
        plan = await self._repository.create_plan(
            code=f"IP-{contract.code}",
            purchase_contract_id=contract.id,
            purchase_contract_no=contract.code,
            supplier_id=contract.supplier_id,
            supplier_name=contract.supplier_name,
            inbound_type=inbound_type,
            planned_date=planned_date if planned_date is not None else contract.delivery_date,
            status="planned",
            owner_user_id=contract.owner_user_id,
        )
        for line in lines:
            await self._repository.add_line(
                plan_id=plan.id,
                purchase_contract_line_id=line.id,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                specification=line.specification,
                model=line.model,
                planned_quantity=line.unreceived_quantity,
                unit=line.unit,
                remark=line.remark or "采购合同待入库",
            )
        return plan

    async def list_plans(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        inbound_type: str | None,
        status: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
    ) -> InboundPlanListResponse:
        self._require(current_user, "warehouse:inbound_plan:view")
        if inbound_type is not None:
            self._validate_inbound_type(inbound_type)
        if status is not None:
            self._validate_status(status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows, total = await self._repository.list_plans(
            q=q,
            inbound_type=inbound_type,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
        )
        return InboundPlanListResponse(
            items=[await self._plan_response(row) for row in rows],
            total=total,
        )

    async def get_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> InboundPlanResponse:
        plan = await self._get_accessible_plan(current_user=current_user, plan_id=plan_id)
        return await self._plan_response(plan)

    async def schedule_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
        payload: InboundPlanSchedule,
    ) -> InboundPlanResponse:
        self._require(current_user, "warehouse:inbound_plan:edit")
        plan = await self._get_accessible_plan(current_user=current_user, plan_id=plan_id)
        if plan.status in {"closed", "cancelled"}:
            raise ValueError("已关闭或已取消的入库计划不能排库位")
        async with UnitOfWork(self._repository.session):
            scheduled = await self._repository.schedule_plan(
                plan_id=plan.id,
                planned_date=payload.planned_date,
                warehouse_id=payload.warehouse_id,
                warehouse_name=payload.warehouse_name,
                location_id=payload.location_id,
                location_name=payload.location_name,
                operator_name=payload.operator_name,
            )
            if scheduled is None:
                raise InboundPlanNotFoundError
        return await self._plan_response(scheduled)

    async def _get_accessible_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        purchase_contract_id: str,
    ) -> PurchaseContractRow:
        contract = await self._purchase_contract_repository.get_contract(purchase_contract_id)
        if contract is None:
            raise InboundPlanPurchaseContractNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and contract.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return contract

    async def _get_accessible_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> InboundPlanRow:
        self._require(current_user, "warehouse:inbound_plan:view")
        plan = await self._repository.get_plan(plan_id)
        if plan is None:
            raise InboundPlanNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and plan.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return plan

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_inbound_type(self, inbound_type: str) -> None:
        if inbound_type not in VALID_INBOUND_TYPES:
            raise ValueError("入库类型无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_INBOUND_PLAN_STATUSES:
            raise ValueError("入库计划状态无效")

    async def _plan_response(self, plan: InboundPlanRow) -> InboundPlanResponse:
        lines = await self._repository.list_lines(plan.id)
        return InboundPlanResponse(
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
            lines=[self._line_response(line) for line in lines],
        )

    def _line_response(self, line: InboundPlanLineRow) -> InboundPlanLineResponse:
        return InboundPlanLineResponse(
            id=line.id,
            plan_id=line.plan_id,
            purchase_contract_line_id=line.purchase_contract_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            planned_quantity=line.planned_quantity,
            received_quantity=line.received_quantity,
            unit=line.unit,
            status=line.status,
            remark=line.remark,
        )
