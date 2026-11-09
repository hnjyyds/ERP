import csv
from datetime import date
from decimal import Decimal
from io import StringIO

from app.core.messages import localize_labels
from app.db.uow import UnitOfWork
from app.modules.sample.deliveries.repositories import (
    SampleDeliveryFeeStatisticRow,
    SampleDeliveryLineRow,
    SampleDeliveryRepository,
    SampleDeliveryRow,
)
from app.modules.sample.deliveries.responses import build_delivery_response
from app.modules.sample.deliveries.schemas import (
    VALID_SAMPLE_DELIVERY_STATUSES,
    SampleDeliveryApprove,
    SampleDeliveryCreate,
    SampleDeliveryCustomerStatisticResponse,
    SampleDeliveryExportResponse,
    SampleDeliveryExpressStatisticResponse,
    SampleDeliveryFeeStatisticResponse,
    SampleDeliveryFeeStatisticsResponse,
    SampleDeliveryListResponse,
    SampleDeliveryListSummary,
    SampleDeliveryReject,
    SampleDeliveryResponse,
    SampleDeliveryStatisticsResponse,
    SampleDeliveryStatusStatisticResponse,
    SampleDeliverySubmit,
    SampleDeliveryTrackingUpdate,
    SampleDeliveryWithdraw,
)
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.assignees import AssigneeValidator
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.permissions import can_approve_assigned_record
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.numbering.generator import create_with_generated_code


class PermissionDeniedError(Exception):
    pass


class SampleDeliveryNotFoundError(Exception):
    pass


