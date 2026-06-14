from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, delete, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.purchase.contracts.models import (
    PurchaseContract,
    PurchaseContractLine,
    PurchaseContractReminder,
    PurchaseContractSourceLink,
)


@dataclass(frozen=True)
class PurchaseContractRow:
    id: str
    code: str
    contract_date: date
    supplier_id: str | None
    supplier_name: str
    buyer_user_id: str | None
    buyer_user_name: str | None
    currency: str
    delivery_date: date
    payment_terms: str
    source_type: str
    remarks: str | None
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    total_quantity: str
    total_amount: str
    received_quantity: str
    unreceived_quantity: str
    paid_amount: str
    unpaid_amount: str
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseContractLineRow:
    id: str
    contract_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal
    unit: str
    unit_price: Decimal
    amount: str
    received_quantity: Decimal
    unreceived_quantity: str
    source_export_contract_id: str | None
    source_export_contract_no: str | None
    source_export_contract_line_id: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class PurchaseContractSourceLinkRow:
    id: str
    contract_id: str
    export_contract_id: str
    export_contract_no: str
    export_contract_line_id: str
    customer_name: str
    product_id: str | None
    product_code: str | None
    demand_quantity: str
    unit: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseContractReminderRow:
    id: str
    contract_id: str
    reminder_type: str
    title: str
    due_date: date
    amount: str | None
    currency: str
    status: str
    created_at: datetime


class PurchaseContractRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_contract(
        self,
        *,
        code: str,
        contract_date: date,
        supplier_id: str | None,
        supplier_name: str,
        buyer_user_id: str | None,
        buyer_user_name: str | None,
        currency: str,
        delivery_date: date,
        payment_terms: str,
        source_type: str,
        remarks: str | None,
        approval_status: str,
        owner_user_id: str,
    ) -> PurchaseContractRow:
        contract = PurchaseContract(
            code=code,
            contract_date=contract_date,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            buyer_user_id=buyer_user_id,
            buyer_user_name=buyer_user_name,
            currency=currency,
            delivery_date=delivery_date,
            payment_terms=payment_terms,
            source_type=source_type,
            remarks=remarks,
            approval_status=approval_status,
            owner_user_id=owner_user_id,
        )
        self.session.add(contract)
        await self.session.flush()
        return self._map_contract(contract)

    async def update_contract(
        self,
        *,
        contract_id: str,
        code: str,
        contract_date: date,
        supplier_id: str | None,
        supplier_name: str,
        buyer_user_id: str | None,
        buyer_user_name: str | None,
        currency: str,
        delivery_date: date,
        payment_terms: str,
        source_type: str,
        remarks: str | None,
    ) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        contract.code = code
        contract.contract_date = contract_date
        contract.supplier_id = supplier_id
        contract.supplier_name = supplier_name
        contract.buyer_user_id = buyer_user_id
        contract.buyer_user_name = buyer_user_name
        contract.currency = currency
        contract.delivery_date = delivery_date
        contract.payment_terms = payment_terms
        contract.source_type = source_type
        contract.remarks = remarks
        await self.session.flush()
        return self._map_contract(contract)

    async def add_line(
        self,
        *,
        contract_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        quantity: Decimal | str,
        unit: str,
        unit_price: Decimal | str,
        amount: Decimal | str,
        source_export_contract_id: str | None,
        source_export_contract_no: str | None,
        source_export_contract_line_id: str | None,
        remark: str | None,
    ) -> PurchaseContractLineRow:
        line = PurchaseContractLine(
            contract_id=contract_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            model=model,
            quantity=Decimal(str(quantity)),
            unit=unit,
            unit_price=Decimal(str(unit_price)),
            amount=Decimal(str(amount)),
            source_export_contract_id=source_export_contract_id,
            source_export_contract_no=source_export_contract_no,
            source_export_contract_line_id=source_export_contract_line_id,
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def delete_lines(self, contract_id: str) -> None:
        await self.session.execute(
            delete(PurchaseContractLine).where(PurchaseContractLine.contract_id == contract_id)
        )
        await self.session.flush()

    async def add_source_link(
        self,
        *,
        contract_id: str,
        export_contract_id: str,
        export_contract_no: str,
        export_contract_line_id: str,
        customer_name: str,
        product_id: str | None,
        product_code: str | None,
        demand_quantity: Decimal | str,
        unit: str,
    ) -> PurchaseContractSourceLinkRow:
        link = PurchaseContractSourceLink(
            contract_id=contract_id,
            export_contract_id=export_contract_id,
            export_contract_no=export_contract_no,
            export_contract_line_id=export_contract_line_id,
            customer_name=customer_name,
            product_id=product_id,
            product_code=product_code,
            demand_quantity=Decimal(str(demand_quantity)),
            unit=unit,
        )
        self.session.add(link)
        await self.session.flush()
        return self._map_source_link(link)

    async def delete_source_links(self, contract_id: str) -> None:
        await self.session.execute(
            delete(PurchaseContractSourceLink).where(
                PurchaseContractSourceLink.contract_id == contract_id
            )
        )
        await self.session.flush()

    async def add_reminder(
        self,
        *,
        contract_id: str,
        reminder_type: str,
        title: str,
        due_date: date,
        amount: Decimal | str | None,
        currency: str,
    ) -> PurchaseContractReminderRow:
        reminder = PurchaseContractReminder(
            contract_id=contract_id,
            reminder_type=reminder_type,
            title=title,
            due_date=due_date,
            amount=Decimal(str(amount)) if amount is not None else None,
            currency=currency,
        )
        self.session.add(reminder)
        await self.session.flush()
        return self._map_reminder(reminder)

    async def delete_reminders(self, contract_id: str) -> None:
        await self.session.execute(
            delete(PurchaseContractReminder).where(
                PurchaseContractReminder.contract_id == contract_id
            )
        )
        await self.session.flush()

    async def refresh_statistics(self, contract_id: str) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        lines = list(
            await self.session.scalars(
                select(PurchaseContractLine).where(PurchaseContractLine.contract_id == contract_id)
            )
        )
        total_quantity = Decimal("0")
        total_amount = Decimal("0")
        received_quantity = Decimal("0")
        for line in lines:
            total_quantity += line.quantity
            total_amount += line.amount
            received_quantity += line.received_quantity
        contract.total_quantity = total_quantity
        contract.total_amount = total_amount
        contract.received_quantity = received_quantity
        await self.session.flush()
        return self._map_contract(contract)

    async def increase_line_received_quantity(
        self,
        line_id: str,
        quantity: Decimal | str,
    ) -> PurchaseContractLineRow | None:
        line = await self.session.get(PurchaseContractLine, line_id)
        if line is None:
            return None
        line.received_quantity += Decimal(str(quantity))
        await self.session.flush()
        return self._map_line(line)

    async def get_contract(self, contract_id: str) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        return self._map_contract(contract)

    async def list_lines(self, contract_id: str) -> list[PurchaseContractLineRow]:
        rows = await self.session.scalars(
            select(PurchaseContractLine)
            .where(PurchaseContractLine.contract_id == contract_id)
            .order_by(PurchaseContractLine.created_at.asc(), PurchaseContractLine.id.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_contracts_by_source_line(
        self,
        source_export_contract_line_id: str,
    ) -> list[PurchaseContractRow]:
        line_exists = (
            select(PurchaseContractLine.id)
            .where(PurchaseContractLine.contract_id == PurchaseContract.id)
            .where(
                PurchaseContractLine.source_export_contract_line_id
                == source_export_contract_line_id
            )
            .exists()
        )
        rows = await self.session.scalars(
            select(PurchaseContract)
            .where(PurchaseContract.approval_status == "approved")
            .where(line_exists)
            .order_by(PurchaseContract.contract_date.asc(), PurchaseContract.code.asc())
        )
        return [self._map_contract(row) for row in rows]

    async def list_source_links(
        self,
        contract_id: str,
    ) -> list[PurchaseContractSourceLinkRow]:
        rows = await self.session.scalars(
            select(PurchaseContractSourceLink)
            .where(PurchaseContractSourceLink.contract_id == contract_id)
            .order_by(
                PurchaseContractSourceLink.created_at.asc(),
                PurchaseContractSourceLink.id.asc(),
            )
        )
        return [self._map_source_link(row) for row in rows]

    async def list_reminders(
        self,
        contract_id: str | None = None,
    ) -> list[PurchaseContractReminderRow]:
        statement = select(PurchaseContractReminder)
        if contract_id is not None:
            statement = statement.where(PurchaseContractReminder.contract_id == contract_id)
        statement = statement.order_by(
            PurchaseContractReminder.due_date.asc(),
            PurchaseContractReminder.reminder_type.desc(),
        )
        rows = await self.session.scalars(statement)
        return [self._map_reminder(row) for row in rows]

    async def list_contracts(
        self,
        *,
        q: str | None = None,
        approval_status: str | None = None,
        supplier_id: str | None = None,
        source_type: str | None = None,
        owner_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PurchaseContractRow], int]:
        statement = select(PurchaseContract)
        count_statement = select(func.count()).select_from(PurchaseContract)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(PurchaseContractLine.id)
                .where(PurchaseContractLine.contract_id == PurchaseContract.id)
                .where(
                    or_(
                        PurchaseContractLine.product_code.ilike(pattern),
                        PurchaseContractLine.product_name.ilike(pattern),
                        PurchaseContractLine.specification.ilike(pattern),
                        PurchaseContractLine.model.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    PurchaseContract.code.ilike(pattern),
                    PurchaseContract.supplier_name.ilike(pattern),
                    PurchaseContract.payment_terms.ilike(pattern),
                    line_exists,
                )
            )
        if approval_status:
            conditions.append(PurchaseContract.approval_status == approval_status)
        if supplier_id:
            conditions.append(PurchaseContract.supplier_id == supplier_id)
        if source_type:
            conditions.append(PurchaseContract.source_type == source_type)
        if owner_user_id:
            conditions.append(PurchaseContract.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(PurchaseContract.contract_date.desc(), PurchaseContract.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_contract(row) for row in rows], int(total or 0)

    async def submit_contract(self, contract_id: str) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        contract.approval_status = "submitted"
        contract.submitted_at = contract.contract_date
        await self.session.flush()
        return self._map_contract(contract)

    async def approve_contract(
        self,
        *,
        contract_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        contract.approval_status = "approved"
        contract.reviewer_name = reviewer_name
        contract.approved_at = approved_at
        await self.session.flush()
        return self._map_contract(contract)

    async def has_other_approved_purchase_for_source_line(
        self,
        *,
        export_contract_line_id: str,
        current_contract_id: str,
    ) -> bool:
        condition = exists().where(
            PurchaseContractSourceLink.export_contract_line_id == export_contract_line_id
        ).where(PurchaseContractSourceLink.contract_id == PurchaseContract.id)
        count = await self.session.scalar(
            select(func.count())
            .select_from(PurchaseContract)
            .where(PurchaseContract.approval_status == "approved")
            .where(PurchaseContract.id != current_contract_id)
            .where(condition)
        )
        return bool(count)

    async def _get_contract_model(self, contract_id: str) -> PurchaseContract | None:
        return await self.session.get(PurchaseContract, contract_id)

    async def _scalars(self, statement: Select[tuple[PurchaseContract]]) -> list[PurchaseContract]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_contract(self, contract: PurchaseContract) -> PurchaseContractRow:
        unreceived_quantity = contract.total_quantity - contract.received_quantity
        unpaid_amount = contract.total_amount - contract.paid_amount
        return PurchaseContractRow(
            id=contract.id,
            code=contract.code,
            contract_date=contract.contract_date,
            supplier_id=contract.supplier_id,
            supplier_name=contract.supplier_name,
            buyer_user_id=contract.buyer_user_id,
            buyer_user_name=contract.buyer_user_name,
            currency=contract.currency,
            delivery_date=contract.delivery_date,
            payment_terms=contract.payment_terms,
            source_type=contract.source_type,
            remarks=contract.remarks,
            approval_status=contract.approval_status,
            submitted_at=contract.submitted_at,
            approved_at=contract.approved_at,
            reviewer_name=contract.reviewer_name,
            total_quantity=self._quantity(contract.total_quantity),
            total_amount=self._money(contract.total_amount),
            received_quantity=self._quantity(contract.received_quantity),
            unreceived_quantity=self._quantity(unreceived_quantity),
            paid_amount=self._money(contract.paid_amount),
            unpaid_amount=self._money(unpaid_amount),
            owner_user_id=contract.owner_user_id,
            created_at=contract.created_at,
        )

    def _map_line(self, line: PurchaseContractLine) -> PurchaseContractLineRow:
        unreceived_quantity = line.quantity - line.received_quantity
        return PurchaseContractLineRow(
            id=line.id,
            contract_id=line.contract_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=line.quantity,
            unit=line.unit,
            unit_price=line.unit_price,
            amount=self._money(line.amount),
            received_quantity=line.received_quantity,
            unreceived_quantity=self._quantity(unreceived_quantity),
            source_export_contract_id=line.source_export_contract_id,
            source_export_contract_no=line.source_export_contract_no,
            source_export_contract_line_id=line.source_export_contract_line_id,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _map_source_link(
        self,
        link: PurchaseContractSourceLink,
    ) -> PurchaseContractSourceLinkRow:
        return PurchaseContractSourceLinkRow(
            id=link.id,
            contract_id=link.contract_id,
            export_contract_id=link.export_contract_id,
            export_contract_no=link.export_contract_no,
            export_contract_line_id=link.export_contract_line_id,
            customer_name=link.customer_name,
            product_id=link.product_id,
            product_code=link.product_code,
            demand_quantity=self._quantity(link.demand_quantity),
            unit=link.unit,
            created_at=link.created_at,
        )

    def _map_reminder(self, reminder: PurchaseContractReminder) -> PurchaseContractReminderRow:
        return PurchaseContractReminderRow(
            id=reminder.id,
            contract_id=reminder.contract_id,
            reminder_type=reminder.reminder_type,
            title=reminder.title,
            due_date=reminder.due_date,
            amount=self._money(reminder.amount) if reminder.amount is not None else None,
            currency=reminder.currency,
            status=reminder.status,
            created_at=reminder.created_at,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
