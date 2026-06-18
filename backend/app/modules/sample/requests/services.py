from datetime import UTC, date, datetime
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.fee_payments.repositories import FeePaymentRepository
from app.modules.sample.records.repositories import SampleRecordRepository, SampleRecordRow
from app.modules.sample.records.schemas import (
    VALID_SAMPLE_RECORD_STATUSES,
    VALID_SAMPLE_RECORD_TYPES,
    SampleRecordResponse,
)
from app.modules.sample.records.services import SampleRecordService
from app.modules.sample.requests.repositories import (
    SampleFeeRow,
    SampleProgressRow,
    SampleRequestLineRow,
    SampleRequestRepository,
    SampleRequestRow,
)
from app.modules.sample.requests.schemas import (
    VALID_SAMPLE_DESTINATIONS,
    VALID_SAMPLE_STATUSES,
    SampleFeeCreate,
    SampleFeeResponse,
    SampleProgressCreate,
    SampleProgressResponse,
    SampleRequestCreate,
    SampleRequestLineResponse,
    SampleRequestListResponse,
    SampleRequestResponse,
    SampleRequestToRecordCreate,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class SampleRequestNotFoundError(Exception):
    pass


class SampleFeeNotFoundError(Exception):
    pass


class SampleRecordAlreadyCreatedError(Exception):
    pass


class SampleRequestService:
    def __init__(
        self,
        repository: SampleRequestRepository,
        *,
        sample_record_repository: SampleRecordRepository,
        fee_payment_repository: FeePaymentRepository,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._sample_record_repository = sample_record_repository
        self._fee_payment_repository = fee_payment_repository
        self._data_scope_resolver = data_scope_resolver

    async def create_request(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: SampleRequestCreate,
    ) -> SampleRequestResponse:
        self._require(current_user, "sample:request:edit")
        self._validate_status(payload.status)
        self._validate_destination(payload.destination)
        async with UnitOfWork(self._repository.session):
            sample_request = await self._repository.create_request(
                code=payload.code,
                request_date=payload.request_date,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                product_id=payload.product_id,
                product_code=payload.product_code,
                product_name=payload.product_name,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                sales_user_id=payload.sales_user_id,
                sales_user_name=payload.sales_user_name,
                destination=payload.destination,
                requirements=payload.requirements,
                due_date=payload.due_date,
                status=payload.status,
                owner_user_id=current_user.id,
            )
            for line in payload.lines:
                await self._repository.add_line(
                    sample_request_id=sample_request.id,
                    product_id=line.product_id,
                    product_code=line.product_code,
                    product_name=line.product_name,
                    specification=line.specification,
                    quantity=line.quantity,
                    unit=line.unit,
                    requirement=line.requirement,
                )
        return await self._request_response(sample_request)

    async def get_request(
        self,
        *,
        current_user: CurrentUserResponse,
        request_id: str,
    ) -> SampleRequestResponse:
        sample_request = await self._get_accessible_request(
            current_user=current_user,
            request_id=request_id,
        )
        return await self._request_response(sample_request)

    async def list_requests(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        customer_id: str | None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> SampleRequestListResponse:
        self._require(current_user, "sample:request:view")
        if status is not None:
            self._validate_status(status)
        if date_from and date_to and date_from > date_to:
            raise ValueError("打样日期范围无效")
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        requests, total = await self._repository.list_requests(
            q=q,
            status=status,
            customer_id=customer_id,
            date_from=date_from,
            date_to=date_to,
            owner_user_ids=owner_user_ids,
        )
        return SampleRequestListResponse(
            items=[await self._request_response(item) for item in requests],
            total=total,
        )

    async def add_progress(
        self,
        *,
        current_user: CurrentUserResponse,
        request_id: str,
        payload: SampleProgressCreate,
    ) -> SampleProgressResponse:
        self._require(current_user, "sample:request:edit")
        self._validate_status(payload.status)
        await self._get_accessible_request(current_user=current_user, request_id=request_id)
        async with UnitOfWork(self._repository.session):
            progress = await self._repository.add_progress(
                sample_request_id=request_id,
                stage=payload.stage,
                status=payload.status,
                occurred_at=payload.occurred_at,
                note=payload.note,
                handler_name=payload.handler_name,
            )
        return self._progress_response(progress)

    async def add_fee(
        self,
        *,
        current_user: CurrentUserResponse,
        request_id: str,
        payload: SampleFeeCreate,
    ) -> SampleFeeResponse:
        self._require(current_user, "sample:request:fee:edit")
        await self._get_accessible_request(current_user=current_user, request_id=request_id)
        async with UnitOfWork(self._repository.session):
            fee = await self._repository.add_fee(
                sample_request_id=request_id,
                fee_type=payload.fee_type,
                amount=payload.amount,
                currency=payload.currency,
                payee_type=payload.payee_type,
                payee_name=payload.payee_name,
                remark=payload.remark,
            )
        return self._fee_response(fee)

    async def request_fee_payment(
        self,
        *,
        current_user: CurrentUserResponse,
        request_id: str,
        fee_id: str,
    ) -> SampleFeeResponse:
        self._require(current_user, "sample:request:fee:edit")
        await self._get_accessible_request(current_user=current_user, request_id=request_id)
        fee = await self._repository.get_fee(fee_id)
        if fee is None or fee.sample_request_id != request_id:
            raise SampleFeeNotFoundError
        sample_request = await self._get_accessible_request(
            current_user=current_user,
            request_id=request_id,
        )
        invoice_no = self._fee_invoice_no()
        payment_request_no = self._payment_request_no()
        async with UnitOfWork(self._repository.session):
            invoice = await self._fee_payment_repository.create_partner_fee_invoice(
                invoice_no=invoice_no,
                invoice_date=date.today(),
                partner_id=None,
                partner_name=fee.payee_name,
                partner_type=fee.payee_type,
                shipment_plan_id=None,
                shipment_no=sample_request.code,
                sales_user_id=sample_request.sales_user_id,
                sales_user_name=sample_request.sales_user_name,
                fee_type=self._finance_fee_type(fee.fee_type),
                total_amount=fee.amount,
                currency=fee.currency,
                due_date=sample_request.due_date,
                remark=fee.remark or f"打样费用：{sample_request.code}",
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
            payment_request = await self._fee_payment_repository.create_fee_payment_request(
                request_no=payment_request_no,
                invoice=invoice,
                request_date=date.today(),
                requested_amount=fee.amount,
                currency=fee.currency,
                requester_user_id=current_user.id,
                requester_user_name=current_user.display_name,
                remark=fee.remark or f"打样费用付款申请：{sample_request.code}",
            )
            requested_fee = await self._repository.request_fee_payment(
                fee_id=fee_id,
                payment_request_no=payment_request_no,
                finance_invoice_no=invoice.invoice_no,
                finance_payment_request_id=payment_request.id,
            )
            if requested_fee is None:
                raise SampleFeeNotFoundError
        return self._fee_response(requested_fee)

    async def create_sample_record_from_request(
        self,
        *,
        current_user: CurrentUserResponse,
        request_id: str,
        payload: SampleRequestToRecordCreate,
    ) -> SampleRecordResponse:
        self._require(current_user, "sample:record:edit")
        self._validate_record_payload(payload)
        sample_request = await self._get_accessible_request(
            current_user=current_user,
            request_id=request_id,
        )
        if sample_request.status != "completed":
            raise ValueError("打样完成后才能转为样品登记")
        existing = await self._sample_record_repository.get_record_by_source(
            source_type="sample_request",
            source_id=sample_request.id,
        )
        if existing is not None:
            raise SampleRecordAlreadyCreatedError
        async with UnitOfWork(self._repository.session):
            record = await self._sample_record_repository.create_record(
                code=payload.code,
                sample_type=payload.sample_type,
                status=payload.status,
                product_id=sample_request.product_id,
                product_code=sample_request.product_code,
                product_name=sample_request.product_name or sample_request.code,
                customer_id=sample_request.customer_id,
                customer_name=sample_request.customer_name,
                supplier_id=sample_request.supplier_id,
                supplier_name=sample_request.supplier_name,
                customer_sku=payload.customer_sku,
                supplier_sku=payload.supplier_sku,
                purchase_contract_id=payload.purchase_contract_id,
                purchase_contract_no=payload.purchase_contract_no,
                source_type="sample_request",
                source_id=sample_request.id,
                source_code=sample_request.code,
                source_note=sample_request.requirements,
                received_at=payload.received_at,
                submitted_at=payload.submitted_at,
                quantity=payload.quantity,
                unit=payload.unit,
                description=payload.description,
                owner_user_id=current_user.id,
            )
            await self._sample_record_repository.add_stock_event(
                sample_record_id=record.id,
                event_type="received",
                quantity=payload.quantity,
                unit=payload.unit,
                occurred_at=payload.received_at,
                delivery_no=None,
                recipient=sample_request.supplier_name,
                note=f"打样单 {sample_request.code} 转样品登记",
            )
            for image in payload.images:
                await self._sample_record_repository.add_image(
                    sample_record_id=record.id,
                    file_id=image.file_id,
                    filename=image.filename,
                    url=image.url,
                    caption=image.caption,
                    is_primary=image.is_primary,
                )
            node = self._followup_node(payload.sample_type)
            if node is not None and payload.submitted_at is not None:
                node_code, node_label = node
                await self._sample_record_repository.add_followup_event(
                    sample_record_id=record.id,
                    purchase_contract_id=payload.purchase_contract_id,
                    purchase_contract_no=payload.purchase_contract_no,
                    node_code=node_code,
                    node_label=node_label,
                    actual_date=payload.submitted_at,
                    event_type="sample_completed",
                )
        return await self._record_response(record)

    async def _get_accessible_request(
        self,
        *,
        current_user: CurrentUserResponse,
        request_id: str,
    ) -> SampleRequestRow:
        self._require(current_user, "sample:request:view")
        sample_request = await self._repository.get_request(request_id)
        if sample_request is None:
            raise SampleRequestNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and sample_request.owner_user_id not in allowed_user_ids:
            raise SampleRequestNotFoundError
        return sample_request

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, status: str) -> None:
        if status not in VALID_SAMPLE_STATUSES:
            raise ValueError("打样状态无效")

    def _validate_destination(self, destination: str) -> None:
        if destination not in VALID_SAMPLE_DESTINATIONS:
            raise ValueError("打样去向无效")

    def _payment_request_no(self) -> str:
        return f"SAMPLE-FEE-{datetime.now(UTC).strftime('%Y%m%d%H%M%S%f')}"

    def _fee_invoice_no(self) -> str:
        return f"SAMPLE-FEE-INV-{datetime.now(UTC).strftime('%Y%m%d%H%M%S%f')}"

    def _finance_fee_type(self, fee_type: str) -> str:
        return "other" if fee_type == "sample_making" else fee_type

    def _validate_record_payload(self, payload: SampleRequestToRecordCreate) -> None:
        if payload.sample_type not in VALID_SAMPLE_RECORD_TYPES:
            raise ValueError("样品分类无效")
        if payload.status not in VALID_SAMPLE_RECORD_STATUSES:
            raise ValueError("样品状态无效")

    def _followup_node(self, sample_type: str) -> tuple[str, str] | None:
        nodes = {
            "confirm_sample": ("confirm_sample_submitted", "确认样提交"),
            "bulk_sample": ("bulk_sample_submitted", "大货样提交"),
        }
        return nodes.get(sample_type)

    async def _record_response(self, record: SampleRecordRow) -> SampleRecordResponse:
        record_service = SampleRecordService(
            self._sample_record_repository,
            data_scope_resolver=self._data_scope_resolver,
        )
        return await record_service.response_from_record(record)

    async def _request_response(self, sample_request: SampleRequestRow) -> SampleRequestResponse:
        lines = await self._repository.list_lines(sample_request.id)
        progress_events = await self._repository.list_progress(sample_request.id)
        fees = await self._repository.list_fees(sample_request.id)
        return SampleRequestResponse(
            id=sample_request.id,
            code=sample_request.code,
            request_date=sample_request.request_date,
            customer_id=sample_request.customer_id,
            customer_name=sample_request.customer_name,
            product_id=sample_request.product_id,
            product_code=sample_request.product_code,
            product_name=sample_request.product_name,
            supplier_id=sample_request.supplier_id,
            supplier_name=sample_request.supplier_name,
            sales_user_id=sample_request.sales_user_id,
            sales_user_name=sample_request.sales_user_name,
            destination=sample_request.destination,
            requirements=sample_request.requirements,
            due_date=sample_request.due_date,
            status=sample_request.status,
            owner_user_id=sample_request.owner_user_id,
            lines=[self._line_response(line) for line in lines],
            progress_events=[self._progress_response(item) for item in progress_events],
            fees=[self._fee_response(fee) for fee in fees],
        )

    def _line_response(self, line: SampleRequestLineRow) -> SampleRequestLineResponse:
        return SampleRequestLineResponse(
            id=line.id,
            sample_request_id=line.sample_request_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            requirement=line.requirement,
        )

    def _progress_response(self, progress: SampleProgressRow) -> SampleProgressResponse:
        return SampleProgressResponse(
            id=progress.id,
            sample_request_id=progress.sample_request_id,
            stage=progress.stage,
            status=progress.status,
            occurred_at=progress.occurred_at,
            note=progress.note,
            handler_name=progress.handler_name,
        )

    def _fee_response(self, fee: SampleFeeRow) -> SampleFeeResponse:
        return SampleFeeResponse(
            id=fee.id,
            sample_request_id=fee.sample_request_id,
            fee_type=fee.fee_type,
            amount=self._money(fee.amount),
            currency=fee.currency,
            payee_type=fee.payee_type,
            payee_name=fee.payee_name,
            remark=fee.remark,
            payment_status=fee.payment_status,
            payment_request_no=fee.payment_request_no,
            finance_invoice_no=fee.finance_invoice_no,
            finance_payment_request_id=fee.finance_payment_request_id,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
