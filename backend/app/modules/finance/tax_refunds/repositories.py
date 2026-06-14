from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.tax_refunds.models import (
    VerificationDocument,
    VerificationTaxRefund,
)
from app.modules.sales.shipments.models import ShipmentPlan


@dataclass(frozen=True)
class VerificationDocumentRow:
    id: str
    document_no: str
    received_at: date
    owner_user_id: str | None
    owner_user_name: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    customer_name: str | None
    currency: str
    refundable_amount: str
    refunded_amount: str
    unrefunded_amount: str
    valid_until: date
    reminder_date: date
    reminder_status: str
    reminder_message: str
    status: str
    customs_declaration_no: str | None
    customs_receipt_no: str | None
    customs_receipt_at: date | None
    verification_no: str | None
    verified_at: date | None
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime


@dataclass(frozen=True)
class VerificationTaxRefundRow:
    id: str
    verification_document_id: str
    refund_no: str
    refunded_at: date
    amount: str
    currency: str
    bank_receipt_no: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class VerificationUsageRow:
    verification_document_id: str
    document_no: str
    shipment_plan_id: str | None
    shipment_no: str | None
    owner_user_id: str | None
    owner_user_name: str | None
    customer_name: str | None
    currency: str
    refundable_amount: str
    refunded_amount: str
    unrefunded_amount: str
    valid_until: date
    reminder_date: date
    reminder_status: str
    status: str
    customs_receipt_no: str | None
    verification_no: str | None


class TaxRefundRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_document(
        self,
        *,
        document_no: str,
        received_at: date,
        owner_user_id: str | None,
        owner_user_name: str | None,
        shipment_plan_id: str | None,
        shipment_no: str | None,
        customer_name: str | None,
        currency: str,
        refundable_amount: Decimal | str,
        valid_until: date,
        remark: str | None,
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> VerificationDocumentRow:
        reminder_date = valid_until - timedelta(days=7)
        document = VerificationDocument(
            document_no=document_no,
            received_at=received_at,
            owner_user_id=owner_user_id,
            owner_user_name=owner_user_name,
            shipment_plan_id=shipment_plan_id,
            shipment_no=shipment_no,
            customer_name=customer_name,
            currency=currency,
            refundable_amount=Decimal(str(refundable_amount)),
            refunded_amount=Decimal("0"),
            valid_until=valid_until,
            reminder_date=reminder_date,
            reminder_status="pending",
            reminder_message=f"核销单 {document_no} 将于 {valid_until.isoformat()} 到期",
            status="issued",
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(document)
        await self.session.flush()
        return self._map_document(document)

    async def get_document(self, document_id: str) -> VerificationDocumentRow | None:
        document = await self.session.get(VerificationDocument, document_id)
        if document is None:
            return None
        return self._map_document(document)

    async def list_documents(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        owner_user_id: str | None = None,
        shipment_no: str | None = None,
        reminder_status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[VerificationDocumentRow], int]:
        statement = select(VerificationDocument)
        count_statement = select(func.count()).select_from(VerificationDocument)
        conditions = self._document_conditions(
            q=q,
            status=status,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                VerificationDocument.received_at.desc(),
                VerificationDocument.document_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._document_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_document(row) for row in rows], int(total or 0)

    async def register_customs_receipt(
        self,
        *,
        document_id: str,
        customs_declaration_no: str,
        customs_receipt_no: str,
        received_at: date,
        remark: str | None,
    ) -> VerificationDocumentRow | None:
        document = await self.session.get(VerificationDocument, document_id)
        if document is None:
            return None
        document.customs_declaration_no = customs_declaration_no
        document.customs_receipt_no = customs_receipt_no
        document.customs_receipt_at = received_at
        document.status = "customs_receipt_registered"
        if remark is not None:
            document.remark = remark
        await self.session.flush()
        return self._map_document(document)

    async def register_verification(
        self,
        *,
        document_id: str,
        verification_no: str,
        verified_at: date,
        remark: str | None,
    ) -> VerificationDocumentRow | None:
        document = await self.session.get(VerificationDocument, document_id)
        if document is None:
            return None
        document.verification_no = verification_no
        document.verified_at = verified_at
        document.status = "verified"
        document.reminder_status = "done"
        if remark is not None:
            document.remark = remark
        await self.session.flush()
        return self._map_document(document)

    async def add_tax_refund(
        self,
        *,
        document_id: str,
        refund_no: str,
        refunded_at: date,
        amount: Decimal | str,
        currency: str,
        bank_receipt_no: str | None,
        remark: str | None,
    ) -> VerificationTaxRefundRow:
        refund = VerificationTaxRefund(
            verification_document_id=document_id,
            refund_no=refund_no,
            refunded_at=refunded_at,
            amount=Decimal(str(amount)),
            currency=currency,
            bank_receipt_no=bank_receipt_no,
            remark=remark,
        )
        self.session.add(refund)
        await self.session.flush()
        return self._map_refund(refund)

    async def refresh_refund_status(self, document_id: str) -> VerificationDocumentRow | None:
        document = await self.session.get(VerificationDocument, document_id)
        if document is None:
            return None
        refunded_amount = await self.session.scalar(
            select(func.sum(VerificationTaxRefund.amount)).where(
                VerificationTaxRefund.verification_document_id == document_id
            )
        )
        document.refunded_amount = Decimal(str(refunded_amount or 0))
        if document.refunded_amount >= document.refundable_amount:
            document.status = "refunded"
        elif document.status == "refunded":
            document.status = "verified"
        await self.session.flush()
        return self._map_document(document)

    async def add_refund_to_shipment_profit(
        self,
        *,
        shipment_plan_id: str,
        amount: Decimal | str,
    ) -> None:
        shipment = await self.session.get(ShipmentPlan, shipment_plan_id)
        if shipment is None:
            return
        shipment.profit_amount += Decimal(str(amount))
        if shipment.receivable_amount == 0:
            shipment.profit_rate = Decimal("0")
        else:
            shipment.profit_rate = (
                shipment.profit_amount / shipment.receivable_amount
            ) * Decimal("100")
        await self.session.flush()

    async def list_refunds(self, document_id: str) -> list[VerificationTaxRefundRow]:
        rows = await self.session.scalars(
            select(VerificationTaxRefund)
            .where(VerificationTaxRefund.verification_document_id == document_id)
            .order_by(
                VerificationTaxRefund.refunded_at.asc(),
                VerificationTaxRefund.refund_no.asc(),
            )
        )
        return [self._map_refund(row) for row in rows]

    async def list_usage(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        owner_user_id: str | None = None,
        shipment_no: str | None = None,
        reminder_status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[VerificationUsageRow], int]:
        documents, total = await self.list_documents(
            q=q,
            status=status,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
            limit=limit,
            offset=offset,
        )
        return [self._usage_row(row) for row in documents], total

    def _document_conditions(
        self,
        *,
        q: str | None,
        status: str | None,
        owner_user_id: str | None,
        shipment_no: str | None,
        reminder_status: str | None,
    ) -> list[object]:
        conditions: list[object] = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    VerificationDocument.document_no.ilike(pattern),
                    VerificationDocument.shipment_no.ilike(pattern),
                    VerificationDocument.customer_name.ilike(pattern),
                    VerificationDocument.customs_declaration_no.ilike(pattern),
                    VerificationDocument.customs_receipt_no.ilike(pattern),
                    VerificationDocument.verification_no.ilike(pattern),
                )
            )
        if status:
            conditions.append(VerificationDocument.status == status)
        if owner_user_id:
            conditions.append(VerificationDocument.owner_user_id == owner_user_id)
        if shipment_no:
            conditions.append(VerificationDocument.shipment_no == shipment_no)
        if reminder_status:
            conditions.append(VerificationDocument.reminder_status == reminder_status)
        return conditions

    async def _document_scalars(
        self,
        statement: Select[tuple[VerificationDocument]],
    ) -> list[VerificationDocument]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_document(self, document: VerificationDocument) -> VerificationDocumentRow:
        refundable_amount = self._decimal(document.refundable_amount)
        refunded_amount = self._decimal(document.refunded_amount)
        return VerificationDocumentRow(
            id=document.id,
            document_no=document.document_no,
            received_at=document.received_at,
            owner_user_id=document.owner_user_id,
            owner_user_name=document.owner_user_name,
            shipment_plan_id=document.shipment_plan_id,
            shipment_no=document.shipment_no,
            customer_name=document.customer_name,
            currency=document.currency,
            refundable_amount=self._money(refundable_amount),
            refunded_amount=self._money(refunded_amount),
            unrefunded_amount=self._money(refundable_amount - refunded_amount),
            valid_until=document.valid_until,
            reminder_date=document.reminder_date,
            reminder_status=document.reminder_status,
            reminder_message=document.reminder_message,
            status=document.status,
            customs_declaration_no=document.customs_declaration_no,
            customs_receipt_no=document.customs_receipt_no,
            customs_receipt_at=document.customs_receipt_at,
            verification_no=document.verification_no,
            verified_at=document.verified_at,
            remark=document.remark,
            created_by_user_id=document.created_by_user_id,
            created_by_user_name=document.created_by_user_name,
            created_at=document.created_at,
        )

    def _map_refund(self, refund: VerificationTaxRefund) -> VerificationTaxRefundRow:
        return VerificationTaxRefundRow(
            id=refund.id,
            verification_document_id=refund.verification_document_id,
            refund_no=refund.refund_no,
            refunded_at=refund.refunded_at,
            amount=self._money(refund.amount),
            currency=refund.currency,
            bank_receipt_no=refund.bank_receipt_no,
            remark=refund.remark,
            created_at=refund.created_at,
        )

    def _usage_row(self, document: VerificationDocumentRow) -> VerificationUsageRow:
        return VerificationUsageRow(
            verification_document_id=document.id,
            document_no=document.document_no,
            shipment_plan_id=document.shipment_plan_id,
            shipment_no=document.shipment_no,
            owner_user_id=document.owner_user_id,
            owner_user_name=document.owner_user_name,
            customer_name=document.customer_name,
            currency=document.currency,
            refundable_amount=document.refundable_amount,
            refunded_amount=document.refunded_amount,
            unrefunded_amount=document.unrefunded_amount,
            valid_until=document.valid_until,
            reminder_date=document.reminder_date,
            reminder_status=document.reminder_status,
            status=document.status,
            customs_receipt_no=document.customs_receipt_no,
            verification_no=document.verification_no,
        )

    def _money(self, value: Decimal | int | str) -> str:
        return f"{self._decimal(value):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
