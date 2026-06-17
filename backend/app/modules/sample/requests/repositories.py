from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sample.requests.models import (
    SampleFee,
    SampleRequest,
    SampleRequestLine,
    SampleRequestProgress,
)


@dataclass(frozen=True)
class SampleRequestRow:
    id: str
    code: str
    request_date: date
    customer_id: str | None
    customer_name: str
    product_id: str | None
    product_code: str | None
    product_name: str | None
    supplier_id: str | None
    supplier_name: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    destination: str
    requirements: str
    due_date: date | None
    status: str
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class SampleRequestLineRow:
    id: str
    sample_request_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    quantity: Decimal
    unit: str
    requirement: str | None
    created_at: datetime


@dataclass(frozen=True)
class SampleProgressRow:
    id: str
    sample_request_id: str
    stage: str
    status: str
    occurred_at: date
    note: str | None
    handler_name: str | None
    created_at: datetime


@dataclass(frozen=True)
class SampleFeeRow:
    id: str
    sample_request_id: str
    fee_type: str
    amount: Decimal
    currency: str
    payee_type: str
    payee_name: str
    remark: str | None
    payment_status: str
    payment_request_no: str | None
    created_at: datetime


class SampleRequestRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_request(
        self,
        *,
        code: str,
        request_date: date,
        customer_id: str | None,
        customer_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str | None,
        supplier_id: str | None,
        supplier_name: str | None,
        sales_user_id: str | None,
        sales_user_name: str | None,
        destination: str,
        requirements: str,
        due_date: date | None,
        status: str,
        owner_user_id: str,
    ) -> SampleRequestRow:
        sample_request = SampleRequest(
            code=code,
            request_date=request_date,
            customer_id=customer_id,
            customer_name=customer_name,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            sales_user_id=sales_user_id,
            sales_user_name=sales_user_name,
            destination=destination,
            requirements=requirements,
            due_date=due_date,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(sample_request)
        await self.session.flush()
        return self._map_request(sample_request)

    async def add_line(
        self,
        *,
        sample_request_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        quantity: Decimal | str,
        unit: str,
        requirement: str | None,
    ) -> SampleRequestLineRow:
        line = SampleRequestLine(
            sample_request_id=sample_request_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            quantity=Decimal(str(quantity)),
            unit=unit,
            requirement=requirement,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def add_progress(
        self,
        *,
        sample_request_id: str,
        stage: str,
        status: str,
        occurred_at: date,
        note: str | None,
        handler_name: str | None,
    ) -> SampleProgressRow:
        progress = SampleRequestProgress(
            sample_request_id=sample_request_id,
            stage=stage,
            status=status,
            occurred_at=occurred_at,
            note=note,
            handler_name=handler_name,
        )
        self.session.add(progress)
        await self.update_request_status(sample_request_id=sample_request_id, status=status)
        await self.session.flush()
        return self._map_progress(progress)

    async def add_fee(
        self,
        *,
        sample_request_id: str,
        fee_type: str,
        amount: Decimal | str,
        currency: str,
        payee_type: str,
        payee_name: str,
        remark: str | None,
    ) -> SampleFeeRow:
        fee = SampleFee(
            sample_request_id=sample_request_id,
            fee_type=fee_type,
            amount=Decimal(str(amount)),
            currency=currency,
            payee_type=payee_type,
            payee_name=payee_name,
            remark=remark,
            payment_status="not_requested",
            payment_request_no=None,
        )
        self.session.add(fee)
        await self.session.flush()
        return self._map_fee(fee)

    async def request_fee_payment(
        self,
        *,
        fee_id: str,
        payment_request_no: str,
    ) -> SampleFeeRow | None:
        fee = await self.session.scalar(select(SampleFee).where(SampleFee.id == fee_id))
        if fee is None:
            return None
        fee.payment_status = "requested"
        fee.payment_request_no = payment_request_no
        await self.session.flush()
        return self._map_fee(fee)

    async def update_request_status(self, *, sample_request_id: str, status: str) -> None:
        sample_request = await self.session.scalar(
            select(SampleRequest).where(SampleRequest.id == sample_request_id)
        )
        if sample_request is not None:
            sample_request.status = status

    async def get_request(self, request_id: str) -> SampleRequestRow | None:
        sample_request = await self.session.scalar(
            select(SampleRequest).where(SampleRequest.id == request_id)
        )
        if sample_request is None:
            return None
        return self._map_request(sample_request)

    async def list_lines(self, request_id: str) -> list[SampleRequestLineRow]:
        rows = await self.session.scalars(
            select(SampleRequestLine)
            .where(SampleRequestLine.sample_request_id == request_id)
            .order_by(SampleRequestLine.created_at.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_progress(self, request_id: str) -> list[SampleProgressRow]:
        rows = await self.session.scalars(
            select(SampleRequestProgress)
            .where(SampleRequestProgress.sample_request_id == request_id)
            .order_by(
                SampleRequestProgress.occurred_at.desc(),
                SampleRequestProgress.created_at.desc(),
            )
        )
        return [self._map_progress(row) for row in rows]

    async def list_fees(self, request_id: str) -> list[SampleFeeRow]:
        rows = await self.session.scalars(
            select(SampleFee)
            .where(SampleFee.sample_request_id == request_id)
            .order_by(SampleFee.created_at.desc())
        )
        return [self._map_fee(row) for row in rows]

    async def get_fee(self, fee_id: str) -> SampleFeeRow | None:
        fee = await self.session.scalar(select(SampleFee).where(SampleFee.id == fee_id))
        if fee is None:
            return None
        return self._map_fee(fee)

    async def list_requests(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        customer_id: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SampleRequestRow], int]:
        statement = select(SampleRequest)
        count_statement = select(func.count()).select_from(SampleRequest)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(SampleRequestLine.id)
                .where(SampleRequestLine.sample_request_id == SampleRequest.id)
                .where(
                    or_(
                        SampleRequestLine.product_code.ilike(pattern),
                        SampleRequestLine.product_name.ilike(pattern),
                        SampleRequestLine.requirement.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    SampleRequest.code.ilike(pattern),
                    SampleRequest.customer_name.ilike(pattern),
                    SampleRequest.product_code.ilike(pattern),
                    SampleRequest.product_name.ilike(pattern),
                    SampleRequest.supplier_name.ilike(pattern),
                    SampleRequest.requirements.ilike(pattern),
                    line_exists,
                )
            )
        if status:
            conditions.append(SampleRequest.status == status)
        if customer_id:
            conditions.append(SampleRequest.customer_id == customer_id)
        if owner_user_ids is not None:
            conditions.append(SampleRequest.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(SampleRequest.request_date.desc(), SampleRequest.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_request(row) for row in rows], int(total or 0)

    async def _scalars(self, statement: Select[tuple[SampleRequest]]) -> list[SampleRequest]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_request(self, sample_request: SampleRequest) -> SampleRequestRow:
        return SampleRequestRow(
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
            created_at=sample_request.created_at,
        )

    def _map_line(self, line: SampleRequestLine) -> SampleRequestLineRow:
        return SampleRequestLineRow(
            id=line.id,
            sample_request_id=line.sample_request_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            quantity=line.quantity,
            unit=line.unit,
            requirement=line.requirement,
            created_at=line.created_at,
        )

    def _map_progress(self, progress: SampleRequestProgress) -> SampleProgressRow:
        return SampleProgressRow(
            id=progress.id,
            sample_request_id=progress.sample_request_id,
            stage=progress.stage,
            status=progress.status,
            occurred_at=progress.occurred_at,
            note=progress.note,
            handler_name=progress.handler_name,
            created_at=progress.created_at,
        )

    def _map_fee(self, fee: SampleFee) -> SampleFeeRow:
        return SampleFeeRow(
            id=fee.id,
            sample_request_id=fee.sample_request_id,
            fee_type=fee.fee_type,
            amount=fee.amount,
            currency=fee.currency,
            payee_type=fee.payee_type,
            payee_name=fee.payee_name,
            remark=fee.remark,
            payment_status=fee.payment_status,
            payment_request_no=fee.payment_request_no,
            created_at=fee.created_at,
        )
