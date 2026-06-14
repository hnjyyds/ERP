from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.purchase.invoice_notices.models import (
    PurchaseInvoiceNotice,
    PurchaseInvoiceNoticeLine,
    PurchaseInvoiceNoticeReminder,
)


@dataclass(frozen=True)
class PurchaseInvoiceNoticeRow:
    id: str
    code: str
    notice_date: date
    supplier_id: str | None
    supplier_name: str
    customs_declaration_id: str | None
    customs_declaration_no: str
    declaration_date: date
    currency: str
    remarks: str | None
    status: str
    sent_at: date | None
    sender_name: str | None
    tax_invoice_no: str | None
    tax_invoice_received_at: date | None
    total_quantity: str
    total_amount: str
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseInvoiceNoticeLineRow:
    id: str
    notice_id: str
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    product_id: str | None
    product_code: str | None
    product_name: str
    customs_name: str
    invoice_name: str
    quantity: str
    unit: str
    amount: str
    currency: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class PurchaseInvoiceNoticeReminderRow:
    id: str
    notice_id: str
    title: str
    due_date: date
    status: str
    owner_user_id: str
    created_at: datetime


class PurchaseInvoiceNoticeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_notice(
        self,
        *,
        code: str,
        notice_date: date,
        supplier_id: str | None,
        supplier_name: str,
        customs_declaration_id: str | None,
        customs_declaration_no: str,
        declaration_date: date,
        currency: str,
        remarks: str | None,
        status: str,
        owner_user_id: str,
    ) -> PurchaseInvoiceNoticeRow:
        notice = PurchaseInvoiceNotice(
            code=code,
            notice_date=notice_date,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            customs_declaration_id=customs_declaration_id,
            customs_declaration_no=customs_declaration_no,
            declaration_date=declaration_date,
            currency=currency,
            remarks=remarks,
            status=status,
            owner_user_id=owner_user_id,
        )
        self.session.add(notice)
        await self.session.flush()
        return self._map_notice(notice)

    async def add_line(
        self,
        *,
        notice_id: str,
        purchase_contract_id: str | None,
        purchase_contract_no: str | None,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        customs_name: str,
        invoice_name: str,
        quantity: Decimal | str,
        unit: str,
        amount: Decimal | str,
        currency: str,
        remark: str | None,
    ) -> PurchaseInvoiceNoticeLineRow:
        line = PurchaseInvoiceNoticeLine(
            notice_id=notice_id,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_no=purchase_contract_no,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            customs_name=customs_name,
            invoice_name=invoice_name,
            quantity=Decimal(str(quantity)),
            unit=unit,
            amount=Decimal(str(amount)),
            currency=currency,
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def delete_lines(self, notice_id: str) -> None:
        await self.session.execute(
            delete(PurchaseInvoiceNoticeLine).where(
                PurchaseInvoiceNoticeLine.notice_id == notice_id
            )
        )
        await self.session.flush()

    async def refresh_statistics(self, notice_id: str) -> PurchaseInvoiceNoticeRow | None:
        notice = await self._get_notice_model(notice_id)
        if notice is None:
            return None
        lines = list(
            await self.session.scalars(
                select(PurchaseInvoiceNoticeLine).where(
                    PurchaseInvoiceNoticeLine.notice_id == notice_id
                )
            )
        )
        notice.total_quantity = sum((line.quantity for line in lines), Decimal("0"))
        notice.total_amount = sum((line.amount for line in lines), Decimal("0"))
        await self.session.flush()
        return self._map_notice(notice)

    async def get_notice(self, notice_id: str) -> PurchaseInvoiceNoticeRow | None:
        notice = await self._get_notice_model(notice_id)
        if notice is None:
            return None
        return self._map_notice(notice)

    async def list_lines(self, notice_id: str) -> list[PurchaseInvoiceNoticeLineRow]:
        rows = await self.session.scalars(
            select(PurchaseInvoiceNoticeLine)
            .where(PurchaseInvoiceNoticeLine.notice_id == notice_id)
            .order_by(
                PurchaseInvoiceNoticeLine.created_at.asc(),
                PurchaseInvoiceNoticeLine.id.asc(),
            )
        )
        return [self._map_line(row) for row in rows]

    async def send_notice(
        self,
        *,
        notice_id: str,
        sender_name: str,
        sent_at: date,
    ) -> PurchaseInvoiceNoticeRow | None:
        notice = await self._get_notice_model(notice_id)
        if notice is None:
            return None
        notice.status = "sent"
        notice.sender_name = sender_name
        notice.sent_at = sent_at
        await self.session.flush()
        return self._map_notice(notice)

    async def receive_tax_invoice(
        self,
        *,
        notice_id: str,
        tax_invoice_no: str,
        received_at: date,
    ) -> PurchaseInvoiceNoticeRow | None:
        notice = await self._get_notice_model(notice_id)
        if notice is None:
            return None
        notice.status = "received"
        notice.tax_invoice_no = tax_invoice_no
        notice.tax_invoice_received_at = received_at
        await self.session.flush()
        return self._map_notice(notice)

    async def add_reminder(
        self,
        *,
        notice_id: str,
        title: str,
        due_date: date,
        owner_user_id: str,
    ) -> PurchaseInvoiceNoticeReminderRow:
        reminder = PurchaseInvoiceNoticeReminder(
            notice_id=notice_id,
            title=title,
            due_date=due_date,
            owner_user_id=owner_user_id,
        )
        self.session.add(reminder)
        await self.session.flush()
        return self._map_reminder(reminder)

    async def delete_reminders(self, notice_id: str) -> None:
        await self.session.execute(
            delete(PurchaseInvoiceNoticeReminder).where(
                PurchaseInvoiceNoticeReminder.notice_id == notice_id
            )
        )
        await self.session.flush()

    async def close_reminders(self, notice_id: str) -> None:
        rows = await self.session.scalars(
            select(PurchaseInvoiceNoticeReminder).where(
                PurchaseInvoiceNoticeReminder.notice_id == notice_id
            )
        )
        for reminder in rows:
            reminder.status = "done"
        await self.session.flush()

    async def list_reminders(
        self,
        notice_id: str | None = None,
        *,
        owner_user_id: str | None = None,
    ) -> list[PurchaseInvoiceNoticeReminderRow]:
        statement = select(PurchaseInvoiceNoticeReminder)
        if notice_id is not None:
            statement = statement.where(PurchaseInvoiceNoticeReminder.notice_id == notice_id)
        if owner_user_id is not None:
            statement = statement.where(
                PurchaseInvoiceNoticeReminder.owner_user_id == owner_user_id
            )
        statement = statement.order_by(
            PurchaseInvoiceNoticeReminder.due_date.asc(),
            PurchaseInvoiceNoticeReminder.created_at.asc(),
        )
        rows = await self.session.scalars(statement)
        return [self._map_reminder(row) for row in rows]

    async def list_notices(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        supplier_id: str | None = None,
        customs_declaration_id: str | None = None,
        owner_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PurchaseInvoiceNoticeRow], int]:
        statement = select(PurchaseInvoiceNotice)
        count_statement = select(func.count()).select_from(PurchaseInvoiceNotice)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(PurchaseInvoiceNoticeLine.id)
                .where(PurchaseInvoiceNoticeLine.notice_id == PurchaseInvoiceNotice.id)
                .where(
                    or_(
                        PurchaseInvoiceNoticeLine.product_code.ilike(pattern),
                        PurchaseInvoiceNoticeLine.product_name.ilike(pattern),
                        PurchaseInvoiceNoticeLine.customs_name.ilike(pattern),
                        PurchaseInvoiceNoticeLine.invoice_name.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    PurchaseInvoiceNotice.code.ilike(pattern),
                    PurchaseInvoiceNotice.supplier_name.ilike(pattern),
                    PurchaseInvoiceNotice.customs_declaration_no.ilike(pattern),
                    PurchaseInvoiceNotice.remarks.ilike(pattern),
                    line_exists,
                )
            )
        if status:
            conditions.append(PurchaseInvoiceNotice.status == status)
        if supplier_id:
            conditions.append(PurchaseInvoiceNotice.supplier_id == supplier_id)
        if customs_declaration_id:
            conditions.append(
                PurchaseInvoiceNotice.customs_declaration_id == customs_declaration_id
            )
        if owner_user_id:
            conditions.append(PurchaseInvoiceNotice.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                PurchaseInvoiceNotice.notice_date.desc(),
                PurchaseInvoiceNotice.code.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_notice(row) for row in rows], int(total or 0)

    async def _get_notice_model(self, notice_id: str) -> PurchaseInvoiceNotice | None:
        return await self.session.get(PurchaseInvoiceNotice, notice_id)

    async def _scalars(
        self,
        statement: Select[tuple[PurchaseInvoiceNotice]],
    ) -> list[PurchaseInvoiceNotice]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_notice(self, notice: PurchaseInvoiceNotice) -> PurchaseInvoiceNoticeRow:
        return PurchaseInvoiceNoticeRow(
            id=notice.id,
            code=notice.code,
            notice_date=notice.notice_date,
            supplier_id=notice.supplier_id,
            supplier_name=notice.supplier_name,
            customs_declaration_id=notice.customs_declaration_id,
            customs_declaration_no=notice.customs_declaration_no,
            declaration_date=notice.declaration_date,
            currency=notice.currency,
            remarks=notice.remarks,
            status=notice.status,
            sent_at=notice.sent_at,
            sender_name=notice.sender_name,
            tax_invoice_no=notice.tax_invoice_no,
            tax_invoice_received_at=notice.tax_invoice_received_at,
            total_quantity=self._quantity(notice.total_quantity),
            total_amount=self._money(notice.total_amount),
            owner_user_id=notice.owner_user_id,
            created_at=notice.created_at,
        )

    def _map_line(self, line: PurchaseInvoiceNoticeLine) -> PurchaseInvoiceNoticeLineRow:
        return PurchaseInvoiceNoticeLineRow(
            id=line.id,
            notice_id=line.notice_id,
            purchase_contract_id=line.purchase_contract_id,
            purchase_contract_no=line.purchase_contract_no,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            customs_name=line.customs_name,
            invoice_name=line.invoice_name,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            amount=self._money(line.amount),
            currency=line.currency,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _map_reminder(
        self,
        reminder: PurchaseInvoiceNoticeReminder,
    ) -> PurchaseInvoiceNoticeReminderRow:
        return PurchaseInvoiceNoticeReminderRow(
            id=reminder.id,
            notice_id=reminder.notice_id,
            title=reminder.title,
            due_date=reminder.due_date,
            status=reminder.status,
            owner_user_id=reminder.owner_user_id,
            created_at=reminder.created_at,
        )

    def _quantity(self, value: Decimal) -> str:
        if value == 0:
            return "0"
        formatted = format(value.normalize(), "f")
        if "." not in formatted:
            return formatted
        return formatted.rstrip("0").rstrip(".")

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"
