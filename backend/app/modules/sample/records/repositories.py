from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sample.records.models import (
    SampleFollowupEvent,
    SampleImage,
    SampleRecord,
    SampleStockEvent,
    SampleStockSummary,
)


@dataclass(frozen=True)
class SampleRecordRow:
    id: str
    code: str
    sample_type: str
    status: str
    product_id: str | None
    product_code: str | None
    product_name: str
    customer_id: str | None
    customer_name: str | None
    supplier_id: str | None
    supplier_name: str | None
    customer_sku: str | None
    supplier_sku: str | None
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    source_type: str | None
    source_id: str | None
    source_code: str | None
    source_note: str | None
    received_at: date
    submitted_at: date | None
    quantity: Decimal
    unit: str
    description: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class SampleImageRow:
    id: str
    sample_record_id: str
    file_id: str
    filename: str
    url: str
    caption: str | None
    is_primary: bool
    created_at: datetime


@dataclass(frozen=True)
class SampleStockEventRow:
    id: str
    sample_record_id: str
    event_type: str
    quantity: Decimal
    unit: str
    occurred_at: date
    delivery_no: str | None
    recipient: str | None
    note: str | None
    created_at: datetime


@dataclass(frozen=True)
class SampleStockSummaryRow:
    id: str
    sample_record_id: str
    received_quantity: Decimal
    delivered_quantity: Decimal
    retained_quantity: Decimal
    unit: str
    updated_at: datetime


@dataclass(frozen=True)
class SampleFollowupEventRow:
    id: str
    sample_record_id: str
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    node_code: str
    node_label: str
    actual_date: date
    event_type: str
    created_at: datetime


class SampleRecordRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_record(
        self,
        *,
        code: str,
        sample_type: str,
        status: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        customer_id: str | None,
        customer_name: str | None,
        supplier_id: str | None,
        supplier_name: str | None,
        customer_sku: str | None,
        supplier_sku: str | None,
        purchase_contract_id: str | None,
        purchase_contract_no: str | None,
        source_type: str | None,
        source_id: str | None,
        source_code: str | None,
        source_note: str | None,
        received_at: date,
        submitted_at: date | None,
        quantity: Decimal | str,
        unit: str,
        description: str | None,
        owner_user_id: str,
    ) -> SampleRecordRow:
        record = SampleRecord(
            code=code,
            sample_type=sample_type,
            status=status,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            customer_id=customer_id,
            customer_name=customer_name,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            customer_sku=customer_sku,
            supplier_sku=supplier_sku,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            source_type=source_type,
            source_id=source_id,
            source_code=source_code,
            source_note=source_note,
            received_at=received_at,
            submitted_at=submitted_at,
            quantity=Decimal(str(quantity)),
            unit=unit,
            description=description,
            owner_user_id=owner_user_id,
        )
        self.session.add(record)
        await self.session.flush()
        await self._ensure_summary(record.id, unit)
        return self._map_record(record)

    async def add_image(
        self,
        *,
        sample_record_id: str,
        file_id: str,
        filename: str,
        url: str,
        caption: str | None,
        is_primary: bool,
    ) -> SampleImageRow:
        image = SampleImage(
            sample_record_id=sample_record_id,
            file_id=file_id,
            filename=filename,
            url=url,
            caption=caption,
            is_primary=is_primary,
        )
        self.session.add(image)
        await self.session.flush()
        return self._map_image(image)

    async def add_stock_event(
        self,
        *,
        sample_record_id: str,
        event_type: str,
        quantity: Decimal | str,
        unit: str,
        occurred_at: date,
        delivery_no: str | None,
        recipient: str | None,
        note: str | None,
    ) -> SampleStockEventRow:
        event_quantity = Decimal(str(quantity))
        event = SampleStockEvent(
            sample_record_id=sample_record_id,
            event_type=event_type,
            quantity=event_quantity,
            unit=unit,
            occurred_at=occurred_at,
            delivery_no=delivery_no,
            recipient=recipient,
            note=note,
        )
        self.session.add(event)
        await self._apply_stock_event(
            sample_record_id=sample_record_id,
            event_type=event_type,
            quantity=event_quantity,
            unit=unit,
        )
        await self.session.flush()
        return self._map_stock_event(event)

    async def add_followup_event(
        self,
        *,
        sample_record_id: str,
        purchase_contract_id: str | None,
        purchase_contract_no: str | None,
        node_code: str,
        node_label: str,
        actual_date: date,
        event_type: str,
    ) -> SampleFollowupEventRow:
        event = SampleFollowupEvent(
            sample_record_id=sample_record_id,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            node_code=node_code,
            node_label=node_label,
            actual_date=actual_date,
            event_type=event_type,
        )
        self.session.add(event)
        await self.session.flush()
        return self._map_followup_event(event)

    async def get_record(self, record_id: str) -> SampleRecordRow | None:
        record = await self.session.scalar(select(SampleRecord).where(SampleRecord.id == record_id))
        if record is None:
            return None
        return self._map_record(record)

    async def get_record_by_source(
        self,
        *,
        source_type: str,
        source_id: str,
    ) -> SampleRecordRow | None:
        record = await self.session.scalar(
            select(SampleRecord)
            .where(SampleRecord.source_type == source_type)
            .where(SampleRecord.source_id == source_id)
        )
        if record is None:
            return None
        return self._map_record(record)

    async def list_records(
        self,
        *,
        q: str | None = None,
        sample_type: str | None = None,
        customer_id: str | None = None,
        purchase_contract_id: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SampleRecordRow], int]:
        statement = select(SampleRecord)
        count_statement = select(func.count()).select_from(SampleRecord)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    SampleRecord.code.ilike(pattern),
                    SampleRecord.product_code.ilike(pattern),
                    SampleRecord.product_name.ilike(pattern),
                    SampleRecord.customer_name.ilike(pattern),
                    SampleRecord.supplier_name.ilike(pattern),
                    SampleRecord.customer_sku.ilike(pattern),
                    SampleRecord.supplier_sku.ilike(pattern),
                    SampleRecord.purchase_contract_no.ilike(pattern),
                    SampleRecord.source_code.ilike(pattern),
                )
            )
        if sample_type:
            conditions.append(SampleRecord.sample_type == sample_type)
        if customer_id:
            conditions.append(SampleRecord.customer_id == customer_id)
        if purchase_contract_id:
            conditions.append(SampleRecord.purchase_contract_id == purchase_contract_id)
        if owner_user_ids is not None:
            conditions.append(SampleRecord.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(SampleRecord.received_at.desc(), SampleRecord.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_record(row) for row in rows], int(total or 0)

    async def list_images(self, record_id: str) -> list[SampleImageRow]:
        rows = await self.session.scalars(
            select(SampleImage)
            .where(SampleImage.sample_record_id == record_id)
            .order_by(SampleImage.is_primary.desc(), SampleImage.created_at.asc())
        )
        return [self._map_image(row) for row in rows]

    async def list_stock_events(self, record_id: str) -> list[SampleStockEventRow]:
        rows = await self.session.scalars(
            select(SampleStockEvent)
            .where(SampleStockEvent.sample_record_id == record_id)
            .order_by(SampleStockEvent.occurred_at.desc(), SampleStockEvent.created_at.desc())
        )
        return [self._map_stock_event(row) for row in rows]

    async def get_stock_summary(self, record_id: str) -> SampleStockSummaryRow | None:
        summary = await self.session.scalar(
            select(SampleStockSummary).where(SampleStockSummary.sample_record_id == record_id)
        )
        if summary is None:
            return None
        return self._map_stock_summary(summary)

    async def list_followup_events(self, record_id: str) -> list[SampleFollowupEventRow]:
        rows = await self.session.scalars(
            select(SampleFollowupEvent)
            .where(SampleFollowupEvent.sample_record_id == record_id)
            .order_by(SampleFollowupEvent.actual_date.desc(), SampleFollowupEvent.created_at.desc())
        )
        return [self._map_followup_event(row) for row in rows]

    async def list_followup_events_for_purchase_contract(
        self,
        purchase_contract_id: str,
    ) -> list[SampleFollowupEventRow]:
        rows = await self.session.scalars(
            select(SampleFollowupEvent)
            .where(SampleFollowupEvent.purchase_contract_id == purchase_contract_id)
            .order_by(SampleFollowupEvent.actual_date.asc(), SampleFollowupEvent.created_at.asc())
        )
        return [self._map_followup_event(row) for row in rows]

    async def _ensure_summary(self, sample_record_id: str, unit: str) -> SampleStockSummary:
        summary = await self.session.scalar(
            select(SampleStockSummary).where(
                SampleStockSummary.sample_record_id == sample_record_id
            )
        )
        if summary is not None:
            return summary
        summary = SampleStockSummary(
            sample_record_id=sample_record_id,
            received_quantity=Decimal("0"),
            delivered_quantity=Decimal("0"),
            retained_quantity=Decimal("0"),
            unit=unit,
        )
        self.session.add(summary)
        await self.session.flush()
        return summary

    async def _apply_stock_event(
        self,
        *,
        sample_record_id: str,
        event_type: str,
        quantity: Decimal,
        unit: str,
    ) -> None:
        summary = await self._ensure_summary(sample_record_id, unit)
        if event_type == "received":
            summary.received_quantity += quantity
            summary.retained_quantity += quantity
        elif event_type == "delivered":
            summary.delivered_quantity += quantity
            summary.retained_quantity -= quantity
        summary.unit = unit
        summary.updated_at = datetime.now(UTC)

    async def _scalars(self, statement: Select[tuple[SampleRecord]]) -> list[SampleRecord]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_record(self, record: SampleRecord) -> SampleRecordRow:
        return SampleRecordRow(
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
            quantity=record.quantity,
            unit=record.unit,
            description=record.description,
            owner_user_id=record.owner_user_id,
            created_at=record.created_at,
        )

    def _map_image(self, image: SampleImage) -> SampleImageRow:
        return SampleImageRow(
            id=image.id,
            sample_record_id=image.sample_record_id,
            file_id=image.file_id,
            filename=image.filename,
            url=image.url,
            caption=image.caption,
            is_primary=image.is_primary,
            created_at=image.created_at,
        )

    def _map_stock_event(self, event: SampleStockEvent) -> SampleStockEventRow:
        return SampleStockEventRow(
            id=event.id,
            sample_record_id=event.sample_record_id,
            event_type=event.event_type,
            quantity=event.quantity,
            unit=event.unit,
            occurred_at=event.occurred_at,
            delivery_no=event.delivery_no,
            recipient=event.recipient,
            note=event.note,
            created_at=event.created_at,
        )

    def _map_stock_summary(self, summary: SampleStockSummary) -> SampleStockSummaryRow:
        return SampleStockSummaryRow(
            id=summary.id,
            sample_record_id=summary.sample_record_id,
            received_quantity=summary.received_quantity,
            delivered_quantity=summary.delivered_quantity,
            retained_quantity=summary.retained_quantity,
            unit=summary.unit,
            updated_at=summary.updated_at,
        )

    def _map_followup_event(self, event: SampleFollowupEvent) -> SampleFollowupEventRow:
        return SampleFollowupEventRow(
            id=event.id,
            sample_record_id=event.sample_record_id,
            purchase_contract_id=event.purchase_contract_id,
            purchase_contract_no=event.purchase_contract_no,
            node_code=event.node_code,
            node_label=event.node_label,
            actual_date=event.actual_date,
            event_type=event.event_type,
            created_at=event.created_at,
        )
