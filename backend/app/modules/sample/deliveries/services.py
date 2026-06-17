from datetime import date
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.sample.deliveries.repositories import (
    SampleDeliveryFeeRow,
    SampleDeliveryFeeStatisticRow,
    SampleDeliveryLineRow,
    SampleDeliveryRepository,
    SampleDeliveryRow,
)
from app.modules.sample.deliveries.schemas import (
    VALID_SAMPLE_DELIVERY_STATUSES,
    SampleDeliveryApprove,
    SampleDeliveryCreate,
    SampleDeliveryFeeResponse,
    SampleDeliveryFeeStatisticResponse,
    SampleDeliveryFeeStatisticsResponse,
    SampleDeliveryLineResponse,
    SampleDeliveryListResponse,
    SampleDeliveryResponse,
    SampleDeliveryTrackingUpdate,
)
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse

SAMPLE_DELIVERY_VIEW_ALL_PERMISSION = "sample:delivery:view_all"


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
    ) -> None:
        self._repository = repository
        self._sample_record_repository = sample_record_repository
        self._data_scope_resolver = data_scope_resolver

    async def create_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: SampleDeliveryCreate,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")
        async with UnitOfWork(self._repository.session):
            delivery = await self._repository.create_delivery(
                code=payload.code,
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
        if delivery.status != "draft":
            raise ValueError("只有草稿寄样单可以编辑")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_delivery(
                delivery_id=delivery.id,
                code=payload.code,
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
    ) -> SampleDeliveryListResponse:
        self._require(current_user, "sample:delivery:view")
        if status is not None:
            self._validate_status(status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=SAMPLE_DELIVERY_VIEW_ALL_PERMISSION,
        )
        deliveries, total = await self._repository.list_deliveries(
            q=q,
            status=status,
            customer_id=customer_id,
            express_company=express_company,
            owner_user_ids=owner_user_ids,
        )
        return SampleDeliveryListResponse(
            items=[await self._delivery_response(delivery) for delivery in deliveries],
            total=total,
        )

    async def submit_delivery(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")
        delivery = await self._get_accessible_delivery(
            current_user=current_user,
            delivery_id=delivery_id,
        )
        if delivery.status != "draft":
            raise ValueError("只有草稿寄样单可以提交")
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_delivery(delivery_id)
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
        lines = await self._repository.list_lines(delivery_id)
        await self._ensure_stock_available(lines)
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_delivery(
                delivery_id=delivery_id,
                reviewer_name=payload.reviewer_name,
                approved_at=payload.approved_at,
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
                    note="寄样审核通过",
                )
        return await self._delivery_response(approved)

    async def update_tracking(
        self,
        *,
        current_user: CurrentUserResponse,
        delivery_id: str,
        payload: SampleDeliveryTrackingUpdate,
    ) -> SampleDeliveryResponse:
        self._require(current_user, "sample:delivery:edit")
        self._validate_status(payload.status)
        await self._get_accessible_delivery(current_user=current_user, delivery_id=delivery_id)
        async with UnitOfWork(self._repository.session):
            delivery = await self._repository.update_tracking(
                delivery_id=delivery_id,
                express_company=payload.express_company,
                tracking_no=payload.tracking_no,
                status=payload.status,
            )
            if delivery is None:
                raise SampleDeliveryNotFoundError
        return await self._delivery_response(delivery)

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
        rows = await self._repository.get_fee_statistics(
            customer_id=customer_id,
            date_from=date_from,
            date_to=date_to,
            express_company=express_company,
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
            view_all_permission=SAMPLE_DELIVERY_VIEW_ALL_PERMISSION,
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
        lines = await self._repository.list_lines(delivery.id)
        fees = await self._repository.list_fees(delivery.id)
        fee_total = Decimal("0")
        for fee in fees:
            fee_total += fee.amount
        return SampleDeliveryResponse(
            id=delivery.id,
            code=delivery.code,
            delivery_date=delivery.delivery_date,
            customer_id=delivery.customer_id,
            customer_name=delivery.customer_name,
            supplier_id=delivery.supplier_id,
            supplier_name=delivery.supplier_name,
            factory_id=delivery.factory_id,
            factory_name=delivery.factory_name,
            recipient_name=delivery.recipient_name,
            recipient_company=delivery.recipient_company,
            recipient_address=delivery.recipient_address,
            express_company=delivery.express_company,
            tracking_no=delivery.tracking_no,
            quote_id=delivery.quote_id,
            quote_no=delivery.quote_no,
            remark=delivery.remark,
            status=delivery.status,
            submitted_at=delivery.submitted_at,
            approved_at=delivery.approved_at,
            reviewer_name=delivery.reviewer_name,
            owner_user_id=delivery.owner_user_id,
            lines=[self._line_response(line) for line in lines],
            fees=[self._fee_response(fee) for fee in fees],
            fee_total=self._money(fee_total),
        )

    def _line_response(self, line: SampleDeliveryLineRow) -> SampleDeliveryLineResponse:
        return SampleDeliveryLineResponse(
            id=line.id,
            delivery_id=line.delivery_id,
            sample_record_id=line.sample_record_id,
            sample_code=line.sample_code,
            sample_type=line.sample_type,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            remark=line.remark,
        )

    def _fee_response(self, fee: SampleDeliveryFeeRow) -> SampleDeliveryFeeResponse:
        return SampleDeliveryFeeResponse(
            id=fee.id,
            delivery_id=fee.delivery_id,
            fee_type=fee.fee_type,
            amount=self._money(fee.amount),
            currency=fee.currency,
            payer_type=fee.payer_type,
            remark=fee.remark,
        )

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
