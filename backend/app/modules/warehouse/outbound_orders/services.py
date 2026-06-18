from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.sales.shipments.repositories import ShipmentPlanRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.inbound_orders.repositories import InboundOrderRepository
from app.modules.warehouse.outbound_orders.repositories import (
    OutboundOrderLineRow,
    OutboundOrderRepository,
    OutboundOrderRow,
)
from app.modules.warehouse.outbound_orders.schemas import (
    VALID_OUTBOUND_ORDER_MODES,
    VALID_OUTBOUND_ORDER_STATUSES,
    OutboundOrderApprove,
    OutboundOrderGenerateFromPlan,
    OutboundOrderLineResponse,
    OutboundOrderLineShip,
    OutboundOrderListResponse,
    OutboundOrderResponse,
)
from app.modules.warehouse.outbound_plans.repositories import (
    OutboundPlanLineRow,
    OutboundPlanRepository,
    OutboundPlanRow,
)


class PermissionDeniedError(Exception):
    pass


class OutboundOrderNotFoundError(Exception):
    pass


class OutboundOrderPlanNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class _OrderLineDraft:
    plan_line: OutboundPlanLineRow
    quantity: Decimal
    product_name: str
    product_code: str | None
    product_id: str | None
    unit: str
    remark: str | None


class OutboundOrderService:
    def __init__(
        self,
        *,
        outbound_order_repository: OutboundOrderRepository,
        outbound_plan_repository: OutboundPlanRepository,
        inventory_repository: InboundOrderRepository,
        shipment_repository: ShipmentPlanRepository,
        purchase_contract_repository: PurchaseContractRepository,
        followup_service: FollowupService,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = outbound_order_repository
        self._outbound_plan_repository = outbound_plan_repository
        self._inventory_repository = inventory_repository
        self._shipment_repository = shipment_repository
        self._purchase_contract_repository = purchase_contract_repository
        self._followup_service = followup_service
        self._data_scope_resolver = data_scope_resolver

    async def generate_from_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: OutboundOrderGenerateFromPlan,
    ) -> OutboundOrderResponse:
        self._require(current_user, "warehouse:outbound_order:edit")
        self._validate_mode(payload.outbound_mode)
        if payload.outbound_mode == "exception" and not payload.exception_reason:
            raise ValueError("异常出库必须填写异常原因")
        plan = await self._get_accessible_plan(current_user=current_user, plan_id=payload.plan_id)
        if plan.status in {"closed", "cancelled"}:
            raise ValueError("已关闭或已取消的出库计划不能生成出库单")
        line_drafts = await self._build_line_drafts(plan=plan, shipped_lines=payload.lines)
        async with UnitOfWork(self._repository.session):
            order = await self._repository.create_order(
                code=payload.code,
                plan_id=plan.id,
                source_type=plan.source_type,
                source_id=plan.source_id,
                source_code=plan.source_code,
                outbound_type=plan.outbound_type,
                customer_id=plan.customer_id,
                customer_name=plan.customer_name,
                outbound_mode=payload.outbound_mode,
                outbound_at=payload.outbound_at,
                warehouse_id=payload.warehouse_id,
                warehouse_name=payload.warehouse_name,
                location_id=payload.location_id,
                location_name=payload.location_name,
                operator_name=payload.operator_name,
                status="draft",
                exception_reason=payload.exception_reason,
                owner_user_id=plan.owner_user_id,
            )
            for draft in line_drafts:
                await self._repository.add_line(
                    order_id=order.id,
                    plan_line_id=draft.plan_line.id,
                    source_line_id=draft.plan_line.source_line_id,
                    product_id=draft.product_id,
                    product_code=draft.product_code,
                    product_name=draft.product_name,
                    specification=draft.plan_line.specification,
                    model=draft.plan_line.model,
                    quantity=draft.quantity,
                    unit=draft.unit,
                    remark=draft.remark,
                )
        return await self._order_response(order)

    async def submit_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> OutboundOrderResponse:
        self._require(current_user, "warehouse:outbound_order:edit")
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        if order.status != "draft":
            raise ValueError("只有草稿出库单可以提交")
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_order(order.id)
            if submitted is None:
                raise OutboundOrderNotFoundError
        return await self._order_response(submitted)

    async def approve_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
        payload: OutboundOrderApprove,
    ) -> OutboundOrderResponse:
        self._require(current_user, "warehouse:outbound_order:approve")
        if payload.allow_negative:
            self._require(current_user, "warehouse:outbound_order:allow_negative")
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        if order.status != "submitted":
            raise ValueError("只有已提交出库单可以审批")
        lines = await self._repository.list_lines(order.id)
        if not lines:
            raise ValueError("出库单没有明细")
        if order.outbound_mode == "formal":
            await self._validate_formal_order_matches_plan(lines)
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_order(
                order.id,
                payload.reviewer_name,
                payload.approved_at,
            )
            if approved is None:
                raise OutboundOrderNotFoundError
            for line in lines:
                await self._post_inventory(
                    order=approved,
                    line=line,
                    allow_negative=payload.allow_negative,
                )
                await self._outbound_plan_repository.increase_line_outbound_quantity(
                    line.plan_line_id,
                    line.quantity,
                )
            refreshed_plan = await self._outbound_plan_repository.refresh_plan_status(
                approved.plan_id
            )
            if refreshed_plan is None:
                raise OutboundOrderPlanNotFoundError
        await self._complete_followup_nodes(
            order=approved,
            lines=lines,
            actual_date=payload.approved_at,
        )
        return await self._order_response(approved)

    async def list_orders(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        outbound_mode: str | None,
        outbound_type: str | None,
        customer_id: str | None,
        source_id: str | None,
    ) -> OutboundOrderListResponse:
        self._require(current_user, "warehouse:outbound_order:view")
        if status is not None:
            self._validate_status(status)
        if outbound_mode is not None:
            self._validate_mode(outbound_mode)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows, total = await self._repository.list_orders(
            q=q,
            status=status,
            outbound_mode=outbound_mode,
            outbound_type=outbound_type,
            customer_id=customer_id,
            source_id=source_id,
            owner_user_ids=owner_user_ids,
        )
        return OutboundOrderListResponse(
            items=[await self._order_response(row) for row in rows],
            total=total,
        )

    async def get_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> OutboundOrderResponse:
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        return await self._order_response(order)

    async def _get_accessible_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> OutboundPlanRow:
        plan = await self._outbound_plan_repository.get_plan(plan_id)
        if plan is None:
            raise OutboundOrderPlanNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and plan.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return plan

    async def _get_accessible_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> OutboundOrderRow:
        order = await self._repository.get_order(order_id)
        if order is None:
            raise OutboundOrderNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and order.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return order

    async def _build_line_drafts(
        self,
        *,
        plan: OutboundPlanRow,
        shipped_lines: list[OutboundOrderLineShip],
    ) -> list[_OrderLineDraft]:
        plan_lines = await self._outbound_plan_repository.list_lines(plan.id)
        if not plan_lines:
            raise ValueError("出库计划没有明细")
        plan_lines_by_id = {line.id: line for line in plan_lines}
        if not shipped_lines:
            default_drafts = [
                self._draft_from_plan_line(line)
                for line in plan_lines
                if self._remaining_quantity(line) > Decimal("0")
            ]
            if not default_drafts:
                raise ValueError("该出库计划没有待出库数量")
            return default_drafts
        drafts: list[_OrderLineDraft] = []
        for shipped in shipped_lines:
            plan_line = plan_lines_by_id.get(shipped.plan_line_id)
            if plan_line is None:
                raise ValueError("出库明细不属于该出库计划")
            if shipped.product_name != plan_line.product_name:
                raise ValueError("出库商品名称需与待出库清单一致")
            if shipped.unit != plan_line.unit:
                raise ValueError("出库单位需与待出库清单一致")
            quantity = Decimal(str(shipped.quantity))
            if quantity > self._remaining_quantity(plan_line):
                raise ValueError("出库数量不能超过待出库数量")
            drafts.append(
                _OrderLineDraft(
                    plan_line=plan_line,
                    quantity=quantity,
                    product_name=shipped.product_name,
                    product_code=shipped.product_code or plan_line.product_code,
                    product_id=shipped.product_id or plan_line.product_id,
                    unit=shipped.unit,
                    remark=shipped.remark,
                )
            )
        if not drafts:
            raise ValueError("出库单至少需要一条明细")
        return drafts

    def _draft_from_plan_line(self, plan_line: OutboundPlanLineRow) -> _OrderLineDraft:
        remaining = self._remaining_quantity(plan_line)
        if remaining <= Decimal("0"):
            raise ValueError("该计划明细没有待出库数量")
        return _OrderLineDraft(
            plan_line=plan_line,
            quantity=remaining,
            product_name=plan_line.product_name,
            product_code=plan_line.product_code,
            product_id=plan_line.product_id,
            unit=plan_line.unit,
            remark=plan_line.remark,
        )

    async def _validate_formal_order_matches_plan(
        self,
        lines: list[OutboundOrderLineRow],
    ) -> None:
        for line in lines:
            plan_line = await self._outbound_plan_repository.get_line(line.plan_line_id)
            if plan_line is None:
                raise OutboundOrderPlanNotFoundError
            if line.product_name != plan_line.product_name:
                raise ValueError("正式出库商品名称需与待出库清单一致")
            if Decimal(line.quantity) != self._remaining_quantity(plan_line):
                raise ValueError("正式出库数量需与待出库清单一致")

    async def _post_inventory(
        self,
        *,
        order: OutboundOrderRow,
        line: OutboundOrderLineRow,
        allow_negative: bool,
    ) -> None:
        balance = await self._repository.decrease_available_balance(
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            quantity=line.quantity,
            unit=line.unit,
            allow_negative=allow_negative,
        )
        if balance is None:
            raise ValueError("库存不足，不能造成非授权负库存")
        await self._repository.add_ledger(
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            direction="out",
            quantity=line.quantity,
            unit=line.unit,
            stock_status=line.stock_status,
            source_type="outbound_order",
            source_id=order.id,
            source_code=order.code,
            occurred_at=order.approved_at or order.outbound_at,
            remark=line.remark or order.exception_reason,
        )

    async def _complete_followup_nodes(
        self,
        *,
        order: OutboundOrderRow,
        lines: list[OutboundOrderLineRow],
        actual_date: date,
    ) -> None:
        completed_contract_ids: set[str] = set()
        for line in lines:
            shipment_line = await self._shipment_repository.get_line(line.source_line_id)
            if shipment_line is None:
                continue
            contracts = await self._purchase_contract_repository.list_contracts_by_source_line(
                shipment_line.contract_line_id
            )
            for contract in contracts:
                if contract.id in completed_contract_ids:
                    continue
                completed_contract_ids.add(contract.id)
                await self._followup_service.complete_node_from_source(
                    purchase_contract_id=contract.id,
                    node_code="outbound_completed",
                    source_record_type="inventory_outbound",
                    source_record_id=order.id,
                    actual_date=actual_date,
                    source_summary=f"{order.code} 出库完成",
                )

    async def _order_response(self, order: OutboundOrderRow) -> OutboundOrderResponse:
        lines = await self._repository.list_lines(order.id)
        return OutboundOrderResponse(
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
            reviewer_name=order.reviewer_name,
            owner_user_id=order.owner_user_id,
            lines=[self._line_response(line) for line in lines],
        )

    def _line_response(self, line: OutboundOrderLineRow) -> OutboundOrderLineResponse:
        return OutboundOrderLineResponse(
            id=line.id,
            order_id=line.order_id,
            plan_line_id=line.plan_line_id,
            source_line_id=line.source_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=line.quantity,
            unit=line.unit,
            stock_status=line.stock_status,
            remark=line.remark,
        )

    def _remaining_quantity(self, line: OutboundPlanLineRow) -> Decimal:
        return Decimal(line.planned_quantity) - Decimal(line.outbound_quantity)

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_mode(self, outbound_mode: str) -> None:
        if outbound_mode not in VALID_OUTBOUND_ORDER_MODES:
            raise ValueError("出库模式无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_OUTBOUND_ORDER_STATUSES:
            raise ValueError("出库单状态无效")
