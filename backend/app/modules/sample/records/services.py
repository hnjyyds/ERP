from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.sample.records.repositories import (
    SampleFollowupEventRow,
    SampleImageRow,
    SampleRecordRepository,
    SampleRecordRow,
    SampleStockEventRow,
    SampleStockSummaryRow,
)
from app.modules.sample.records.schemas import (
    VALID_SAMPLE_RECORD_STATUSES,
    VALID_SAMPLE_RECORD_TYPES,
    VALID_SAMPLE_STOCK_EVENT_TYPES,
    SampleFollowupEventResponse,
    SampleImageCreate,
    SampleImageResponse,
    SampleRecordCreate,
    SampleRecordListResponse,
    SampleRecordResponse,
    SampleStockEventCreate,
    SampleStockEventResponse,
    SampleStockSummaryResponse,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse

SAMPLE_RECORD_VIEW_ALL_PERMISSION = "sample:record:view_all"


class PermissionDeniedError(Exception):
    pass


class SampleRecordNotFoundError(Exception):
    pass


class SampleStockError(Exception):
    pass


class SampleRecordService:
    def __init__(
        self,
        repository: SampleRecordRepository,
        *,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._data_scope_resolver = data_scope_resolver

    async def create_record(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: SampleRecordCreate,
    ) -> SampleRecordResponse:
        self._require(current_user, "sample:record:edit")
        self._validate_sample_type(payload.sample_type)
        self._validate_status(payload.status)
        async with UnitOfWork(self._repository.session):
            record = await self._repository.create_record(
                code=payload.code,
                sample_type=payload.sample_type,
                status=payload.status,
                product_id=payload.product_id,
                product_code=payload.product_code,
                product_name=payload.product_name,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                customer_sku=payload.customer_sku,
                supplier_sku=payload.supplier_sku,
                purchase_contract_id=payload.purchase_contract_id,
                purchase_contract_no=payload.purchase_contract_no,
                source_type=payload.source_type,
                source_id=payload.source_id,
                source_code=payload.source_code,
                source_note=payload.source_note,
                received_at=payload.received_at,
                submitted_at=payload.submitted_at,
                quantity=payload.quantity,
                unit=payload.unit,
                description=payload.description,
                owner_user_id=current_user.id,
            )
            await self._repository.add_stock_event(
                sample_record_id=record.id,
                event_type="received",
                quantity=payload.quantity,
                unit=payload.unit,
                occurred_at=payload.received_at,
                delivery_no=None,
                recipient=payload.supplier_name,
                note="样品登记收样",
            )
            for image in payload.images:
                await self._add_image_without_transaction(record.id, image)
            await self._publish_followup_event(record)
        return await self._record_response(record)

    async def get_record(
        self,
        *,
        current_user: CurrentUserResponse,
        record_id: str,
    ) -> SampleRecordResponse:
        record = await self._get_accessible_record(current_user=current_user, record_id=record_id)
        return await self._record_response(record)

    async def list_records(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        sample_type: str | None,
        customer_id: str | None,
        purchase_contract_id: str | None,
    ) -> SampleRecordListResponse:
        self._require(current_user, "sample:record:view")
        if sample_type is not None:
            self._validate_sample_type(sample_type)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=SAMPLE_RECORD_VIEW_ALL_PERMISSION,
        )
        records, total = await self._repository.list_records(
            q=q,
            sample_type=sample_type,
            customer_id=customer_id,
            purchase_contract_id=purchase_contract_id,
            owner_user_ids=owner_user_ids,
        )
        return SampleRecordListResponse(
            items=[await self._record_response(record) for record in records],
            total=total,
        )

    async def add_image(
        self,
        *,
        current_user: CurrentUserResponse,
        record_id: str,
        payload: SampleImageCreate,
    ) -> SampleImageResponse:
        self._require(current_user, "sample:record:edit")
        await self._get_accessible_record(current_user=current_user, record_id=record_id)
        async with UnitOfWork(self._repository.session):
            image = await self._add_image_without_transaction(record_id, payload)
        return self._image_response(image)

    async def add_stock_event(
        self,
        *,
        current_user: CurrentUserResponse,
        record_id: str,
        payload: SampleStockEventCreate,
    ) -> SampleStockEventResponse:
        self._require(current_user, "sample:record:edit")
        self._validate_stock_event(payload.event_type)
        await self._get_accessible_record(current_user=current_user, record_id=record_id)
        if payload.event_type == "delivered":
            await self._ensure_can_deliver(record_id, payload.quantity)
        async with UnitOfWork(self._repository.session):
            event = await self._repository.add_stock_event(
                sample_record_id=record_id,
                event_type=payload.event_type,
                quantity=payload.quantity,
                unit=payload.unit,
                occurred_at=payload.occurred_at,
                delivery_no=payload.delivery_no,
                recipient=payload.recipient,
                note=payload.note,
            )
        return self._stock_event_response(event)

    async def _add_image_without_transaction(
        self,
        record_id: str,
        payload: SampleImageCreate,
    ) -> SampleImageRow:
        return await self._repository.add_image(
            sample_record_id=record_id,
            file_id=payload.file_id,
            filename=payload.filename,
            url=payload.url,
            caption=payload.caption,
            is_primary=payload.is_primary,
        )

    async def _publish_followup_event(self, record: SampleRecordRow) -> None:
        node = self._followup_node(record.sample_type)
        if node is None or record.submitted_at is None:
            return
        node_code, node_label = node
        await self._repository.add_followup_event(
            sample_record_id=record.id,
            purchase_contract_id=record.purchase_contract_id,
            purchase_contract_no=record.purchase_contract_no,
            node_code=node_code,
            node_label=node_label,
            actual_date=record.submitted_at,
            event_type="sample_completed",
        )

    async def _ensure_can_deliver(self, record_id: str, quantity: Decimal) -> None:
        summary = await self._repository.get_stock_summary(record_id)
        if summary is None or summary.retained_quantity < quantity:
            raise SampleStockError("样品留样数量不足")

    async def _get_accessible_record(
        self,
        *,
        current_user: CurrentUserResponse,
        record_id: str,
    ) -> SampleRecordRow:
        self._require(current_user, "sample:record:view")
        record = await self._repository.get_record(record_id)
        if record is None:
            raise SampleRecordNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
            view_all_permission=SAMPLE_RECORD_VIEW_ALL_PERMISSION,
        )
        if allowed_user_ids is not None and record.owner_user_id not in allowed_user_ids:
            raise SampleRecordNotFoundError
        return record

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_sample_type(self, sample_type: str) -> None:
        if sample_type not in VALID_SAMPLE_RECORD_TYPES:
            raise ValueError("样品分类无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_SAMPLE_RECORD_STATUSES:
            raise ValueError("样品状态无效")

    def _validate_stock_event(self, event_type: str) -> None:
        if event_type not in VALID_SAMPLE_STOCK_EVENT_TYPES:
            raise ValueError("样品数量事件无效")

    def _followup_node(self, sample_type: str) -> tuple[str, str] | None:
        nodes = {
            "confirm_sample": ("confirm_sample_submitted", "确认样提交"),
            "bulk_sample": ("bulk_sample_submitted", "大货样提交"),
        }
        return nodes.get(sample_type)

    async def _record_response(self, record: SampleRecordRow) -> SampleRecordResponse:
        images = await self._repository.list_images(record.id)
        stock_summary = await self._repository.get_stock_summary(record.id)
        stock_events = await self._repository.list_stock_events(record.id)
        followup_events = await self._repository.list_followup_events(record.id)
        return SampleRecordResponse(
            id=record.id,
            code=record.code,
            sample_type=record.sample_type,
            status=record.status,
            product_id=record.product_id,
            product_code=record.product_code,
            product_name=record.product_name,
            customer_id=record.customer_id,
            customer_name=record.customer_name,
            supplier_id=record.supplier_id,
            supplier_name=record.supplier_name,
            customer_sku=record.customer_sku,
            supplier_sku=record.supplier_sku,
            purchase_contract_id=record.purchase_contract_id,
            purchase_contract_no=record.purchase_contract_no,
            source_type=record.source_type,
            source_id=record.source_id,
            source_code=record.source_code,
            source_note=record.source_note,
            received_at=record.received_at,
            submitted_at=record.submitted_at,
            quantity=self._quantity(record.quantity),
            unit=record.unit,
            description=record.description,
            owner_user_id=record.owner_user_id,
            images=[self._image_response(image) for image in images],
            stock_summary=self._stock_summary_response(record, stock_summary),
            stock_events=[self._stock_event_response(event) for event in stock_events],
            followup_events=[self._followup_event_response(event) for event in followup_events],
        )

    def _image_response(self, image: SampleImageRow) -> SampleImageResponse:
        return SampleImageResponse(
            id=image.id,
            sample_record_id=image.sample_record_id,
            file_id=image.file_id,
            filename=image.filename,
            url=image.url,
            caption=image.caption,
            is_primary=image.is_primary,
        )

    def _stock_summary_response(
        self,
        record: SampleRecordRow,
        summary: SampleStockSummaryRow | None,
    ) -> SampleStockSummaryResponse:
        return SampleStockSummaryResponse(
            sample_record_id=record.id,
            received_quantity=self._quantity(summary.received_quantity if summary else 0),
            delivered_quantity=self._quantity(summary.delivered_quantity if summary else 0),
            retained_quantity=self._quantity(summary.retained_quantity if summary else 0),
            unit=summary.unit if summary else record.unit,
        )

    def _stock_event_response(self, event: SampleStockEventRow) -> SampleStockEventResponse:
        return SampleStockEventResponse(
            id=event.id,
            sample_record_id=event.sample_record_id,
            event_type=event.event_type,
            quantity=self._quantity(event.quantity),
            unit=event.unit,
            occurred_at=event.occurred_at,
            delivery_no=event.delivery_no,
            recipient=event.recipient,
            note=event.note,
        )

    def _followup_event_response(
        self,
        event: SampleFollowupEventRow,
    ) -> SampleFollowupEventResponse:
        return SampleFollowupEventResponse(
            id=event.id,
            sample_record_id=event.sample_record_id,
            purchase_contract_id=event.purchase_contract_id,
            purchase_contract_no=event.purchase_contract_no,
            node_code=event.node_code,
            node_label=event.node_label,
            actual_date=event.actual_date,
            event_type=event.event_type,
        )

    def _quantity(self, value: Decimal | int) -> str:
        return f"{Decimal(str(value)):.4f}".rstrip("0").rstrip(".")
