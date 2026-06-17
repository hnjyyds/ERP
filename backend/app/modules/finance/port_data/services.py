from app.db.uow import UnitOfWork
from app.modules.finance.port_data.repositories import (
    CustomsDeclarationRecordRow,
    CustomsRecordInput,
    PortDataRepository,
    PortImportBatchRow,
)
from app.modules.finance.port_data.schemas import (
    VALID_PORT_IMPORT_STATUSES,
    VALID_TRADE_TYPES,
    CustomsDeclarationRecordListResponse,
    CustomsDeclarationRecordResponse,
    PortImportBatchCreate,
    PortImportBatchListResponse,
    PortImportBatchResponse,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class PortDataNotFoundError(Exception):
    pass


class PortDataService:
    def __init__(self, repository: PortDataRepository) -> None:
        self._repository = repository

    async def import_port_data(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PortImportBatchCreate,
    ) -> PortImportBatchResponse:
        self._require_finance(current_user)
        if payload.record_count != len(payload.records):
            raise ValueError("导入批次记录数和明细数量不一致")
        for record in payload.records:
            self._validate_trade_type(record.trade_type)
        async with UnitOfWork(self._repository.session):
            batch = await self._repository.create_batch(
                batch_no=payload.batch_no,
                source=payload.source,
                imported_at=payload.imported_at,
                record_count=payload.record_count,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
                records=[
                    CustomsRecordInput(
                        declaration_no=record.declaration_no,
                        customs_receipt_no=record.customs_receipt_no,
                        trade_type=record.trade_type,
                        export_contract_no=record.export_contract_no,
                        customs_date=record.customs_date,
                        product_name=record.product_name,
                        hs_code=record.hs_code,
                        quantity=record.quantity,
                        unit=record.unit,
                        amount=record.amount,
                        currency=record.currency,
                        customer_or_supplier=record.customer_or_supplier,
                    )
                    for record in payload.records
                ],
            )
        return self._batch_response(batch)

    async def list_batches(
        self,
        *,
        current_user: CurrentUserResponse,
        source: str | None,
        status: str | None,
    ) -> PortImportBatchListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_status(status)
        batches, total = await self._repository.list_batches(source=source, status=status)
        return PortImportBatchListResponse(
            items=[self._batch_response(batch) for batch in batches],
            total=total,
        )

    async def list_customs_records(
        self,
        *,
        current_user: CurrentUserResponse,
        declaration_no: str | None,
        customs_receipt_no: str | None,
        trade_type: str | None,
        batch_id: str | None,
    ) -> CustomsDeclarationRecordListResponse:
        self._require_finance(current_user)
        if trade_type is not None:
            self._validate_trade_type(trade_type)
        rows, total = await self._repository.list_records(
            declaration_no=declaration_no,
            customs_receipt_no=customs_receipt_no,
            trade_type=trade_type,
            batch_id=batch_id,
        )
        return CustomsDeclarationRecordListResponse(
            items=[self._record_response(row) for row in rows],
            total=total,
        )

    async def get_batch(
        self,
        *,
        current_user: CurrentUserResponse,
        batch_id: str,
    ) -> PortImportBatchResponse:
        self._require_finance(current_user)
        batch = await self._repository.get_batch(batch_id)
        if batch is None:
            raise PortDataNotFoundError
        return self._batch_response(batch)

    def _validate_trade_type(self, trade_type: str) -> None:
        if trade_type not in VALID_TRADE_TYPES:
            raise ValueError("进出口报关数据贸易类型无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_PORT_IMPORT_STATUSES:
            raise ValueError("口岸数据导入状态无效")

    def _batch_response(self, batch: PortImportBatchRow) -> PortImportBatchResponse:
        return PortImportBatchResponse(
            id=batch.id,
            batch_no=batch.batch_no,
            source=batch.source,
            imported_at=batch.imported_at,
            record_count=batch.record_count,
            status=batch.status,
            remark=batch.remark,
            created_by_user_id=batch.created_by_user_id,
            created_by_user_name=batch.created_by_user_name,
            records=[self._record_response(row) for row in batch.records],
        )

    def _record_response(
        self,
        row: CustomsDeclarationRecordRow,
    ) -> CustomsDeclarationRecordResponse:
        return CustomsDeclarationRecordResponse(
            id=row.id,
            batch_id=row.batch_id,
            declaration_no=row.declaration_no,
            customs_receipt_no=row.customs_receipt_no,
            trade_type=row.trade_type,
            export_contract_no=row.export_contract_no,
            customs_date=row.customs_date,
            product_name=row.product_name,
            hs_code=row.hs_code,
            quantity=row.quantity,
            unit=row.unit,
            amount=row.amount,
            currency=row.currency,
            customer_or_supplier=row.customer_or_supplier,
        )

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError
