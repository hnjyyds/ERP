from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sales.shipments.models import ShipmentLine, ShipmentPlan


@dataclass(frozen=True)
class ShipmentPlanRow:
    id: str
    code: str
    shipment_date: date
    planned_ship_date: date
    customer_id: str | None
    customer_name: str
    currency: str
    shipping_method: str
    port_of_loading: str
    port_of_destination: str
    vessel_name: str | None
    container_no: str | None
    booking_no: str | None
    document_owner_name: str | None
    receivable_amount: str
    payable_amount: str
    profit_amount: str
    profit_rate: str
    reminder_date: date
    reminder_status: str
    reminder_message: str
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    remarks: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class ShipmentLineRow:
    id: str
    shipment_id: str
    contract_id: str
    contract_no: str
    contract_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal
    unit: str
    unit_price: Decimal
    amount: str
    planned_ship_date: date
    created_at: datetime


@dataclass(frozen=True)
class ShipmentReminderRow:
    shipment_id: str
    shipment_no: str
    reminder_date: date
    message: str
    status: str


class ShipmentPlanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_plan(
        self,
        *,
        code: str,
        shipment_date: date,
        planned_ship_date: date,
        customer_id: str | None,
        customer_name: str,
        currency: str,
        shipping_method: str,
        port_of_loading: str,
        port_of_destination: str,
        vessel_name: str | None,
        container_no: str | None,
        booking_no: str | None,
        document_owner_name: str | None,
        payable_amount: Decimal | str,
        remarks: str | None,
        approval_status: str,
        owner_user_id: str,
    ) -> ShipmentPlanRow:
        reminder_date = planned_ship_date - timedelta(days=7)
        plan = ShipmentPlan(
            code=code,
            shipment_date=shipment_date,
            planned_ship_date=planned_ship_date,
            customer_id=customer_id,
            customer_name=customer_name,
            currency=currency,
            shipping_method=shipping_method,
            port_of_loading=port_of_loading,
            port_of_destination=port_of_destination,
            vessel_name=vessel_name,
            container_no=container_no,
            booking_no=booking_no,
            document_owner_name=document_owner_name,
            payable_amount=Decimal(str(payable_amount)),
            reminder_date=reminder_date,
            reminder_message=f"{code} 计划于 {planned_ship_date.isoformat()} 出运",
            approval_status=approval_status,
            remarks=remarks,
            owner_user_id=owner_user_id,
        )
        self.session.add(plan)
        await self.session.flush()
        return self._map_plan(plan)

    async def add_line(
        self,
        *,
        shipment_id: str,
        contract_id: str,
        contract_no: str,
        contract_line_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        quantity: Decimal | str,
        unit: str,
        unit_price: Decimal | str,
        amount: Decimal | str,
        planned_ship_date: date,
    ) -> ShipmentLineRow:
        line = ShipmentLine(
            shipment_id=shipment_id,
            contract_id=contract_id,
            contract_no=contract_no,
            contract_line_id=contract_line_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            model=model,
            quantity=Decimal(str(quantity)),
            unit=unit,
            unit_price=Decimal(str(unit_price)),
            amount=Decimal(str(amount)),
            planned_ship_date=planned_ship_date,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def refresh_finance(self, shipment_id: str) -> ShipmentPlanRow | None:
        plan = await self.session.scalar(
            select(ShipmentPlan).where(ShipmentPlan.id == shipment_id)
        )
        if plan is None:
            return None
        receivable_amount = await self.session.scalar(
            select(func.sum(ShipmentLine.amount)).where(ShipmentLine.shipment_id == shipment_id)
        )
        plan.receivable_amount = Decimal(str(receivable_amount or 0))
        plan.profit_amount = plan.receivable_amount - plan.payable_amount
        if plan.receivable_amount == 0:
            plan.profit_rate = Decimal("0")
        else:
            plan.profit_rate = (plan.profit_amount / plan.receivable_amount) * Decimal("100")
        await self.session.flush()
        return self._map_plan(plan)

    async def get_plan(self, shipment_id: str) -> ShipmentPlanRow | None:
        plan = await self.session.scalar(select(ShipmentPlan).where(ShipmentPlan.id == shipment_id))
        if plan is None:
            return None
        return self._map_plan(plan)

    async def list_lines(self, shipment_id: str) -> list[ShipmentLineRow]:
        rows = await self.session.scalars(
            select(ShipmentLine)
            .where(ShipmentLine.shipment_id == shipment_id)
            .order_by(ShipmentLine.created_at.asc())
        )
        return [self._map_line(row) for row in rows]

    async def get_line(self, line_id: str) -> ShipmentLineRow | None:
        line = await self.session.get(ShipmentLine, line_id)
        if line is None:
            return None
        return self._map_line(line)

    async def list_plans(
        self,
        *,
        q: str | None = None,
        approval_status: str | None = None,
        customer_id: str | None = None,
        contract_id: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ShipmentPlanRow], int]:
        statement = select(ShipmentPlan)
        count_statement = select(func.count()).select_from(ShipmentPlan)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(ShipmentLine.id)
                .where(ShipmentLine.shipment_id == ShipmentPlan.id)
                .where(
                    or_(
                        ShipmentLine.contract_no.ilike(pattern),
                        ShipmentLine.product_code.ilike(pattern),
                        ShipmentLine.product_name.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    ShipmentPlan.code.ilike(pattern),
                    ShipmentPlan.customer_name.ilike(pattern),
                    ShipmentPlan.port_of_destination.ilike(pattern),
                    ShipmentPlan.container_no.ilike(pattern),
                    ShipmentPlan.booking_no.ilike(pattern),
                    line_exists,
                )
            )
        if approval_status:
            conditions.append(ShipmentPlan.approval_status == approval_status)
        if customer_id:
            conditions.append(ShipmentPlan.customer_id == customer_id)
        if contract_id:
            contract_exists = (
                select(ShipmentLine.id)
                .where(ShipmentLine.shipment_id == ShipmentPlan.id)
                .where(ShipmentLine.contract_id == contract_id)
                .exists()
            )
            conditions.append(contract_exists)
        if owner_user_ids is not None:
            conditions.append(ShipmentPlan.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(ShipmentPlan.shipment_date.desc(), ShipmentPlan.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_plan(row) for row in rows], int(total or 0)

    async def submit_plan(self, shipment_id: str) -> ShipmentPlanRow | None:
        plan = await self.session.scalar(select(ShipmentPlan).where(ShipmentPlan.id == shipment_id))
        if plan is None:
            return None
        plan.approval_status = "submitted"
        plan.submitted_at = plan.shipment_date
        await self.session.flush()
        return self._map_plan(plan)

    async def approve_plan(
        self,
        *,
        shipment_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> ShipmentPlanRow | None:
        plan = await self.session.scalar(select(ShipmentPlan).where(ShipmentPlan.id == shipment_id))
        if plan is None:
            return None
        plan.approval_status = "approved"
        plan.reviewer_name = reviewer_name
        plan.approved_at = approved_at
        plan.reminder_status = "done"
        await self.session.flush()
        return self._map_plan(plan)

    async def list_reminders(
        self,
        *,
        owner_user_ids: list[str] | None,
    ) -> list[ShipmentReminderRow]:
        statement = select(ShipmentPlan)
        if owner_user_ids is not None:
            statement = statement.where(ShipmentPlan.owner_user_id.in_(owner_user_ids))
        statement = statement.order_by(ShipmentPlan.reminder_date.asc(), ShipmentPlan.code.asc())
        rows = await self._scalars(statement)
        return [self._map_reminder(row) for row in rows]

    async def _scalars(self, statement: Select[tuple[ShipmentPlan]]) -> list[ShipmentPlan]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_plan(self, plan: ShipmentPlan) -> ShipmentPlanRow:
        return ShipmentPlanRow(
            id=plan.id,
            code=plan.code,
            shipment_date=plan.shipment_date,
            planned_ship_date=plan.planned_ship_date,
            customer_id=plan.customer_id,
            customer_name=plan.customer_name,
            currency=plan.currency,
            shipping_method=plan.shipping_method,
            port_of_loading=plan.port_of_loading,
            port_of_destination=plan.port_of_destination,
            vessel_name=plan.vessel_name,
            container_no=plan.container_no,
            booking_no=plan.booking_no,
            document_owner_name=plan.document_owner_name,
            receivable_amount=self._money(plan.receivable_amount),
            payable_amount=self._money(plan.payable_amount),
            profit_amount=self._money(plan.profit_amount),
            profit_rate=self._money(plan.profit_rate),
            reminder_date=plan.reminder_date,
            reminder_status=plan.reminder_status,
            reminder_message=plan.reminder_message,
            approval_status=plan.approval_status,
            submitted_at=plan.submitted_at,
            approved_at=plan.approved_at,
            reviewer_name=plan.reviewer_name,
            remarks=plan.remarks,
            owner_user_id=plan.owner_user_id,
            created_at=plan.created_at,
        )

    def _map_line(self, line: ShipmentLine) -> ShipmentLineRow:
        return ShipmentLineRow(
            id=line.id,
            shipment_id=line.shipment_id,
            contract_id=line.contract_id,
            contract_no=line.contract_no,
            contract_line_id=line.contract_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=line.quantity,
            unit=line.unit,
            unit_price=line.unit_price,
            amount=self._money(line.amount),
            planned_ship_date=line.planned_ship_date,
            created_at=line.created_at,
        )

    def _map_reminder(self, plan: ShipmentPlan) -> ShipmentReminderRow:
        return ShipmentReminderRow(
            shipment_id=plan.id,
            shipment_no=plan.code,
            reminder_date=plan.reminder_date,
            message=plan.reminder_message,
            status=plan.reminder_status,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"
