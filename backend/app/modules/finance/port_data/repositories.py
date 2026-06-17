from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.port_data.models import (
    CustomsDeclarationRecord,
    PortImportBatch,
)


@dataclass(frozen=True)
class CustomsDeclarationRecordRow:
    id: str
    batch_id: str
    declaration_no: str
    customs_receipt_no: str | None
    trade_type: str
    export_contract_no: str | None
    customs_date: date | None
    product_name: str
    hs_code: str | None
    quantity: str | None
    unit: str | None
    amount: str
    currency: str
    customer_or_supplier: str | None
    created_at: datetime


@dataclass(frozen=True)
class PortImportBatchRow:
    id: str
    batch_no: str
    source: str
    imported_at: date
    record_count: int
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime
    records: list[CustomsDeclarationRecordRow] = field(default_factory=list)


@dataclass(frozen=True)
class CustomsRecordInput:
    declaration_no: str
    customs_receipt_no: str | None
    trade_type: str
    export_contract_no: str | None
    customs_date: date | None
    product_name: str
    hs_code: str | None
    quantity: Decimal | str | None
    unit: str | None
    amount: Decimal | str
    currency: str
    customer_or_supplier: str | None


class PortDataRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_batch(
        self,
        *,
        batch_no: str,
        source: str,
        imported_at: date,
        record_count: int,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
        records: Sequence[CustomsRecordInput],
    ) -> PortImportBatchRow:
        batch = PortImportBatch(
            batch_no=batch_no,
            source=source,
            imported_at=imported_at,
            record_count=record_count,
            status="imported",
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(batch)
        await self.session.flush()
        record_models = [
            CustomsDeclarationRecord(
                batch_id=batch.id,
                declaration_no=record.declaration_no,
                customs_receipt_no=record.customs_receipt_no,
                trade_type=record.trade_type,
                export_contract_no=record.export_contract_no,
                customs_date=record.customs_date,
                product_name=record.product_name,
                hs_code=record.hs_code,
                quantity=None if record.quantity is None else Decimal(str(record.quantity)),
                unit=record.unit,
                amount=Decimal(str(record.amount)),
                currency=record.currency,
                customer_or_supplier=record.customer_or_supplier,
            )
            for record in records
        ]
        self.session.add_all(record_models)
        await self.session.flush()
        return self._map_batch(batch, [self._map_record(row) for row in record_models])

    async def get_batch(self, batch_id: str) -> PortImportBatchRow | None:
        batch = await self.session.get(PortImportBatch, batch_id)
        if batch is None:
            return None
        records = await self._records_for_batch(batch.id)
        return self._map_batch(batch, records)

    async def list_batches(
        self,
        *,
        source: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PortImportBatchRow], int]:
        statement = select(PortImportBatch)
        count_statement = select(func.count()).select_from(PortImportBatch)
        conditions: list[object] = []
        if source:
            conditions.append(PortImportBatch.source == source)
        if status:
            conditions.append(PortImportBatch.status == status)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                PortImportBatch.imported_at.desc(),
                PortImportBatch.batch_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._batch_scalars(statement)
        batches = [
            self._map_batch(row, await self._records_for_batch(row.id)) for row in rows
        ]
        total = await self.session.scalar(count_statement)
        return batches, int(total or 0)

    async def list_records(
        self,
        *,
        declaration_no: str | None = None,
        customs_receipt_no: str | None = None,
        trade_type: str | None = None,
        batch_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[CustomsDeclarationRecordRow], int]:
        statement = select(CustomsDeclarationRecord)
        count_statement = select(func.count()).select_from(CustomsDeclarationRecord)
        conditions: list[object] = []
        if declaration_no:
            conditions.append(CustomsDeclarationRecord.declaration_no == declaration_no)
        if customs_receipt_no:
            conditions.append(CustomsDeclarationRecord.customs_receipt_no == customs_receipt_no)
        if trade_type:
            conditions.append(CustomsDeclarationRecord.trade_type == trade_type)
        if batch_id:
            conditions.append(CustomsDeclarationRecord.batch_id == batch_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                CustomsDeclarationRecord.customs_date.desc(),
                CustomsDeclarationRecord.declaration_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._record_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_record(row) for row in rows], int(total or 0)

    async def _records_for_batch(self, batch_id: str) -> list[CustomsDeclarationRecordRow]:
        statement = (
            select(CustomsDeclarationRecord)
            .where(CustomsDeclarationRecord.batch_id == batch_id)
            .order_by(CustomsDeclarationRecord.declaration_no.asc())
        )
        rows = await self._record_scalars(statement)
        return [self._map_record(row) for row in rows]

    async def _batch_scalars(
        self,
        statement: Select[tuple[PortImportBatch]],
    ) -> list[PortImportBatch]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _record_scalars(
        self,
        statement: Select[tuple[CustomsDeclarationRecord]],
    ) -> list[CustomsDeclarationRecord]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_batch(
        self,
        batch: PortImportBatch,
        records: list[CustomsDeclarationRecordRow],
    ) -> PortImportBatchRow:
        return PortImportBatchRow(
            id=batch.id,
            batch_no=batch.batch_no,
            source=batch.source,
            imported_at=batch.imported_at,
            record_count=batch.record_count,
            status=batch.status,
            remark=batch.remark,
            created_by_user_id=batch.created_by_user_id,
            created_by_user_name=batch.created_by_user_name,
            created_at=batch.created_at,
            records=records,
        )

    def _map_record(self, record: CustomsDeclarationRecord) -> CustomsDeclarationRecordRow:
        return CustomsDeclarationRecordRow(
            id=record.id,
            batch_id=record.batch_id,
            declaration_no=record.declaration_no,
            customs_receipt_no=record.customs_receipt_no,
            trade_type=record.trade_type,
            export_contract_no=record.export_contract_no,
            customs_date=record.customs_date,
            product_name=record.product_name,
            hs_code=record.hs_code,
            quantity=None if record.quantity is None else self._decimal4(record.quantity),
            unit=record.unit,
            amount=self._decimal(record.amount),
            currency=record.currency,
            customer_or_supplier=record.customer_or_supplier,
            created_at=record.created_at,
        )

    def _decimal(self, value: Decimal) -> str:
        return f"{Decimal(str(value)):.2f}"

    def _decimal4(self, value: Decimal) -> str:
        return f"{Decimal(str(value)):.4f}"
