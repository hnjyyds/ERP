from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, delete, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sample.deliveries.models import (
    SampleDelivery,
    SampleDeliveryFee,
    SampleDeliveryLine,
)


@dataclass(frozen=True)
class SampleDeliveryRow:
    id: str
    code: str
    delivery_date: date
    customer_id: str | None
    customer_name: str
    supplier_id: str | None
    supplier_name: str | None
    factory_id: str | None
    factory_name: str | None
    recipient_name: str
    recipient_company: str | None
    recipient_address: str
    express_company: str
    tracking_no: str | None
    quote_id: str | None
    quote_no: str | None
    remark: str | None
    status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class SampleDeliveryLineRow:
    id: str
    delivery_id: str
    sample_record_id: str
    sample_code: str | None
    sample_type: str
    product_id: str | None
    product_code: str | None
    product_name: str
    quantity: Decimal
    unit: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class SampleDeliveryFeeRow:
    id: str
    delivery_id: str
    fee_type: str
    amount: Decimal
    currency: str
    payer_type: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class SampleDeliveryFeeStatisticRow:
    customer_id: str | None
    customer_name: str
    express_company: str
    currency: str
    total_amount: str
    delivery_count: int


class SampleDeliveryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_delivery(
        self,
        *,
        code: str,
        delivery_date: date,
        customer_id: str | None,
        customer_name: str,
        supplier_id: str | None,
        supplier_name: str | None,
        factory_id: str | None,
        factory_name: str | None,
        recipient_name: str,
        recipient_company: str | None,
        recipient_address: str,
        express_company: str,
        tracking_no: str | None,
        quote_id: str | None,
        quote_no: str | None,
        remark: str | None,
        status: str,
        owner_user_id: str,
    ) -> SampleDeliveryRow:
        delivery = SampleDelivery(
            code=code,
            delivery_date=delivery_date,
            customer_id=customer_id,
            customer_name=customer_name,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            factory_id=factory_id,
            factory_name=factory_name,
            recipient_name=recipient_name,
            recipient_company=recipient_company,
            recipient_address=recipient_address,
            express_company=express_company,
            tracking_no=tracking_no,
            quote_id=quote_id,
            quote_no=quote_no,
            remark=remark,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(delivery)
        await self.session.flush()
        return self._map_delivery(delivery)

    async def update_delivery(
        self,
        *,
        delivery_id: str,
        code: str,
        delivery_date: date,
        customer_id: str | None,
        customer_name: str,
        supplier_id: str | None,
        supplier_name: str | None,
        factory_id: str | None,
        factory_name: str | None,
        recipient_name: str,
        recipient_company: str | None,
        recipient_address: str,
        express_company: str,
        tracking_no: str | None,
        quote_id: str | None,
        quote_no: str | None,
        remark: str | None,
    ) -> SampleDeliveryRow | None:
        delivery = await self.session.scalar(
            select(SampleDelivery).where(SampleDelivery.id == delivery_id)
        )
        if delivery is None:
            return None
        delivery.code = code
        delivery.delivery_date = delivery_date
        delivery.customer_id = customer_id
        delivery.customer_name = customer_name
        delivery.supplier_id = supplier_id
        delivery.supplier_name = supplier_name
        delivery.factory_id = factory_id
        delivery.factory_name = factory_name
        delivery.recipient_name = recipient_name
        delivery.recipient_company = recipient_company
        delivery.recipient_address = recipient_address
        delivery.express_company = express_company
        delivery.tracking_no = tracking_no
        delivery.quote_id = quote_id
        delivery.quote_no = quote_no
        delivery.remark = remark
        await self.session.flush()
        return self._map_delivery(delivery)

    async def add_line(
        self,
        *,
        delivery_id: str,
        sample_record_id: str,
        sample_code: str | None,
        sample_type: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        quantity: Decimal | str,
        unit: str,
        remark: str | None,
    ) -> SampleDeliveryLineRow:
        line = SampleDeliveryLine(
            delivery_id=delivery_id,
            sample_record_id=sample_record_id,
            sample_code=sample_code,
            sample_type=sample_type,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            quantity=Decimal(str(quantity)),
            unit=unit,
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def add_fee(
        self,
        *,
        delivery_id: str,
        fee_type: str,
        amount: Decimal | str,
        currency: str,
        payer_type: str,
        remark: str | None,
    ) -> SampleDeliveryFeeRow:
        fee = SampleDeliveryFee(
            delivery_id=delivery_id,
            fee_type=fee_type,
            amount=Decimal(str(amount)),
            currency=currency,
            payer_type=payer_type,
            remark=remark,
        )
        self.session.add(fee)
        await self.session.flush()
        return self._map_fee(fee)

    async def delete_lines(self, delivery_id: str) -> None:
        await self.session.execute(
            delete(SampleDeliveryLine).where(SampleDeliveryLine.delivery_id == delivery_id)
        )
        await self.session.flush()

    async def delete_fees(self, delivery_id: str) -> None:
        await self.session.execute(
            delete(SampleDeliveryFee).where(SampleDeliveryFee.delivery_id == delivery_id)
        )
        await self.session.flush()

    async def get_delivery(self, delivery_id: str) -> SampleDeliveryRow | None:
        delivery = await self.session.scalar(
            select(SampleDelivery).where(SampleDelivery.id == delivery_id)
        )
        if delivery is None:
            return None
        return self._map_delivery(delivery)

    async def submit_delivery(self, delivery_id: str) -> SampleDeliveryRow | None:
        delivery = await self.session.scalar(
            select(SampleDelivery).where(SampleDelivery.id == delivery_id)
        )
        if delivery is None:
            return None
        delivery.status = "submitted"
        delivery.submitted_at = date.today()
        await self.session.flush()
        return self._map_delivery(delivery)

    async def approve_delivery(
        self,
        *,
        delivery_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> SampleDeliveryRow | None:
        delivery = await self.session.scalar(
            select(SampleDelivery).where(SampleDelivery.id == delivery_id)
        )
        if delivery is None:
            return None
        delivery.status = "approved"
        delivery.reviewer_name = reviewer_name
        delivery.approved_at = approved_at
        await self.session.flush()
        return self._map_delivery(delivery)

    async def update_tracking(
        self,
        *,
        delivery_id: str,
        express_company: str,
        tracking_no: str,
        status: str,
    ) -> SampleDeliveryRow | None:
        delivery = await self.session.scalar(
            select(SampleDelivery).where(SampleDelivery.id == delivery_id)
        )
        if delivery is None:
            return None
        delivery.express_company = express_company
        delivery.tracking_no = tracking_no
        delivery.status = status
        await self.session.flush()
        return self._map_delivery(delivery)

    async def list_deliveries(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        customer_id: str | None = None,
        express_company: str | None = None,
        owner_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SampleDeliveryRow], int]:
        statement = select(SampleDelivery)
        count_statement = select(func.count()).select_from(SampleDelivery)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(SampleDeliveryLine.id)
                .where(SampleDeliveryLine.delivery_id == SampleDelivery.id)
                .where(
                    or_(
                        SampleDeliveryLine.sample_code.ilike(pattern),
                        SampleDeliveryLine.product_code.ilike(pattern),
                        SampleDeliveryLine.product_name.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    SampleDelivery.code.ilike(pattern),
                    SampleDelivery.customer_name.ilike(pattern),
                    SampleDelivery.recipient_name.ilike(pattern),
                    SampleDelivery.express_company.ilike(pattern),
                    SampleDelivery.tracking_no.ilike(pattern),
                    SampleDelivery.quote_no.ilike(pattern),
                    line_exists,
                )
            )
        if status:
            conditions.append(SampleDelivery.status == status)
        if customer_id:
            conditions.append(SampleDelivery.customer_id == customer_id)
        if express_company:
            conditions.append(SampleDelivery.express_company == express_company)
        if owner_user_id:
            conditions.append(SampleDelivery.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(SampleDelivery.delivery_date.desc(), SampleDelivery.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_delivery(row) for row in rows], int(total or 0)

    async def list_lines(self, delivery_id: str) -> list[SampleDeliveryLineRow]:
        rows = await self.session.scalars(
            select(SampleDeliveryLine)
            .where(SampleDeliveryLine.delivery_id == delivery_id)
            .order_by(SampleDeliveryLine.created_at.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_fees(self, delivery_id: str) -> list[SampleDeliveryFeeRow]:
        rows = await self.session.scalars(
            select(SampleDeliveryFee)
            .where(SampleDeliveryFee.delivery_id == delivery_id)
            .order_by(SampleDeliveryFee.created_at.asc())
        )
        return [self._map_fee(row) for row in rows]

    async def get_fee_statistics(
        self,
        *,
        customer_id: str | None,
        date_from: date | None,
        date_to: date | None,
        express_company: str | None,
    ) -> list[SampleDeliveryFeeStatisticRow]:
        statement = (
            select(
                SampleDelivery.customer_id,
                SampleDelivery.customer_name,
                SampleDelivery.express_company,
                SampleDeliveryFee.currency,
                func.sum(SampleDeliveryFee.amount),
                func.count(distinct(SampleDelivery.id)),
            )
            .join(SampleDeliveryFee, SampleDeliveryFee.delivery_id == SampleDelivery.id)
            .where(SampleDelivery.status == "approved")
            .group_by(
                SampleDelivery.customer_id,
                SampleDelivery.customer_name,
                SampleDelivery.express_company,
                SampleDeliveryFee.currency,
            )
            .order_by(SampleDelivery.customer_name.asc(), SampleDelivery.express_company.asc())
        )
        if customer_id:
            statement = statement.where(SampleDelivery.customer_id == customer_id)
        if date_from:
            statement = statement.where(SampleDelivery.delivery_date >= date_from)
        if date_to:
            statement = statement.where(SampleDelivery.delivery_date <= date_to)
        if express_company:
            statement = statement.where(SampleDelivery.express_company == express_company)

        rows = await self.session.execute(statement)
        return [
            SampleDeliveryFeeStatisticRow(
                customer_id=customer_id_value,
                customer_name=customer_name,
                express_company=express_company_value,
                currency=currency,
                total_amount=self._money(Decimal(str(total_amount or 0))),
                delivery_count=int(delivery_count or 0),
            )
            for (
                customer_id_value,
                customer_name,
                express_company_value,
                currency,
                total_amount,
                delivery_count,
            ) in rows
        ]

    async def list_sample_history(
        self,
        sample_record_id: str,
    ) -> tuple[list[SampleDeliveryRow], int]:
        statement = (
            select(SampleDelivery)
            .join(SampleDeliveryLine, SampleDeliveryLine.delivery_id == SampleDelivery.id)
            .where(SampleDeliveryLine.sample_record_id == sample_record_id)
            .order_by(SampleDelivery.delivery_date.desc(), SampleDelivery.code.asc())
        )
        count_statement = (
            select(func.count(distinct(SampleDelivery.id)))
            .select_from(SampleDelivery)
            .join(SampleDeliveryLine, SampleDeliveryLine.delivery_id == SampleDelivery.id)
            .where(SampleDeliveryLine.sample_record_id == sample_record_id)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_delivery(row) for row in rows], int(total or 0)

    async def list_quote_history(
        self,
        *,
        customer_id: str | None,
        product_id: str | None,
    ) -> tuple[list[SampleDeliveryRow], int]:
        statement = (
            select(SampleDelivery)
            .join(SampleDeliveryLine, SampleDeliveryLine.delivery_id == SampleDelivery.id)
            .where(SampleDelivery.status == "approved")
        )
        count_statement = (
            select(func.count(distinct(SampleDelivery.id)))
            .select_from(SampleDelivery)
            .join(SampleDeliveryLine, SampleDeliveryLine.delivery_id == SampleDelivery.id)
            .where(SampleDelivery.status == "approved")
        )
        if customer_id:
            statement = statement.where(SampleDelivery.customer_id == customer_id)
            count_statement = count_statement.where(SampleDelivery.customer_id == customer_id)
        if product_id:
            statement = statement.where(SampleDeliveryLine.product_id == product_id)
            count_statement = count_statement.where(SampleDeliveryLine.product_id == product_id)
        statement = statement.order_by(
            SampleDelivery.delivery_date.desc(),
            SampleDelivery.code.asc(),
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_delivery(row) for row in rows], int(total or 0)

    async def _scalars(self, statement: Select[tuple[SampleDelivery]]) -> list[SampleDelivery]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_delivery(self, delivery: SampleDelivery) -> SampleDeliveryRow:
        return SampleDeliveryRow(
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
            created_at=delivery.created_at,
        )

    def _map_line(self, line: SampleDeliveryLine) -> SampleDeliveryLineRow:
        return SampleDeliveryLineRow(
            id=line.id,
            delivery_id=line.delivery_id,
            sample_record_id=line.sample_record_id,
            sample_code=line.sample_code,
            sample_type=line.sample_type,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            quantity=line.quantity,
            unit=line.unit,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _map_fee(self, fee: SampleDeliveryFee) -> SampleDeliveryFeeRow:
        return SampleDeliveryFeeRow(
            id=fee.id,
            delivery_id=fee.delivery_id,
            fee_type=fee.fee_type,
            amount=fee.amount,
            currency=fee.currency,
            payer_type=fee.payer_type,
            remark=fee.remark,
            created_at=fee.created_at,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"
