from datetime import date
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.system.audit_logs.recorder import record_audit
from app.modules.system.auth.assignees import AssigneeValidator
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.permissions import can_approve_assigned_record
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.numbering.generator import create_with_generated_code
from app.modules.warehouse.errors import DocumentStatusConflictError
from app.modules.warehouse.inventory.services import InventoryService
from app.modules.warehouse.stocktakes.repositories import (
    StocktakeLineRow,
    StocktakeOrderRow,
    StocktakeRepository,
)
from app.modules.warehouse.stocktakes.schemas import (
    StocktakeApprove,
    StocktakeCreate,
    StocktakeLineCreate,
    StocktakeLineResponse,
    StocktakeOrderListResponse,
    StocktakeOrderResponse,
    StocktakeSubmit,
)


class PermissionDeniedError(Exception):
    pass


class StocktakeNotFoundError(Exception):
    pass


class StocktakeService:
    def __init__(
        self,
        *,
        stocktake_repository: StocktakeRepository,
        inventory_service: InventoryService,
        data_scope_resolver: DataScopeResolver,
        assignee_validator: AssigneeValidator,
    ) -> None:
        self._repository = stocktake_repository
        self._inventory_service = inventory_service
        self._data_scope_resolver = data_scope_resolver
        self._assignee_validator = assignee_validator

    async def create_stocktake(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: StocktakeCreate,
    ) -> StocktakeOrderResponse:
        self._require(current_user, "warehouse:stocktake:edit")
        self._validate_lines(payload.lines)

        async def create_order(code: str) -> StocktakeOrderRow:
            async with UnitOfWork(self._repository.session):
                order = await self._repository.create_order(
                    code=code,
                    warehouse_id=payload.warehouse_id,
                    warehouse_name=payload.warehouse_name,
                    location_id=payload.location_id,
                    location_name=payload.location_name,
                    count_date=payload.count_date,
                    operator_name=payload.operator_name,
                    owner_user_id=current_user.id,
                    remark=payload.remark,
                )
                for line in payload.lines:
                    # 账面数在创建时快照，后续库存变动不重算。
                    book_quantity = await self._inventory_service.get_available_quantity(
                        warehouse_id=payload.warehouse_id,
                        location_id=payload.location_id,
                        product_id=line.product_id,
                        product_code=line.product_code,
                        product_name=line.product_name,
                        unit=line.unit,
                    )
                    await self._repository.add_line(
                        order_id=order.id,
                        product_id=line.product_id,
                        product_code=line.product_code,
                        product_name=line.product_name,
                        unit=line.unit,
                        book_quantity=book_quantity,
                        actual_quantity=line.actual_quantity,
                        difference_quantity=Decimal(line.actual_quantity) - book_quantity,
                        remark=line.remark,
                    )
                return order

        order = await create_with_generated_code("warehouse.stocktake", create_order)
        return await self._response(order)

    async def list_stocktakes(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None = None,
        status: str | None = None,
        warehouse_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> StocktakeOrderListResponse:
        self._require(current_user, "warehouse:stocktake:view")
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows, total = await self._repository.list_orders(
            q=q,
            status=status,
            warehouse_id=warehouse_id,
            allowed_user_ids=allowed_user_ids,
            limit=limit,
            offset=offset,
        )
        items = [await self._response(row) for row in rows]
        return StocktakeOrderListResponse(items=items, total=total)

    async def get_stocktake(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> StocktakeOrderResponse:
        self._require(current_user, "warehouse:stocktake:view")
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        return await self._response(order)

    async def submit_stocktake(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
        payload: StocktakeSubmit,
    ) -> StocktakeOrderResponse:
        self._require(current_user, "warehouse:stocktake:edit")
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        if order.status != "draft":
            raise ValueError("只有草稿盘点单可以提交")
        reviewer = await self._assignee_validator.require(
            user_id=payload.reviewer_id,
            required_permission="warehouse:stocktake:approve",
            role_name="审批人",
            permission_error="所选员工没有盘点审批权限",
            excluded_user_id=current_user.id,
        )
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_order(
                order.id,
                reviewer_id=reviewer.id,
                reviewer_name=reviewer.display_name,
                submitted_at=date.today(),
            )
            if submitted is None:
                raise DocumentStatusConflictError
            await record_audit(
                self._repository.session,
                current_user,
                "submit",
                "stocktake_order",
                submitted.id,
                submitted.code,
                "提交盘点单",
            )
        return await self._response(submitted)

    async def approve_stocktake(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
        payload: StocktakeApprove,
    ) -> StocktakeOrderResponse:
        self._require(current_user, "warehouse:stocktake:approve")
        order = await self._get_accessible_order(current_user=current_user, order_id=order_id)
        if order.status != "submitted":
            raise DocumentStatusConflictError
        if not can_approve_assigned_record(
            current_user_id=current_user.id,
            reviewer_id=order.reviewer_id,
            permissions=current_user.permissions,
        ):
            raise PermissionDeniedError
        lines = await self._repository.list_lines(order.id)
        if not lines:
            raise ValueError("盘点单没有明细")
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_order(
                order.id,
                reviewer_id=current_user.id,
                reviewer_name=current_user.display_name,
                approved_at=payload.approved_at,
            )
            if approved is None:
                raise DocumentStatusConflictError
            for line in lines:
                await self._apply_adjustment(order=approved, line=line)
            await record_audit(
                self._repository.session,
                current_user,
                "approve",
                "stocktake_order",
                approved.id,
                approved.code,
                "审批盘点单并调整库存",
            )
        return await self._response(approved)

    async def _apply_adjustment(
        self,
        *,
        order: StocktakeOrderRow,
        line: StocktakeLineRow,
    ) -> None:
        difference = Decimal(line.difference_quantity)
        if difference == 0:
            return
        direction = "in" if difference > 0 else "out"
        quantity = abs(difference)
        if difference > 0:
            await self._inventory_service.increase_balance(
                warehouse_id=order.warehouse_id,
                warehouse_name=order.warehouse_name,
                location_id=order.location_id,
                location_name=order.location_name,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                available_delta=quantity,
                pending_delta="0",
                unit=line.unit,
            )
        else:
            adjusted = await self._inventory_service.decrease_available_balance(
                warehouse_id=order.warehouse_id,
                warehouse_name=order.warehouse_name,
                location_id=order.location_id,
                location_name=order.location_name,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                quantity=quantity,
                unit=line.unit,
                allow_negative=False,
            )
            if adjusted is None:
                raise ValueError("可用库存不足，无法完成盘点调整")
        await self._inventory_service.add_ledger(
            warehouse_id=order.warehouse_id,
            warehouse_name=order.warehouse_name,
            location_id=order.location_id,
            location_name=order.location_name,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            direction=direction,
            quantity=quantity,
            unit=line.unit,
            stock_status="available",
            source_type="stocktake",
            source_id=order.id,
            source_code=order.code,
            occurred_at=order.approved_at or order.count_date,
            remark="盘点调整",
        )

    async def _get_accessible_order(
        self,
        *,
        current_user: CurrentUserResponse,
        order_id: str,
    ) -> StocktakeOrderRow:
        order = await self._repository.get_order(order_id)
        if order is None:
            raise StocktakeNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and order.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return order

    async def _response(self, order: StocktakeOrderRow) -> StocktakeOrderResponse:
        lines = await self._repository.list_lines(order.id)
        return StocktakeOrderResponse(
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
            lines=[
                StocktakeLineResponse(
                    id=line.id,
                    order_id=line.order_id,
                    product_id=line.product_id,
                    product_code=line.product_code,
                    product_name=line.product_name,
                    unit=line.unit,
                    book_quantity=line.book_quantity,
                    actual_quantity=line.actual_quantity,
                    difference_quantity=line.difference_quantity,
                    remark=line.remark,
                )
                for line in lines
            ],
        )

    def _validate_lines(self, lines: list[StocktakeLineCreate]) -> None:
        seen: set[str] = set()
        for line in lines:
            key = line.product_id or f"{line.product_code or ''}|{line.product_name}"
            if key in seen:
                raise ValueError("盘点明细存在重复商品")
            seen.add(key)

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError
