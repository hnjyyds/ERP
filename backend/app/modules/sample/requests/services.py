from datetime import UTC, datetime
from decimal import Decimal

from app.db.uow import UnitOfWork
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
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class SampleRequestNotFoundError(Exception):
    pass


class SampleFeeNotFoundError(Exception):
    pass


class SampleRequestService:
    def __init__(self, repository: SampleRequestRepository) -> None:
        self._repository = repository

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
    ) -> SampleRequestListResponse:
        self._require(current_user, "sample:request:view")
        if status is not None:
            self._validate_status(status)
        requests, total = await self._repository.list_requests(
            q=q,
            status=status,
            customer_id=customer_id,
            owner_user_id=self._owner_filter(current_user),
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
        payment_request_no = self._payment_request_no()
        async with UnitOfWork(self._repository.session):
            requested_fee = await self._repository.request_fee_payment(
                fee_id=fee_id,
                payment_request_no=payment_request_no,
            )
            if requested_fee is None:
                raise SampleFeeNotFoundError
        return self._fee_response(requested_fee)

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
        if (
            "sample:request:view_all" not in current_user.permissions
            and sample_request.owner_user_id != current_user.id
        ):
            raise SampleRequestNotFoundError
        return sample_request

    def _owner_filter(self, current_user: CurrentUserResponse) -> str | None:
        if "sample:request:view_all" in current_user.permissions:
            return None
        return current_user.id

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
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
