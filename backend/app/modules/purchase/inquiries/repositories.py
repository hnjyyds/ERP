from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import delete, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.purchase.inquiries.models import (
    PurchaseInquiry,
    PurchaseInquiryLine,
    SupplierQuotation,
)
from app.modules.sample.records.models import SampleRecord


@dataclass(frozen=True)
class PurchaseInquiryRow:
    id: str
    code: str
    inquiry_date: date
    buyer_user_id: str | None
    buyer_user_name: str | None
    status: str
    template_name: str | None
    template_sent_at: date | None
    remarks: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseInquiryLineRow:
    id: str
    inquiry_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal
    unit: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseInquiryLineWrite:
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal | str
    unit: str


@dataclass(frozen=True)
class SupplierQuotationRow:
    id: str
    inquiry_id: str
    inquiry_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    supplier_id: str | None
    supplier_name: str
    quoted_at: date
    unit_price: str
    currency: str
    lead_time_days: int | None
    min_order_quantity: str | None
    sample_available: bool
    has_sample: bool
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class SupplierSampleEvidenceRow:
    sample_record_id: str
    sample_code: str
    sample_type: str
    status: str
    supplier_id: str | None
    supplier_name: str | None
    product_id: str | None
    product_code: str | None
    product_name: str
    received_at: date
    quantity: str
    unit: str


@dataclass(frozen=True)
class PurchaseInquiryReferenceRow:
    product_id: str | None
    product_code: str | None
    product_name: str
    supplier_name: str
    reference_price: str
    currency: str
    quote_date: date
    source_inquiry_no: str


class PurchaseInquiryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_inquiry(
        self,
        *,
        code: str,
        inquiry_date: date,
        buyer_user_id: str | None,
        buyer_user_name: str | None,
        status: str,
        remarks: str | None,
        owner_user_id: str,
    ) -> PurchaseInquiryRow:
        inquiry = PurchaseInquiry(
            code=code,
            inquiry_date=inquiry_date,
            buyer_user_id=buyer_user_id,
            buyer_user_name=buyer_user_name,
            status=status,
            remarks=remarks,
            owner_user_id=owner_user_id,
        )
        self.session.add(inquiry)
        await self.session.flush()
        return self._map_inquiry(inquiry)

    async def update_inquiry(
        self,
        *,
        inquiry_id: str,
        code: str,
        inquiry_date: date,
        buyer_user_id: str | None,
        buyer_user_name: str | None,
        remarks: str | None,
    ) -> PurchaseInquiryRow | None:
        inquiry = await self._get_inquiry_model(inquiry_id)
        if inquiry is None:
            return None
        inquiry.code = code
        inquiry.inquiry_date = inquiry_date
        inquiry.buyer_user_id = buyer_user_id
        inquiry.buyer_user_name = buyer_user_name
        inquiry.remarks = remarks
        await self.session.flush()
        return self._map_inquiry(inquiry)

    async def add_line(
        self,
        *,
        inquiry_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        quantity: Decimal | str,
        unit: str,
    ) -> PurchaseInquiryLineRow:
        line = PurchaseInquiryLine(
            inquiry_id=inquiry_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            model=model,
            quantity=Decimal(str(quantity)),
            unit=unit,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def replace_lines(
        self,
        *,
        inquiry_id: str,
        lines: list[PurchaseInquiryLineWrite],
    ) -> list[PurchaseInquiryLineRow]:
        await self.session.execute(
            delete(PurchaseInquiryLine).where(PurchaseInquiryLine.inquiry_id == inquiry_id)
        )
        records = [
            PurchaseInquiryLine(
                inquiry_id=inquiry_id,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                specification=line.specification,
                model=line.model,
                quantity=Decimal(str(line.quantity)),
                unit=line.unit,
            )
            for line in lines
        ]
        self.session.add_all(records)
        await self.session.flush()
        return [self._map_line(line) for line in records]

    async def add_supplier_quotation(
        self,
        *,
        inquiry_id: str,
        inquiry_line_id: str,
        supplier_id: str | None,
        supplier_name: str,
        quoted_at: date,
        unit_price: Decimal | str,
        currency: str,
        lead_time_days: int | None,
        min_order_quantity: Decimal | str | None,
        sample_available: bool,
        remark: str | None,
    ) -> SupplierQuotationRow:
        quotation = SupplierQuotation(
            inquiry_id=inquiry_id,
            inquiry_line_id=inquiry_line_id,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            quoted_at=quoted_at,
            unit_price=Decimal(str(unit_price)),
            currency=currency,
            lead_time_days=lead_time_days,
            min_order_quantity=(
                Decimal(str(min_order_quantity)) if min_order_quantity is not None else None
            ),
            sample_available=sample_available,
            remark=remark,
        )
        self.session.add(quotation)
        await self.session.flush()
        await self.set_status(inquiry_id=inquiry_id, status="quoted")
        row = await self.get_supplier_quotation(quotation.id)
        if row is None:
            raise ValueError("供应商报价不存在")
        return row

    async def get_supplier_quotation(
        self,
        quotation_id: str,
    ) -> SupplierQuotationRow | None:
        statement = (
            select(SupplierQuotation, PurchaseInquiryLine)
            .join(
                PurchaseInquiryLine,
                PurchaseInquiryLine.id == SupplierQuotation.inquiry_line_id,
            )
            .where(SupplierQuotation.id == quotation_id)
        )
        row = (await self.session.execute(statement)).first()
        if row is None:
            return None
        quotation, line = row
        return await self._map_supplier_quotation(quotation, line)

    async def mark_template_sent(
        self,
        *,
        inquiry_id: str,
        template_name: str,
        sent_at: date,
    ) -> PurchaseInquiryRow | None:
        inquiry = await self._get_inquiry_model(inquiry_id)
        if inquiry is None:
            return None
        inquiry.status = "sent"
        inquiry.template_name = template_name
        inquiry.template_sent_at = sent_at
        await self.session.flush()
        return self._map_inquiry(inquiry)

    async def set_status(self, *, inquiry_id: str, status: str) -> PurchaseInquiryRow | None:
        inquiry = await self._get_inquiry_model(inquiry_id)
        if inquiry is None:
            return None
        inquiry.status = status
        await self.session.flush()
        return self._map_inquiry(inquiry)

    async def get_inquiry(self, inquiry_id: str) -> PurchaseInquiryRow | None:
        inquiry = await self._get_inquiry_model(inquiry_id)
        if inquiry is None:
            return None
        return self._map_inquiry(inquiry)

    async def list_lines(self, inquiry_id: str) -> list[PurchaseInquiryLineRow]:
        result = await self.session.scalars(
            select(PurchaseInquiryLine)
            .where(PurchaseInquiryLine.inquiry_id == inquiry_id)
            .order_by(PurchaseInquiryLine.created_at.asc(), PurchaseInquiryLine.id.asc())
        )
        rows = list(result.unique())
        return [self._map_line(row) for row in rows]

    async def list_supplier_quotations(
        self,
        inquiry_id: str,
    ) -> list[SupplierQuotationRow]:
        statement = (
            select(SupplierQuotation, PurchaseInquiryLine)
            .join(
                PurchaseInquiryLine,
                PurchaseInquiryLine.id == SupplierQuotation.inquiry_line_id,
            )
            .where(SupplierQuotation.inquiry_id == inquiry_id)
            .order_by(
                SupplierQuotation.unit_price.asc(),
                SupplierQuotation.quoted_at.desc(),
                SupplierQuotation.supplier_name.asc(),
            )
        )
        rows = (await self.session.execute(statement)).all()
        return [
            await self._map_supplier_quotation(quotation, line)
            for quotation, line in rows
        ]

    async def list_inquiries(
        self,
        *,
        q: str | None,
        status: str | None,
        product_id: str | None,
        supplier_id: str | None,
        owner_user_id: str | None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[PurchaseInquiryRow], int]:
        statement = select(PurchaseInquiry).outerjoin(
            PurchaseInquiryLine,
            PurchaseInquiryLine.inquiry_id == PurchaseInquiry.id,
        )
        count_statement = (
            select(func.count(distinct(PurchaseInquiry.id)))
            .select_from(PurchaseInquiry)
            .outerjoin(
                PurchaseInquiryLine,
                PurchaseInquiryLine.inquiry_id == PurchaseInquiry.id,
            )
        )
        if supplier_id:
            statement = statement.outerjoin(
                SupplierQuotation,
                SupplierQuotation.inquiry_id == PurchaseInquiry.id,
            )
            count_statement = count_statement.outerjoin(
                SupplierQuotation,
                SupplierQuotation.inquiry_id == PurchaseInquiry.id,
            )

        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    PurchaseInquiry.code.ilike(pattern),
                    PurchaseInquiry.remarks.ilike(pattern),
                    PurchaseInquiryLine.product_code.ilike(pattern),
                    PurchaseInquiryLine.product_name.ilike(pattern),
                )
            )
        if status:
            conditions.append(PurchaseInquiry.status == status)
        if product_id:
            conditions.append(PurchaseInquiryLine.product_id == product_id)
        if supplier_id:
            conditions.append(SupplierQuotation.supplier_id == supplier_id)
        if owner_user_id:
            conditions.append(PurchaseInquiry.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(PurchaseInquiry.inquiry_date.desc(), PurchaseInquiry.code.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.scalars(statement)
        rows = list(result.unique())
        total = await self.session.scalar(count_statement)
        return [self._map_inquiry(row) for row in rows], int(total or 0)

    async def list_supplier_sample_evidence(
        self,
        *,
        product_id: str | None,
        supplier_id: str | None,
    ) -> list[SupplierSampleEvidenceRow]:
        statement = select(SampleRecord).where(SampleRecord.supplier_id.is_not(None))
        if product_id:
            statement = statement.where(SampleRecord.product_id == product_id)
        if supplier_id:
            statement = statement.where(SampleRecord.supplier_id == supplier_id)
        statement = statement.order_by(SampleRecord.received_at.desc(), SampleRecord.code.asc())
        result = await self.session.scalars(statement)
        rows = list(result.unique())
        return [self._map_sample(row) for row in rows]

    async def list_purchase_references(
        self,
        *,
        product_id: str | None,
    ) -> list[PurchaseInquiryReferenceRow]:
        statement = (
            select(PurchaseInquiry, PurchaseInquiryLine, SupplierQuotation)
            .join(PurchaseInquiryLine, PurchaseInquiryLine.inquiry_id == PurchaseInquiry.id)
            .join(SupplierQuotation, SupplierQuotation.inquiry_line_id == PurchaseInquiryLine.id)
            .order_by(
                SupplierQuotation.quoted_at.desc(),
                SupplierQuotation.unit_price.asc(),
                SupplierQuotation.supplier_name.asc(),
            )
        )
        if product_id:
            statement = statement.where(PurchaseInquiryLine.product_id == product_id)
        rows = (await self.session.execute(statement)).all()
        return [
            PurchaseInquiryReferenceRow(
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                supplier_name=quotation.supplier_name,
                reference_price=self._quantity(quotation.unit_price),
                currency=quotation.currency,
                quote_date=quotation.quoted_at,
                source_inquiry_no=inquiry.code,
            )
            for inquiry, line, quotation in rows
        ]

    async def _get_inquiry_model(self, inquiry_id: str) -> PurchaseInquiry | None:
        return await self.session.get(PurchaseInquiry, inquiry_id)

    async def _map_supplier_quotation(
        self,
        quotation: SupplierQuotation,
        line: PurchaseInquiryLine,
    ) -> SupplierQuotationRow:
        has_sample = quotation.sample_available or await self._has_supplier_sample(
            product_id=line.product_id,
            supplier_id=quotation.supplier_id,
        )
        return SupplierQuotationRow(
            id=quotation.id,
            inquiry_id=quotation.inquiry_id,
            inquiry_line_id=quotation.inquiry_line_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            supplier_id=quotation.supplier_id,
            supplier_name=quotation.supplier_name,
            quoted_at=quotation.quoted_at,
            unit_price=self._quantity(quotation.unit_price),
            currency=quotation.currency,
            lead_time_days=quotation.lead_time_days,
            min_order_quantity=(
                self._quantity(quotation.min_order_quantity)
                if quotation.min_order_quantity is not None
                else None
            ),
            sample_available=quotation.sample_available,
            has_sample=has_sample,
            remark=quotation.remark,
            created_at=quotation.created_at,
        )

    async def _has_supplier_sample(
        self,
        *,
        product_id: str | None,
        supplier_id: str | None,
    ) -> bool:
        if not product_id or not supplier_id:
            return False
        count = await self.session.scalar(
            select(func.count())
            .select_from(SampleRecord)
            .where(SampleRecord.product_id == product_id)
            .where(SampleRecord.supplier_id == supplier_id)
        )
        return bool(count)

    def _map_inquiry(self, inquiry: PurchaseInquiry) -> PurchaseInquiryRow:
        return PurchaseInquiryRow(
            id=inquiry.id,
            code=inquiry.code,
            inquiry_date=inquiry.inquiry_date,
            buyer_user_id=inquiry.buyer_user_id,
            buyer_user_name=inquiry.buyer_user_name,
            status=inquiry.status,
            template_name=inquiry.template_name,
            template_sent_at=inquiry.template_sent_at,
            remarks=inquiry.remarks,
            owner_user_id=inquiry.owner_user_id,
            created_at=inquiry.created_at,
        )

    def _map_line(self, line: PurchaseInquiryLine) -> PurchaseInquiryLineRow:
        return PurchaseInquiryLineRow(
            id=line.id,
            inquiry_id=line.inquiry_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=line.quantity,
            unit=line.unit,
            created_at=line.created_at,
        )

    def _map_sample(self, sample: SampleRecord) -> SupplierSampleEvidenceRow:
        return SupplierSampleEvidenceRow(
            sample_record_id=sample.id,
            sample_code=sample.code,
            sample_type=sample.sample_type,
            status=sample.status,
            supplier_id=sample.supplier_id,
            supplier_name=sample.supplier_name,
            product_id=sample.product_id,
            product_code=sample.product_code,
            product_name=sample.product_name,
            received_at=sample.received_at,
            quantity=self._quantity(sample.quantity),
            unit=sample.unit,
        )

    def _quantity(self, value: Decimal) -> str:
        return format(value.quantize(Decimal("0.0001")).normalize(), "f")
