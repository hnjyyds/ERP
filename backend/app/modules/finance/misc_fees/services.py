from collections.abc import Iterable
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.misc_fees.repositories import (
    MiscFeeAllocationRow,
    MiscFeeItemRow,
    MiscFeeRepository,
)
from app.modules.finance.misc_fees.schemas import (
    VALID_MISC_ALLOCATION_METHODS,
    VALID_MISC_FEE_ALLOCATION_STATUSES,
    VALID_MISC_FEE_CATEGORIES,
    VALID_MISC_FEE_ITEM_STATUSES,
    MiscFeeAllocationCreate,
    MiscFeeAllocationListResponse,
    MiscFeeAllocationResponse,
    MiscFeeItemCreate,
    MiscFeeItemListResponse,
    MiscFeeItemResponse,
)
from app.modules.sales.shipments.repositories import ShipmentPlanRepository, ShipmentPlanRow
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class MiscFeeNotFoundError(Exception):
    pass


class MiscFeeService:
    def __init__(
        self,
        repository: MiscFeeRepository,
        shipment_repository: ShipmentPlanRepository,
    ) -> None:
        self._repository = repository
        self._shipment_repository = shipment_repository

    async def create_item(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: MiscFeeItemCreate,
    ) -> MiscFeeItemResponse:
        self._require_finance(current_user)
        self._validate_category(payload.category)
        self._validate_allocation_method(payload.default_allocation_method)
        async with UnitOfWork(self._repository.session):
            item = await self._repository.create_item(
                code=payload.code,
                name=payload.name,
                category=payload.category,
                default_allocation_method=payload.default_allocation_method,
                is_active=payload.is_active,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
        return self._item_response(item)

    async def list_items(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        category: str | None,
        status: str | None,
    ) -> MiscFeeItemListResponse:
        self._require_finance(current_user)
        if category is not None:
            self._validate_category(category)
        if status is not None:
            self._validate_item_status(status)
        items, total = await self._repository.list_items(q=q, category=category, status=status)
        return MiscFeeItemListResponse(
            items=[self._item_response(item) for item in items],
            total=total,
        )

    async def create_allocation(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: MiscFeeAllocationCreate,
    ) -> MiscFeeAllocationResponse:
        self._require_finance(current_user)
        self._validate_allocation_method(payload.allocation_method)
        item = await self._get_item(payload.item_id)
        if not item.is_active:
            raise ValueError("停用杂费项目不能分摊")
        shipment = await self._resolve_shipment(payload)
        async with UnitOfWork(self._repository.session):
            allocation = await self._repository.create_allocation(
                allocation_no=payload.allocation_no,
                item=item,
                shipment_plan_id=shipment.id,
                shipment_no=shipment.code,
                customer_name=shipment.customer_name,
                sales_user_id=payload.sales_user_id,
                sales_user_name=payload.sales_user_name,
                allocated_at=payload.allocated_at,
                amount=payload.amount,
                currency=payload.currency,
                allocation_method=payload.allocation_method,
                basis=payload.basis,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
            await self._repository.subtract_allocation_from_shipment_profit(
                shipment_plan_id=shipment.id,
                amount=payload.amount,
            )
        return self._allocation_response(allocation)

    async def list_allocations(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        item_id: str | None,
        category: str | None,
        shipment_no: str | None,
        sales_user_id: str | None,
        status: str | None,
    ) -> MiscFeeAllocationListResponse:
        self._require_finance(current_user)
        self._validate_allocation_filters(category=category, status=status)
        rows, total = await self._repository.list_allocations(
            q=q,
            item_id=item_id,
            category=category,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            status=status,
        )
        return MiscFeeAllocationListResponse(
            items=[self._allocation_response(row) for row in rows],
            total=total,
            total_allocated_amount=self._money_sum(row.amount for row in rows),
        )

    async def list_allocation_summary(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        item_id: str | None,
        category: str | None,
        shipment_no: str | None,
        sales_user_id: str | None,
        status: str | None,
    ) -> MiscFeeAllocationListResponse:
        return await self.list_allocations(
            current_user=current_user,
            q=q,
            item_id=item_id,
            category=category,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            status=status,
        )

    async def _get_item(self, item_id: str) -> MiscFeeItemRow:
        item = await self._repository.get_item(item_id)
        if item is None:
            raise MiscFeeNotFoundError
        return item

    async def _resolve_shipment(
        self,
        payload: MiscFeeAllocationCreate,
    ) -> ShipmentPlanRow:
        shipment = await self._shipment_repository.get_plan(payload.shipment_plan_id)
        if shipment is None:
            raise MiscFeeNotFoundError
        if payload.shipment_no is not None and payload.shipment_no != shipment.code:
            raise ValueError("杂费分摊出运单号和出运单标识不一致")
        if shipment.approval_status != "approved":
            raise ValueError("只有已审批出运单可以分摊杂费")
        if payload.currency != shipment.currency:
            raise ValueError("杂费分摊币种必须和出运单币种一致")
        return shipment

    def _validate_category(self, category: str) -> None:
        if category not in VALID_MISC_FEE_CATEGORIES:
            raise ValueError("杂费项目分类无效")

    def _validate_allocation_method(self, allocation_method: str) -> None:
        if allocation_method not in VALID_MISC_ALLOCATION_METHODS:
            raise ValueError("杂费分摊方式无效")

    def _validate_item_status(self, status: str) -> None:
        if status not in VALID_MISC_FEE_ITEM_STATUSES:
            raise ValueError("杂费项目状态无效")

    def _validate_allocation_filters(self, *, category: str | None, status: str | None) -> None:
        if category is not None:
            self._validate_category(category)
        if status is not None and status not in VALID_MISC_FEE_ALLOCATION_STATUSES:
            raise ValueError("杂费分摊状态无效")

    def _item_response(self, item: MiscFeeItemRow) -> MiscFeeItemResponse:
        return MiscFeeItemResponse(
            id=item.id,
            code=item.code,
            name=item.name,
            category=item.category,
            default_allocation_method=item.default_allocation_method,
            is_active=item.is_active,
            status=item.status,
            remark=item.remark,
            created_by_user_id=item.created_by_user_id,
            created_by_user_name=item.created_by_user_name,
        )

    def _allocation_response(self, row: MiscFeeAllocationRow) -> MiscFeeAllocationResponse:
        return MiscFeeAllocationResponse(
            id=row.id,
            allocation_no=row.allocation_no,
            item_id=row.item_id,
            item_code=row.item_code,
            item_name=row.item_name,
            item_category=row.item_category,
            shipment_plan_id=row.shipment_plan_id,
            shipment_no=row.shipment_no,
            customer_name=row.customer_name,
            sales_user_id=row.sales_user_id,
            sales_user_name=row.sales_user_name,
            allocated_at=row.allocated_at,
            amount=row.amount,
            currency=row.currency,
            allocation_method=row.allocation_method,
            basis=row.basis,
            status=row.status,
            remark=row.remark,
            created_by_user_id=row.created_by_user_id,
            created_by_user_name=row.created_by_user_name,
        )

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError

    def _money_sum(self, values: Iterable[str]) -> str:
        return f"{sum(Decimal(str(value)) for value in values):.2f}"