class SampleDeliveryService:
    def __init__(
        self,
        repository: SampleDeliveryRepository,
        sample_record_repository: SampleRecordRepository,
        *,
        data_scope_resolver: DataScopeResolver,
        auth_repository: AuthRepository | None = None,
    ) -> None:
        self._repository = repository
        self._sample_record_repository = sample_record_repository
        self._data_scope_resolver = data_scope_resolver
        self._assignee_validator = AssigneeValidator(
            auth_repository or AuthRepository(repository.session)
        )

    async def create_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: SampleDeliveryCreate,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")

        async def create_delivery_row(code: str) -> SampleDeliveryRow:
            async with UnitOfWork(self._repository.session):
                delivery = await self._repository.create_delivery(
                    code=code,
                    delivery_date=payload.delivery_date,
                    customer_id=payload.customer_id,
                    customer_name=payload.customer_name,
                    supplier_id=payload.supplier_id,
                    supplier_name=payload.supplier_name,
                    factory_id=payload.factory_id,
                    factory_name=payload.factory_name,
                    recipient_name=payload.recipient_name,
                    recipient_company=payload.recipient_company,
                    recipient_address=payload.recipient_address,
                    express_company=payload.express_company,
                    tracking_no=payload.tracking_no,
                    quote_id=payload.quote_id,
                    quote_no=payload.quote_no,
                    remark=payload.remark,
                    status="draft",
                    owner_user_id=current_user.id,
                )
                await self._add_delivery_children(delivery.id, payload)
                return delivery

        delivery = await create_with_generated_code("sample.delivery", create_delivery_row)
        return await self._delivery_response(delivery)

    async def update_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
        payload: SampleDeliveryCreate,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        if delivery.status not in {"draft", "rejected"}:
            raise ValueError("只有草稿或已驳回的寄样单可以编辑")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_delivery(
                delivery_id=delivery.id,
                delivery_date=payload.delivery_date,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                factory_id=payload.factory_id,
                factory_name=payload.factory_name,
                recipient_name=payload.recipient_name,
                recipient_company=payload.recipient_company,
                recipient_address=payload.recipient_address,
                express_company=payload.express_company,
                tracking_no=payload.tracking_no,
                quote_id=payload.quote_id,
                quote_no=payload.quote_no,
                remark=payload.remark,
                reset_to_draft=delivery.status == "rejected",
            )
            if updated is None:
                raise SampleDeliveryNotFoundError
            await self._repository.delete_lines(delivery.id)
            await self._repository.delete_fees(delivery.id)
            await self._add_delivery_children(delivery.id, payload)
        return await self._delivery_response(updated)

    async def get_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
    ) -> SampleDeliveryResponse:
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        return await self._delivery_response(delivery)

    async def list_deliveries(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        customer_id: str | None,
        express_company: str | None,
        date_from: date | None,
        date_to: date | None,
        limit: int = 50,
        offset: int = 0,
    ) -> SampleDeliveryListResponse:
        self._require(current_user, "sample:delivery:view")
        if status is not None:
            self._validate_status(status)
        if date_from and date_to and date_from > date_to:
            raise ValueError("寄样日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        deliveries, total = await self._repository.list_deliveries(
            q=q,
            status=status,
            customer_id=customer_id,
            express_company=express_company,
            date_from=date_from,
            date_to=date_to,
            owner_user_ids=owner_user_ids,
            limit=limit,
            offset=offset,
        )
        pending_count, approved_count = await self._repository.count_delivery_statuses(
            q=q,
            status=status,
            customer_id=customer_id,
            express_company=express_company,
            date_from=date_from,
            date_to=date_to,
            owner_user_ids=owner_user_ids,
        )
        return SampleDeliveryListResponse(
            items=[await self._delivery_response(delivery) for delivery in deliveries],
            total=total,
            summary=SampleDeliveryListSummary(
                total=total,
                pending_count=pending_count,
                approved_count=approved_count,
            ),
        )

    async def submit_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
        payload: SampleDeliverySubmit,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        if delivery.status != "draft":
            raise ValueError("只有草稿寄样单可以提交")
        reviewer = await self._assignee_validator.require(
            user_id=payload.reviewer_id,
            required_permission="sample:delivery:approve",
            role_name="审批人",
            permission_error="所选员工没有寄样审批权限",
            excluded_user_id=current_user.id,
        )
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_delivery(
                delivery_id,
                reviewer_id=reviewer.id,
                reviewer_name=reviewer.display_name,
            )
            if submitted is None:
                raise SampleDeliveryNotFoundError
        return await self._delivery_response(submitted)

    async def approve_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
        payload: SampleDeliveryApprove,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:approve")
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        if delivery.status != "submitted":
            raise ValueError("只有已提交寄样单可以审核")
        if not can_approve_assigned_record(
            current_user_id=current_user.id,
            reviewer_id=delivery.reviewer_id,
            permissions=current_user.permissions,
        ):
            raise PermissionDeniedError
        lines = await self._repository.list_lines(delivery_id)
        for sample_record_id in {line.sample_record_id for line in lines}:
            if await self._sample_record_repository.delivered_stock_event_exists(
                sample_record_id=sample_record_id,
                delivery_no=delivery.code,
            ):
                raise ValueError("该寄样单已有发货记账，不能重复入账")
        await self._ensure_stock_available(lines)
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_delivery(
                delivery_id=delivery_id,
                approved_at=payload.approved_at,
                reviewer_id=current_user.id,
                reviewer_name=current_user.display_name,
            )
            if approved is None:
                raise SampleDeliveryNotFoundError
            for line in lines:
                await self._sample_record_repository.add_stock_event(
                    sample_record_id=line.sample_record_id,
                    event_type="delivered",
                    quantity=line.quantity,
                    unit=line.unit,
                    occurred_at=approved.delivery_date,
                    delivery_no=approved.code,
                    recipient=approved.recipient_company or approved.customer_name,
                    note=None,
                )
        return await self._delivery_response(approved)

    async def reject_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
        payload: SampleDeliveryReject,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:approve")
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        if delivery.status != "submitted":
            raise ValueError("只有已提交寄样单可以驳回")
        if not can_approve_assigned_record(
            current_user_id=current_user.id,
            reviewer_id=delivery.reviewer_id,
            permissions=current_user.permissions,
        ):
            raise PermissionDeniedError
        await self._ensure_no_downstream_effects(delivery)
        async with UnitOfWork(self._repository.session):
            rejected = await self._repository.reject_delivery(
                delivery_id=delivery_id,
                rejected_at=payload.rejected_at,
                rejection_reason=payload.rejection_reason,
                reviewer_id=current_user.id,
                reviewer_name=current_user.display_name,
            )
            if rejected is None:
                raise SampleDeliveryNotFoundError
        return await self._delivery_response(rejected)

    async def withdraw_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
        payload: SampleDeliveryWithdraw,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        if delivery.status != "submitted":
            raise ValueError("只有已提交寄样单可以撤回")
        if (
            delivery.owner_user_id != current_user.id
            and "system:super_admin" not in current_user.permissions
        ):
            raise PermissionDeniedError
        await self._ensure_no_downstream_effects(delivery)
        async with UnitOfWork(self._repository.session):
            withdrawn = await self._repository.withdraw_delivery(delivery_id)
            if withdrawn is None:
                raise SampleDeliveryNotFoundError
        return await self._delivery_response(withdrawn)

    async def update_tracking(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
        payload: SampleDeliveryTrackingUpdate,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")
        self._validate_status(payload.status)
        if payload.status not in {"approved", "shipped"}:
            raise ValueError("物流更新只能将寄样单标记为已审批或已发货")
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        if delivery.status not in {"approved", "shipped"}:
            raise ValueError("只有已审批或已发货的寄样单可以更新物流")
        if delivery.status == "shipped" and payload.status != "shipped":
            raise ValueError("已发货的寄样单不能回退物流状态")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_tracking(
                delivery_id=delivery_id,
                express_company=payload.express_company,
                tracking_no=payload.tracking_no,
                status=payload.status,
            )
            if updated is None:
                raise SampleDeliveryNotFoundError
        return await self._delivery_response(updated)

    async def get_fee_statistics(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str | None,
        date_from: date | None,
        date_to: date | None,
        express_company: str | None,
    ) -> SampleDeliveryFeeStatisticsResponse:
        self._require(current_user, "sample:delivery:fee:view")
        if date_from and date_to and date_from > date_to:
            raise ValueError("寄样费用统计日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        rows = await self._repository.get_fee_statistics(
            customer_id=customer_id,
            date_from=date_from,
            date_to=date_to,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        total = Decimal("0")
        for row in rows:
            total += Decimal(row.total_amount)
        currency = rows[0].currency if rows else "USD"
        if any(row.currency != currency for row in rows):
            currency = "MIXED"
        return SampleDeliveryFeeStatisticsResponse(
            items=[self._fee_statistic_response(row) for row in rows],
            total_amount=self._money(total),
            currency=currency,
        )

    async def get_sample_history(
        self,
        *,
        current_user: CurrentUserResponse,
        sample_record_id: str,
    ) -> SampleDeliveryListResponse:
        self._require(current_user, "sample:delivery:view")
        deliveries, total = await self._repository.list_sample_history(sample_record_id)
        return SampleDeliveryListResponse(
            items=[await self._delivery_response(delivery) for delivery in deliveries],
            total=total,
        )

    async def get_quote_history(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str | None,
        product_id: str | None,
    ) -> SampleDeliveryListResponse:
        self._require(current_user, "sample:delivery:view")
        deliveries, total = await self._repository.list_quote_history(
            customer_id=customer_id,
            product_id=product_id,
        )
        return SampleDeliveryListResponse(
            items=[await self._delivery_response(delivery) for delivery in deliveries],
            total=total,
        )

    async def get_statistics(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        express_company: str | None,
    ) -> SampleDeliveryStatisticsResponse:
        self._require(current_user, "sample:delivery:fee:view")
        if date_from and date_to and date_from > date_to:
            raise ValueError("寄样统计日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        by_status = await self._repository.get_status_statistics(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        by_customer = await self._repository.get_customer_statistics(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        by_express = await self._repository.get_express_statistics(
            date_from=date_from,
            date_to=date_to,
            customer_id=customer_id,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        total_deliveries = sum(row.delivery_count for row in by_status)
        total_quantity = sum((row.total_quantity for row in by_status), Decimal("0"))
        return SampleDeliveryStatisticsResponse(
            total_deliveries=total_deliveries,
            total_quantity=self._quantity(total_quantity),
            by_status=[
                SampleDeliveryStatusStatisticResponse(
                    status=row.status,
                    delivery_count=row.delivery_count,
                    total_quantity=self._quantity(row.total_quantity),
                )
                for row in by_status
            ],
            by_customer=[
                SampleDeliveryCustomerStatisticResponse(
                    customer_id=row.customer_id,
                    customer_name=row.customer_name,
                    delivery_count=row.delivery_count,
                    total_quantity=self._quantity(row.total_quantity),
                )
                for row in by_customer
            ],
            by_express=[
                SampleDeliveryExpressStatisticResponse(
                    express_company=row.express_company,
                    delivery_count=row.delivery_count,
                    total_quantity=self._quantity(row.total_quantity),
                )
                for row in by_express
            ],
        )

    async def export_deliveries(
        self,
        *,
        current_user: CurrentUserResponse,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        express_company: str | None,
    ) -> SampleDeliveryExportResponse:
        self._require(current_user, "sample:delivery:fee:view")
        if date_from and date_to and date_from > date_to:
            raise ValueError("寄样导出日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        deliveries, total = await self._repository.list_deliveries(
            q=None,
            status=None,
            customer_id=customer_id,
            express_company=express_company,
            date_from=date_from,
            date_to=date_to,
            owner_user_ids=owner_user_ids,
            limit=500,
            offset=0,
        )
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(
            localize_labels(
                [
                    "寄样单号",
                    "寄样日期",
                    "状态",
                    "客户",
                    "收件方",
                    "快递公司",
                    "快递单号",
                    "报价单",
                    "样品编号",
                    "产品",
                    "数量",
                    "单位",
                    "费用合计",
                    "备注",
                ]
            )
        )
        for delivery in deliveries:
            response = await self._delivery_response(delivery)
            first_line = response.lines[0] if response.lines else None
            writer.writerow(
                [
                    response.code,
                    response.delivery_date.isoformat(),
                    response.status,
                    response.customer_name,
                    response.recipient_company or response.recipient_name,
                    response.express_company,
                    response.tracking_no or "",
                    response.quote_no or "",
                    first_line.sample_code if first_line else "",
                    first_line.product_name if first_line else "",
                    first_line.quantity if first_line else "",
                    first_line.unit if first_line else "",
                    response.fee_total,
                    response.remark or "",
                ]
            )
        return SampleDeliveryExportResponse(
            filename=f"sample-deliveries-{current_user.id}.csv",
            content_type="text/csv",
            content=output.getvalue(),
            total=total,
        )

    async def _add_delivery_children(
        self,
        delivery_id: str,
        payload: SampleDeliveryCreate,
    ) -> None:
        for line in payload.lines:
            await self._repository.add_line(
                delivery_id=delivery_id,
                sample_record_id=line.sample_record_id,
                sample_code=line.sample_code,
                sample_type=line.sample_type,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                quantity=line.quantity,
                unit=line.unit,
                remark=line.remark,
            )
        for fee in payload.fees:
            await self._repository.add_fee(
                delivery_id=delivery_id,
                fee_type=fee.fee_type,
                amount=fee.amount,
                currency=fee.currency,
                payer_type=fee.payer_type,
                remark=fee.remark,
            )

    async def _ensure_stock_available(self, lines: list[SampleDeliveryLineRow]) -> None:
        required: dict[str, Decimal] = {}
        for line in lines:
            required[line.sample_record_id] = (
                required.get(line.sample_record_id, Decimal("0")) + line.quantity
            )
        for sample_record_id, quantity in required.items():
            summary = await self._sample_record_repository.get_stock_summary(sample_record_id)
            if summary is None or summary.retained_quantity < quantity:
                raise ValueError("样品留样数量不足")

    async def _ensure_no_downstream_effects(self, delivery: SampleDeliveryRow) -> None:
        if delivery.status == "shipped":
            raise ValueError("寄样单已发货或已产生发货记账，不能驳回或撤回")
        lines = await self._repository.list_lines(delivery.id)
        for sample_record_id in {line.sample_record_id for line in lines}:
            if await self._sample_record_repository.delivered_stock_event_exists(
                sample_record_id=sample_record_id,
                delivery_no=delivery.code,
            ):
                raise ValueError("寄样单已发货或已产生发货记账，不能驳回或撤回")

    async def _get_accessible_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
    ) -> SampleDeliveryRow:
        self._require(current_user, "sample:delivery:view")
        delivery = await self._repository.get_delivery(delivery_id)
        if delivery is None:
            raise SampleDeliveryNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and delivery.owner_user_id not in allowed_user_ids:
            raise SampleDeliveryNotFoundError
        return delivery

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, status: str) -> None:
        if status not in VALID_SAMPLE_DELIVERY_STATUSES:
            raise ValueError("寄样状态无效")

    async def _delivery_response(self, delivery: SampleDeliveryRow) -> SampleDeliveryResponse:
        return await build_delivery_response(delivery, self._repository)

    def _fee_statistic_response(
        self,
        row: SampleDeliveryFeeStatisticRow,
    ) -> SampleDeliveryFeeStatisticResponse:
        return SampleDeliveryFeeStatisticResponse(
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            express_company=row.express_company,
            currency=row.currency,
            total_amount=row.total_amount,
            delivery_count=row.delivery_count,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
