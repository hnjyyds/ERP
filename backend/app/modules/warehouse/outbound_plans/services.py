from app.db.uow import UnitOfWork
from app.modules.sales.shipments.repositories import (
    ShipmentLineRow,
    ShipmentPlanRepository,
    ShipmentPlanRow,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.outbound_plans.repositories import (
    OutboundPlanLineRow,
    OutboundPlanRepository,
    OutboundPlanRow,
)
from app.modules.warehouse.outbound_plans.schemas import (
    VALID_OUTBOUND_PLAN_STATUSES,
    VALID_OUTBOUND_SOURCE_TYPES,
    VALID_OUTBOUND_TYPES,
    OutboundPlanGenerateFromShipment,
    OutboundPlanLineResponse,
    OutboundPlanListResponse,
    OutboundPlanResponse,
    OutboundPlanSchedule,
)


class PermissionDeniedError(Exception):
    pass


class OutboundPlanNotFoundError(Exception):
    pass


class OutboundPlanShipmentNotFoundError(Exception):
    pass


class OutboundPlanService:
    def __init__(
        self,
        *,
        outbound_repository: OutboundPlanRepository,
        shipment_repository: ShipmentPlanRepository,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = outbound_repository
        self._shipment_repository = shipment_repository
        self._data_scope_resolver = data_scope_resolver

    async def generate_from_shipment(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: OutboundPlanGenerateFromShipment,
    ) -> OutboundPlanResponse:
        self._require(current_user, "warehouse:outbound_plan:edit")
        self._validate_outbound_type(payload.outbound_type)
        shipment = await self._get_accessible_shipment(
            current_user=current_user,
            shipment_id=payload.shipment_plan_id,
        )
        if shipment.approval_status != "approved":
            raise ValueError("出货明细审批通过后才能生成出库计划")
        existing = await self._repository.get_plan_by_source(
            source_type="shipment_plan",
            source_id=shipment.id,
            outbound_type=payload.outbound_type,
        )
        if existing is not None:
            return await self._plan_response(existing)
        shipment_lines = await self._shipment_repository.list_lines(shipment.id)
        if not shipment_lines:
            raise ValueError("出货明细没有商品，无法生成出库计划")
        async with UnitOfWork(self._repository.session):
            plan = await self._repository.create_plan(
                code=f"OP-{shipment.code}",
                source_type="shipment_plan",
                source_id=shipment.id,
                source_code=shipment.code,
                outbound_type=payload.outbound_type,
                planned_date=payload.planned_date or shipment.planned_ship_date,
                status="planned",
                customer_id=shipment.customer_id,
                customer_name=shipment.customer_name,
                owner_user_id=shipment.owner_user_id,
            )
            for line in shipment_lines:
                await self._add_line_from_shipment(plan=plan, line=line)
        return await self._plan_response(plan)

    async def list_plans(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        outbound_type: str | None,
        source_type: str | None,
        customer_id: str | None,
        source_id: str | None,
    ) -> OutboundPlanListResponse:
        self._require(current_user, "warehouse:outbound_plan:view")
        if status is not None:
            self._validate_status(status)
        if outbound_type is not None:
            self._validate_outbound_type(outbound_type)
        if source_type is not None:
            self._validate_source_type(source_type)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows, total = await self._repository.list_plans(
            q=q,
            status=status,
            outbound_type=outbound_type,
            source_type=source_type,
            customer_id=customer_id,
            source_id=source_id,
            owner_user_ids=owner_user_ids,
        )
        return OutboundPlanListResponse(
            items=[await self._plan_response(row) for row in rows],
            total=total,
        )

    async def get_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> OutboundPlanResponse:
        plan = await self._get_accessible_plan(current_user=current_user, plan_id=plan_id)
        return await self._plan_response(plan)

    async def schedule_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
        payload: OutboundPlanSchedule,
    ) -> OutboundPlanResponse:
        self._require(current_user, "warehouse:outbound_plan:edit")
        plan = await self._get_accessible_plan(current_user=current_user, plan_id=plan_id)
        if plan.status in {"closed", "cancelled"}:
            raise ValueError("已关闭或已取消的出库计划不能排库位")
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
                raise OutboundPlanNotFoundError
        return await self._plan_response(scheduled)

    async def _add_line_from_shipment(
        self,
        *,
        plan: OutboundPlanRow,
        line: ShipmentLineRow,
    ) -> None:
        await self._repository.add_line(
            plan_id=plan.id,
            source_line_id=line.id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            planned_quantity=line.quantity,
            unit=line.unit,
            remark=f"{plan.source_code} 待出库商品",
        )

    async def _get_accessible_shipment(
        self,
        *,
        current_user: CurrentUserResponse,
        shipment_id: str,
    ) -> ShipmentPlanRow:
        shipment = await self._shipment_repository.get_plan(shipment_id)
        if shipment is None:
            raise OutboundPlanShipmentNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and shipment.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return shipment

    async def _get_accessible_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> OutboundPlanRow:
        self._require(current_user, "warehouse:outbound_plan:view")
        plan = await self._repository.get_plan(plan_id)
        if plan is None:
            raise OutboundPlanNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and plan.owner_user_id not in allowed_user_ids:
            raise OutboundPlanNotFoundError
        return plan

    async def _plan_response(self, plan: OutboundPlanRow) -> OutboundPlanResponse:
        lines = await self._repository.list_lines(plan.id)
        return OutboundPlanResponse(
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
            lines=[self._line_response(line) for line in lines],
        )

    def _line_response(self, line: OutboundPlanLineRow) -> OutboundPlanLineResponse:
        return OutboundPlanLineResponse(
            id=line.id,
            plan_id=line.plan_id,
            source_line_id=line.source_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            planned_quantity=line.planned_quantity,
            outbound_quantity=line.outbound_quantity,
            unit=line.unit,
            status=line.status,
            remark=line.remark,
        )

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_outbound_type(self, outbound_type: str) -> None:
        if outbound_type not in VALID_OUTBOUND_TYPES:
            raise ValueError("出库类型无效")

    def _validate_source_type(self, source_type: str) -> None:
        if source_type not in VALID_OUTBOUND_SOURCE_TYPES:
            raise ValueError("出库来源无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_OUTBOUND_PLAN_STATUSES:
            raise ValueError("出库计划状态无效")
