from dataclasses import dataclass
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.followup.services import FollowupService
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.quality.inspections.repositories import QualityInspectionRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.warehouse.inbound_orders.repositories import (
    InboundOrderLineRow,
    InboundOrderRepository,
    InboundOrderRow,
    InventoryBalanceRow,
    InventoryLedgerRow,
)
from app.modules.warehouse.inbound_orders.schemas import (
    VALID_INBOUND_ORDER_MODES,
    VALID_INBOUND_ORDER_STATUSES,
    InboundOrderApprove,
    InboundOrderGenerateFromPlan,
    InboundOrderLineReceive,
    InboundOrderLineResponse,
    InboundOrderListResponse,
    InboundOrderResponse,
    InventoryBalanceListResponse,
    InventoryBalanceResponse,
    InventoryLedgerListResponse,
    InventoryLedgerResponse,
)
from app.modules.warehouse.inbound_plans.repositories import (
    InboundPlanLineRow,
    InboundPlanRepository,
    InboundPlanRow,
)


class PermissionDeniedError(Exception):
    pass


class InboundOrderNotFoundError(Exception):
    pass


class InboundOrderPlanNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class _OrderLineDraft:
    plan_line: InboundPlanLineRow
    quantity: Decimal
    product_name: str
    product_code: str | None
    product_id: str | None
    unit: str
    remark: str | None


