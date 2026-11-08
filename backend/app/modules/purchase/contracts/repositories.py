from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, delete, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import resolve_limit, resolve_offset
from app.modules.purchase.contracts.models import (
    PurchaseContract,
    PurchaseContractLine,
    PurchaseContractReminder,
    PurchaseContractSourceLink,
)
from app.modules.purchase.contracts.rows import (
    PurchaseContractDetails,
    PurchaseContractLineRow,
    PurchaseContractReminderRow,
    PurchaseContractRow,
    PurchaseContractSourceLinkRow,
)


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
        qc_user_id: str | None = None,
        qc_user_name: str | None = None,
        reissued_from_id: str | None = None,
        reissued_from_code: str | None = None,
        reissue_reason: str | None = None,
    ) -> PurchaseContractRow:
        contract = PurchaseContract(
            code=code,
            contract_date=contract_date,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            buyer_user_id=buyer_user_id,
            buyer_user_name=buyer_user_name,
            qc_user_id=qc_user_id,
            qc_user_name=qc_user_name,
            currency=currency,
            delivery_date=delivery_date,
            payment_terms=payment_terms,
            source_type=source_type,
            remarks=remarks,
            approval_status=approval_status,
            owner_user_id=owner_user_id,
            reissued_from_id=reissued_from_id,
            reissued_from_code=reissued_from_code,
            reissue_reason=reissue_reason,
        )
        self.session.add(contract)
        await self.session.flush()
        return self._map_contract(contract)

    async def update_contract(
        self,
        *,
        contract_id: str,
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
        qc_user_id: str | None = None,
        qc_user_name: str | None = None,
    ) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        contract.contract_date = contract_date
        contract.supplier_id = supplier_id
        contract.supplier_name = supplier_name
        contract.buyer_user_id = buyer_user_id
        contract.buyer_user_name = buyer_user_name
        contract.qc_user_id = qc_user_id
        contract.qc_user_name = qc_user_name
        contract.currency = currency
        contract.delivery_date = delivery_date
        contract.payment_terms = payment_terms
        contract.source_type = source_type
        contract.remarks = remarks
        if contract.approval_status == "rejected":
            contract.approval_status = "draft"
            contract.submitted_at = None
            contract.rejected_at = None
            contract.rejection_reason = None
            contract.reviewer_id = None
            contract.reviewer_name = None
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

    async def list_details(
        self,
        contract_ids: list[str],
    ) -> dict[str, PurchaseContractDetails]:
        """Load all response child collections with three bounded queries."""
        unique_ids = list(dict.fromkeys(contract_ids))
        details = {
            contract_id: PurchaseContractDetails(lines=[], source_links=[], reminders=[])
            for contract_id in unique_ids
        }
        if not unique_ids:
            return details

        line_rows = await self.session.scalars(
            select(PurchaseContractLine)
            .where(PurchaseContractLine.contract_id.in_(unique_ids))
            .order_by(
                PurchaseContractLine.contract_id.asc(),
                PurchaseContractLine.created_at.asc(),
                PurchaseContractLine.id.asc(),
            )
        )
        for line_model in line_rows:
            details[line_model.contract_id].lines.append(self._map_line(line_model))

        source_rows = await self.session.scalars(
            select(PurchaseContractSourceLink)
            .where(PurchaseContractSourceLink.contract_id.in_(unique_ids))
            .order_by(
                PurchaseContractSourceLink.contract_id.asc(),
                PurchaseContractSourceLink.created_at.asc(),
                PurchaseContractSourceLink.id.asc(),
            )
        )
        for source_model in source_rows:
            details[source_model.contract_id].source_links.append(
                self._map_source_link(source_model)
            )

        reminder_rows = await self.session.scalars(
            select(PurchaseContractReminder)
            .where(PurchaseContractReminder.contract_id.in_(unique_ids))
            .order_by(
                PurchaseContractReminder.contract_id.asc(),
                PurchaseContractReminder.due_date.asc(),
                PurchaseContractReminder.reminder_type.desc(),
            )
        )
        for reminder_model in reminder_rows:
            details[reminder_model.contract_id].reminders.append(self._map_reminder(reminder_model))

        return details

    async def list_contracts(
        self,
        *,
        q: str | None = None,
        approval_status: str | None = None,
        supplier_id: str | None = None,
        source_type: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PurchaseContractRow], int]:
        statement = select(PurchaseContract)
        count_statement = select(func.count()).select_from(PurchaseContract)
        conditions = self._contract_conditions(
            q=q,
            approval_status=approval_status,
            supplier_id=supplier_id,
            source_type=source_type,
            owner_user_ids=owner_user_ids,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(PurchaseContract.contract_date.desc(), PurchaseContract.code.asc())
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_contract(row) for row in rows], int(total or 0)

    async def summarize_contracts(
        self,
        *,
        q: str | None = None,
        approval_status: str | None = None,
        supplier_id: str | None = None,
        source_type: str | None = None,
        owner_user_ids: list[str] | None = None,
    ) -> dict[str, object]:
        conditions = self._contract_conditions(
            q=q,
            approval_status=approval_status,
            supplier_id=supplier_id,
            source_type=source_type,
            owner_user_ids=owner_user_ids,
        )
        status_rows = await self.session.execute(
            select(PurchaseContract.approval_status, func.count())
            .where(*conditions)
            .group_by(PurchaseContract.approval_status)
        )
        counts = {status: int(count) for status, count in status_rows}
        total_amount = await self.session.scalar(
            select(func.coalesce(func.sum(PurchaseContract.total_amount), 0)).where(*conditions)
        )
        currency = await self.session.scalar(
            select(PurchaseContract.currency)
            .where(*conditions)
            .order_by(PurchaseContract.contract_date.desc(), PurchaseContract.code.asc())
            .limit(1)
        )
        return {
            "submitted_count": counts.get("submitted", 0),
            "approved_count": counts.get("approved", 0),
            "total_amount": total_amount or 0,
            "currency": currency,
        }

    def _contract_conditions(
        self,
        *,
        q: str | None,
        approval_status: str | None,
        supplier_id: str | None,
        source_type: str | None,
        owner_user_ids: list[str] | None,
    ) -> list[object]:
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
        else:
            conditions.append(PurchaseContract.approval_status != "cancelled")
        if supplier_id:
            conditions.append(PurchaseContract.supplier_id == supplier_id)
        if source_type:
            conditions.append(PurchaseContract.source_type == source_type)
        if owner_user_ids is not None:
            conditions.append(PurchaseContract.owner_user_id.in_(owner_user_ids))
        return conditions

    async def submit_contract(
        self,
        contract_id: str,
        *,
        reviewer_id: str | None = None,
        reviewer_name: str | None = None,
    ) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        contract.approval_status = "submitted"
        contract.submitted_at = contract.contract_date
        contract.approved_at = None
        contract.rejected_at = None
        contract.rejection_reason = None
        contract.reviewer_id = reviewer_id
        contract.reviewer_name = reviewer_name
        await self.session.flush()
        return self._map_contract(contract)

    async def review_contract(
        self,
        *,
        contract_id: str,
        decision: str,
        reviewed_at: date,
        rejection_reason: str | None = None,
        reviewer_id: str | None = None,
        reviewer_name: str | None = None,
    ) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        contract.approval_status = decision
        if reviewer_id is not None:
            contract.reviewer_id = reviewer_id
        if reviewer_name is not None:
            contract.reviewer_name = reviewer_name
        if decision == "approved":
            contract.approved_at = reviewed_at
            contract.rejected_at = None
            contract.rejection_reason = None
        else:
            contract.approved_at = None
            contract.rejected_at = reviewed_at
            contract.rejection_reason = rejection_reason
        await self.session.flush()
        return self._map_contract(contract)

    async def approve_contract(
        self,
        *,
        contract_id: str,
        approved_at: date,
        reviewer_id: str | None = None,
        reviewer_name: str | None = None,
    ) -> PurchaseContractRow | None:
        """Keep the legacy approval-only repository contract for internal callers."""
        return await self.review_contract(
            contract_id=contract_id,
            decision="approved",
            reviewed_at=approved_at,
            reviewer_id=reviewer_id,
            reviewer_name=reviewer_name,
        )

    async def cancel_contract(
        self,
        *,
        contract_id: str,
        cancel_reason: str,
        cancelled_by_id: str,
        cancelled_by_name: str,
        cancelled_at: datetime,
    ) -> PurchaseContractRow | None:
        contract = await self._get_contract_model(contract_id)
        if contract is None:
            return None
        contract.approval_status = "cancelled"
        contract.cancel_reason = cancel_reason
        contract.cancelled_by_id = cancelled_by_id
        contract.cancelled_by_name = cancelled_by_name
        contract.cancelled_at = cancelled_at
        await self.session.flush()
        return self._map_contract(contract)

    async def get_reissued_contract(
        self,
        *,
        source_contract_id: str,
    ) -> PurchaseContractRow | None:
        contract = await self.session.scalar(
            select(PurchaseContract)
            .where(PurchaseContract.reissued_from_id == source_contract_id)
            .order_by(PurchaseContract.created_at.asc())
            .limit(1)
        )
        return self._map_contract(contract) if contract is not None else None

    async def has_other_approved_purchase_for_source_line(
        self,
        *,
        export_contract_line_id: str,
        current_contract_id: str,
    ) -> bool:
        condition = (
            exists()
            .where(PurchaseContractSourceLink.export_contract_line_id == export_contract_line_id)
            .where(PurchaseContractSourceLink.contract_id == PurchaseContract.id)
        )
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
            qc_user_id=contract.qc_user_id,
            qc_user_name=contract.qc_user_name,
            currency=contract.currency,
            delivery_date=contract.delivery_date,
            payment_terms=contract.payment_terms,
            source_type=contract.source_type,
            remarks=contract.remarks,
            approval_status=contract.approval_status,
            submitted_at=contract.submitted_at,
            approved_at=contract.approved_at,
            rejected_at=contract.rejected_at,
            rejection_reason=contract.rejection_reason,
            reviewer_id=contract.reviewer_id,
            reviewer_name=contract.reviewer_name,
            total_quantity=self._quantity(contract.total_quantity),
            total_amount=self._money(contract.total_amount),
            received_quantity=self._quantity(contract.received_quantity),
            unreceived_quantity=self._quantity(unreceived_quantity),
            paid_amount=self._money(contract.paid_amount),
            unpaid_amount=self._money(unpaid_amount),
            cancelled_at=contract.cancelled_at,
            cancelled_by_id=contract.cancelled_by_id,
            cancelled_by_name=contract.cancelled_by_name,
            cancel_reason=contract.cancel_reason,
            reissued_from_id=contract.reissued_from_id,
            reissued_from_code=contract.reissued_from_code,
            reissue_reason=contract.reissue_reason,
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