class InboundOrderService:
    def __init__(
        self,
        *,
        inbound_repository: InboundOrderRepository,
        inbound_plan_repository: InboundPlanRepository,
        purchase_contract_repository: PurchaseContractRepository,
        quality_repository: QualityInspectionRepository,
        followup_service: FollowupService,
    ) -> None:
        self._repository = inbound_repository
        self._inbound_plan_repository = inbound_plan_repository
        self._purchase_contract_repository = purchase_contract_repository
        self._quality_repository = quality_repository
        self._followup_service = followup_service

    async def generate_from_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: InboundOrderGenerateFromPlan,
    ) -> InboundOrderResponse:
        self._require(current_user, "warehouse:inbound_order:edit")
        self._validate_mode(payload.inbound_mode)
        plan = await self._get_accessible_plan(current_user=current_user, plan_id=payload.plan_id)
        if plan.status in {"closed", "cancelled"}:
            raise ValueError("已关闭或已取消的入库计划不能生成入库单")
        line_drafts = await self._build_line_drafts(plan=plan, received_lines=payload.lines)
        stock_status = "available" if payload.inbound_mode == "formal" else "pending_inspection"
        async with UnitOfWork(self._repository.session):
            order = await self._repository.create_order(
                code=payload.code,
                plan_id=plan.id,
                purchase_contract_id=plan.purchase_contract_id,
                purchase_contract_no=plan.purchase_contract_no,
                supplier_id=plan.supplier_id,
                supplier_name=plan.supplier_name,
                inbound_type=plan.inbound_type,
                inbound_mode=payload.inbound_mode,
                inbound_at=payload.inbound_at,
                warehouse_id=payload.warehouse_id,
                warehouse_name=payload.warehouse_name,
                location_id=payload.location_id,
                location_name=payload.location_name,
                operator_name=payload.operator_name,
                status="draft",
                owner_user_id=plan.owner_user_id,
            )
            for draft in line_drafts:
                await self._repository.add_line(
                    order_id=order.id,
                    plan_line_id=draft.plan_line.id,
                    purchase_contract_line_id=draft.plan_line.purchase_contract_line_id,
                    product_id=draft.product_id,
                    product_code=draft.product_code,
                    product_name=draft.product_name,
                    specification=draft.plan_line.specification,
                    model=draft.plan_line.model,
                    quantity=draft.quantity,
                    unit=draft.unit,
                    stock_status=stock_status,
                    remark=draft.remark,
                )
        return await self._order_response(order)

    async def submit_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> InboundOrderResponse:
        self._require(current_user, "warehouse:inbound_order:edit")
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        if order.status != "draft":
            raise ValueError("只有草稿入库单可以提交")
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_order(order.id)
            if submitted is None:
                raise InboundOrderNotFoundError
        return await self._order_response(submitted)

    async def approve_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
        payload: InboundOrderApprove,
    ) -> InboundOrderResponse:
        self._require(current_user, "warehouse:inbound_order:approve")
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        if order.status != "submitted":
            raise ValueError("只有已提交入库单可以审批")
        lines = await self._repository.list_lines(order.id)
        if not lines:
            raise ValueError("入库单没有明细")
        if order.inbound_mode == "formal":
            await self._ensure_latest_qc_passed(order.purchase_contract_id)
            await self._validate_formal_order_matches_plan(lines)
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_order(
                order.id,
                payload.reviewer_name,
                payload.approved_at,
            )
            if approved is None:
                raise InboundOrderNotFoundError
            for line in lines:
                await self._post_inventory(order=approved, line=line)
                if approved.inbound_mode == "formal":
                    await self._write_back_purchase_receipt(line)
            if approved.inbound_mode == "formal":
                await self._purchase_contract_repository.refresh_statistics(
                    approved.purchase_contract_id
                )
                refreshed_plan = await self._inbound_plan_repository.refresh_plan_status(
                    approved.plan_id
                )
                if refreshed_plan is None:
                    raise InboundOrderPlanNotFoundError
        if approved.inbound_mode == "formal":
            await self._followup_service.complete_node_from_source(
                purchase_contract_id=approved.purchase_contract_id,
                node_code="inbound_completed",
                source_record_type="inventory_inbound",
                source_record_id=approved.id,
                actual_date=payload.approved_at,
                source_summary=f"{approved.code} 正式入库",
            )
        return await self._order_response(approved)

    async def list_orders(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        inbound_mode: str | None,
        supplier_id: str | None,
        purchase_contract_id: str | None,
    ) -> InboundOrderListResponse:
        self._require(current_user, "warehouse:inbound_order:view")
        if status is not None:
            self._validate_status(status)
        if inbound_mode is not None:
            self._validate_mode(inbound_mode)
        rows, total = await self._repository.list_orders(
            q=q,
            status=status,
            inbound_mode=inbound_mode,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_id=self._owner_filter(current_user),
        )
        return InboundOrderListResponse(
            items=[await self._order_response(row) for row in rows],
            total=total,
        )

    async def get_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> InboundOrderResponse:
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        return await self._order_response(order)

    async def list_inventory_balances(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        warehouse_id: str | None = None,
        location_id: str | None = None,
        product_id: str | None = None,
    ) -> InventoryBalanceListResponse:
        self._require(current_user, "warehouse:inbound_order:view")
        rows, total = await self._repository.list_balances(
            q=q,
            warehouse_id=warehouse_id,
            location_id=location_id,
            product_id=product_id,
        )
        return InventoryBalanceListResponse(
            items=[self._balance_response(row) for row in rows],
            total=total,
        )

    async def list_inventory_ledgers(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None = None,
        source_id: str | None = None,
        product_id: str | None = None,
    ) -> InventoryLedgerListResponse:
        self._require(current_user, "warehouse:inbound_order:view")
        rows, total = await self._repository.list_ledgers(
            q=q,
            source_id=source_id,
            product_id=product_id,
        )
        return InventoryLedgerListResponse(
            items=[self._ledger_response(row) for row in rows],
            total=total,
        )

    async def _get_accessible_plan(
        self,
        *,
        current_user: CurrentUserResponse,
        plan_id: str,
    ) -> InboundPlanRow:
        plan = await self._inbound_plan_repository.get_plan(plan_id)
        if plan is None:
            raise InboundOrderPlanNotFoundError
        if (
            "warehouse:inbound_order:view_all" not in current_user.permissions
            and plan.owner_user_id != current_user.id
        ):
            raise PermissionDeniedError
        return plan

    async def _get_accessible_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> InboundOrderRow:
        order = await self._repository.get_order(order_id)
        if order is None:
            raise InboundOrderNotFoundError
        if (
            "warehouse:inbound_order:view_all" not in current_user.permissions
            and order.owner_user_id != current_user.id
        ):
            raise PermissionDeniedError
        return order

    async def _build_line_drafts(
        self,
        *,
        plan: InboundPlanRow,
        received_lines: list[InboundOrderLineReceive],
    ) -> list[_OrderLineDraft]:
        plan_lines = await self._inbound_plan_repository.list_lines(plan.id)
        if not plan_lines:
            raise ValueError("入库计划没有明细")
        plan_lines_by_id = {line.id: line for line in plan_lines}
        if not received_lines:
            return [
                self._draft_from_plan_line(line)
                for line in plan_lines
                if self._remaining_quantity(line) > Decimal("0")
            ]
        drafts: list[_OrderLineDraft] = []
        for received in received_lines:
            plan_line = plan_lines_by_id.get(received.plan_line_id)
            if plan_line is None:
                raise ValueError("入库明细不属于该入库计划")
            if received.product_name != plan_line.product_name:
                raise ValueError("入库商品名称需与待入库清单一致")
            if received.unit != plan_line.unit:
                raise ValueError("入库单位需与待入库清单一致")
            quantity = Decimal(str(received.quantity))
            if quantity > self._remaining_quantity(plan_line):
                raise ValueError("入库数量不能超过待入库数量")
            drafts.append(
                _OrderLineDraft(
                    plan_line=plan_line,
                    quantity=quantity,
                    product_name=received.product_name,
                    product_code=received.product_code or plan_line.product_code,
                    product_id=received.product_id or plan_line.product_id,
                    unit=received.unit,
                    remark=received.remark,
                )
            )
        if not drafts:
            raise ValueError("入库单至少需要一条明细")
        return drafts

    def _draft_from_plan_line(self, plan_line: InboundPlanLineRow) -> _OrderLineDraft:
        remaining = self._remaining_quantity(plan_line)
        if remaining <= Decimal("0"):
            raise ValueError("该计划明细没有待入库数量")
        return _OrderLineDraft(
            plan_line=plan_line,
            quantity=remaining,
            product_name=plan_line.product_name,
            product_code=plan_line.product_code,
            product_id=plan_line.product_id,
            unit=plan_line.unit,
            remark=plan_line.remark,
        )

    async def _ensure_latest_qc_passed(self, purchase_contract_id: str) -> None:
        latest = await self._quality_repository.get_latest_for_contract(purchase_contract_id)
        if latest is None or latest.result != "passed":
            raise ValueError("货物检验全部通过后才能正式入库")

    async def _validate_formal_order_matches_plan(self, lines: list[InboundOrderLineRow]) -> None:
        for line in lines:
            plan_line = await self._inbound_plan_repository.get_line(line.plan_line_id)
            if plan_line is None:
                raise InboundOrderPlanNotFoundError
            if line.product_name != plan_line.product_name:
                raise ValueError("正式入库商品名称需与待入库清单一致")
            if Decimal(line.quantity) != self._remaining_quantity(plan_line):
                raise ValueError("正式入库数量需与待入库清单一致")

    async def _post_inventory(self, *, order: InboundOrderRow, line: InboundOrderLineRow) -> None:
        available_delta = line.quantity if order.inbound_mode == "formal" else "0"
        pending_delta = line.quantity if order.inbound_mode == "pending_inspection" else "0"
        await self._repository.increase_balance(
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            available_delta=available_delta,
            pending_delta=pending_delta,
            unit=line.unit,
        )
        await self._repository.add_ledger(
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            direction="in",
            quantity=line.quantity,
            unit=line.unit,
            stock_status=line.stock_status,
            source_type="inbound_order",
            source_id=order.id,
            source_code=order.code,
            occurred_at=order.approved_at or order.inbound_at,
            remark=line.remark,
        )

    async def _write_back_purchase_receipt(self, line: InboundOrderLineRow) -> None:
        await self._inbound_plan_repository.increase_line_received_quantity(
            line.plan_line_id,
            line.quantity,
        )
        await self._purchase_contract_repository.increase_line_received_quantity(
            line.purchase_contract_line_id,
            line.quantity,
        )

    async def _order_response(self, order: InboundOrderRow) -> InboundOrderResponse:
        lines = await self._repository.list_lines(order.id)
        return InboundOrderResponse(
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
            reviewer_name=order.reviewer_name,
            owner_user_id=order.owner_user_id,
            lines=[self._line_response(line) for line in lines],
        )

    def _line_response(self, line: InboundOrderLineRow) -> InboundOrderLineResponse:
        return InboundOrderLineResponse(
            id=line.id,
            order_id=line.order_id,
            plan_line_id=line.plan_line_id,
            purchase_contract_line_id=line.purchase_contract_line_id,
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

    def _balance_response(self, row: InventoryBalanceRow) -> InventoryBalanceResponse:
        return InventoryBalanceResponse(
            id=row.id,
            warehouse_id=row.warehouse_id,
            warehouse_name=row.warehouse_name,
            location_id=row.location_id,
            location_name=row.location_name,
            product_id=row.product_id,
            product_code=row.product_code,
            product_name=row.product_name,
            available_quantity=row.available_quantity,
            locked_quantity=row.locked_quantity,
            pending_inspection_quantity=row.pending_inspection_quantity,
            unit=row.unit,
        )

    def _ledger_response(self, row: InventoryLedgerRow) -> InventoryLedgerResponse:
        return InventoryLedgerResponse(
            id=row.id,
            warehouse_id=row.warehouse_id,
            warehouse_name=row.warehouse_name,
            location_id=row.location_id,
            location_name=row.location_name,
            product_id=row.product_id,
            product_code=row.product_code,
            product_name=row.product_name,
            direction=row.direction,
            quantity=row.quantity,
            unit=row.unit,
            stock_status=row.stock_status,
            source_type=row.source_type,
            source_id=row.source_id,
            source_code=row.source_code,
            occurred_at=row.occurred_at,
            remark=row.remark,
        )

    def _remaining_quantity(self, line: InboundPlanLineRow) -> Decimal:
        return Decimal(line.planned_quantity) - Decimal(line.received_quantity)

    def _owner_filter(self, current_user: CurrentUserResponse) -> str | None:
        if "warehouse:inbound_order:view_all" in current_user.permissions:
            return None
        return current_user.id

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_mode(self, inbound_mode: str) -> None:
        if inbound_mode not in VALID_INBOUND_ORDER_MODES:
            raise ValueError("入库模式无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_INBOUND_ORDER_STATUSES:
            raise ValueError("入库单状态无效")
