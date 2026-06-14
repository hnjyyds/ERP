from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Select, delete, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sales.quotations.models import ExportQuotation, ExportQuotationLine


@dataclass(frozen=True)
class ExportQuotationRow:
    id: str
    code: str
    quote_date: date
    customer_id: str | None
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    trade_term: str
    valid_until: date | None
    description: str | None
    total_amount: str
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    confirmed_at: date | None
    generated_contract_id: str | None
    generated_contract_no: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class ExportQuotationLineRow:
    id: str
    quotation_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal
    unit: str
    unit_price: Decimal
    amount: str
    freight_method: str
    freight_amount: str
    purchase_reference_supplier_name: str | None
    purchase_reference_price: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ExportQuotationPurchaseReferenceRow:
    product_id: str | None
    product_code: str | None
    product_name: str
    supplier_name: str
    reference_price: str
    currency: str
    quote_date: date
    source_quotation_no: str


class ExportQuotationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_quotation(
        self,
        *,
        code: str,
        quote_date: date,
        customer_id: str | None,
        customer_name: str,
        sales_user_id: str | None,
        sales_user_name: str | None,
        currency: str,
        trade_term: str,
        valid_until: date | None,
        description: str | None,
        approval_status: str,
        owner_user_id: str,
    ) -> ExportQuotationRow:
        quotation = ExportQuotation(
            code=code,
            quote_date=quote_date,
            customer_id=customer_id,
            customer_name=customer_name,
            sales_user_id=sales_user_id,
            sales_user_name=sales_user_name,
            currency=currency,
            trade_term=trade_term,
            valid_until=valid_until,
            description=description,
            approval_status=approval_status,
            owner_user_id=owner_user_id,
        )
        self.session.add(quotation)
        await self.session.flush()
        return self._map_quotation(quotation)

    async def update_quotation(
        self,
        *,
        quotation_id: str,
        code: str,
        quote_date: date,
        customer_id: str | None,
        customer_name: str,
        sales_user_id: str | None,
        sales_user_name: str | None,
        currency: str,
        trade_term: str,
        valid_until: date | None,
        description: str | None,
    ) -> ExportQuotationRow | None:
        quotation = await self.session.scalar(
            select(ExportQuotation).where(ExportQuotation.id == quotation_id)
        )
        if quotation is None:
            return None
        quotation.code = code
        quotation.quote_date = quote_date
        quotation.customer_id = customer_id
        quotation.customer_name = customer_name
        quotation.sales_user_id = sales_user_id
        quotation.sales_user_name = sales_user_name
        quotation.currency = currency
        quotation.trade_term = trade_term
        quotation.valid_until = valid_until
        quotation.description = description
        await self.session.flush()
        return self._map_quotation(quotation)

    async def set_total_amount(
        self,
        *,
        quotation_id: str,
        total_amount: Decimal | str,
    ) -> ExportQuotationRow | None:
        quotation = await self.session.scalar(
            select(ExportQuotation).where(ExportQuotation.id == quotation_id)
        )
        if quotation is None:
            return None
        quotation.total_amount = Decimal(str(total_amount))
        await self.session.flush()
        return self._map_quotation(quotation)

    async def add_line(
        self,
        *,
        quotation_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        specification: str | None,
        model: str | None,
        quantity: Decimal | str,
        unit: str,
        unit_price: Decimal | str,
        amount: Decimal | str,
        freight_method: str,
        freight_amount: Decimal | str,
        purchase_reference_supplier_name: str | None,
        purchase_reference_price: Decimal | str | None,
        remark: str | None,
    ) -> ExportQuotationLineRow:
        line = ExportQuotationLine(
            quotation_id=quotation_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            specification=specification,
            model=model,
            quantity=Decimal(str(quantity)),
            unit=unit,
            unit_price=Decimal(str(unit_price)),
            amount=Decimal(str(amount)),
            freight_method=freight_method,
            freight_amount=Decimal(str(freight_amount)),
            purchase_reference_supplier_name=purchase_reference_supplier_name,
            purchase_reference_price=(
                Decimal(str(purchase_reference_price))
                if purchase_reference_price is not None
                else None
            ),
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def delete_lines(self, quotation_id: str) -> None:
        await self.session.execute(
            delete(ExportQuotationLine).where(ExportQuotationLine.quotation_id == quotation_id)
        )
        await self.session.flush()

    async def get_quotation(self, quotation_id: str) -> ExportQuotationRow | None:
        quotation = await self.session.scalar(
            select(ExportQuotation).where(ExportQuotation.id == quotation_id)
        )
        if quotation is None:
            return None
        return self._map_quotation(quotation)

    async def list_lines(self, quotation_id: str) -> list[ExportQuotationLineRow]:
        rows = await self.session.scalars(
            select(ExportQuotationLine)
            .where(ExportQuotationLine.quotation_id == quotation_id)
            .order_by(ExportQuotationLine.created_at.asc())
        )
        return [self._map_line(row) for row in rows]

    async def list_quotations(
        self,
        *,
        q: str | None = None,
        approval_status: str | None = None,
        customer_id: str | None = None,
        owner_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ExportQuotationRow], int]:
        statement = select(ExportQuotation)
        count_statement = select(func.count()).select_from(ExportQuotation)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(ExportQuotationLine.id)
                .where(ExportQuotationLine.quotation_id == ExportQuotation.id)
                .where(
                    or_(
                        ExportQuotationLine.product_code.ilike(pattern),
                        ExportQuotationLine.product_name.ilike(pattern),
                        ExportQuotationLine.specification.ilike(pattern),
                        ExportQuotationLine.model.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    ExportQuotation.code.ilike(pattern),
                    ExportQuotation.customer_name.ilike(pattern),
                    ExportQuotation.trade_term.ilike(pattern),
                    line_exists,
                )
            )
        if approval_status:
            conditions.append(ExportQuotation.approval_status == approval_status)
        if customer_id:
            conditions.append(ExportQuotation.customer_id == customer_id)
        if owner_user_id:
            conditions.append(ExportQuotation.owner_user_id == owner_user_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(ExportQuotation.quote_date.desc(), ExportQuotation.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_quotation(row) for row in rows], int(total or 0)

    async def submit_quotation(self, quotation_id: str) -> ExportQuotationRow | None:
        quotation = await self.session.scalar(
            select(ExportQuotation).where(ExportQuotation.id == quotation_id)
        )
        if quotation is None:
            return None
        quotation.approval_status = "submitted"
        quotation.submitted_at = quotation.quote_date
        await self.session.flush()
        return self._map_quotation(quotation)

    async def approve_quotation(
        self,
        *,
        quotation_id: str,
        reviewer_name: str,
        approved_at: date,
    ) -> ExportQuotationRow | None:
        quotation = await self.session.scalar(
            select(ExportQuotation).where(ExportQuotation.id == quotation_id)
        )
        if quotation is None:
            return None
        quotation.approval_status = "approved"
        quotation.reviewer_name = reviewer_name
        quotation.approved_at = approved_at
        await self.session.flush()
        return self._map_quotation(quotation)

    async def confirm_contract(
        self,
        *,
        quotation_id: str,
        confirmed_at: date,
        contract_no: str,
        contract_id: str | None = None,
    ) -> ExportQuotationRow | None:
        quotation = await self.session.scalar(
            select(ExportQuotation).where(ExportQuotation.id == quotation_id)
        )
        if quotation is None:
            return None
        quotation.approval_status = "contract_generated"
        quotation.confirmed_at = confirmed_at
        quotation.generated_contract_id = contract_id or str(uuid4())
        quotation.generated_contract_no = contract_no
        await self.session.flush()
        return self._map_quotation(quotation)

    async def list_history(
        self,
        *,
        customer_id: str | None,
        product_id: str | None,
    ) -> tuple[list[ExportQuotationRow], int]:
        statement = (
            select(ExportQuotation)
            .join(ExportQuotationLine, ExportQuotationLine.quotation_id == ExportQuotation.id)
            .where(ExportQuotation.approval_status.in_(("approved", "contract_generated")))
        )
        count_statement = (
            select(func.count(distinct(ExportQuotation.id)))
            .select_from(ExportQuotation)
            .join(ExportQuotationLine, ExportQuotationLine.quotation_id == ExportQuotation.id)
            .where(ExportQuotation.approval_status.in_(("approved", "contract_generated")))
        )
        if customer_id:
            statement = statement.where(ExportQuotation.customer_id == customer_id)
            count_statement = count_statement.where(ExportQuotation.customer_id == customer_id)
        if product_id:
            statement = statement.where(ExportQuotationLine.product_id == product_id)
            count_statement = count_statement.where(ExportQuotationLine.product_id == product_id)
        statement = statement.order_by(
            ExportQuotation.quote_date.desc(),
            ExportQuotation.code.asc(),
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_quotation(row) for row in rows], int(total or 0)

    async def list_purchase_references(
        self,
        *,
        product_id: str | None,
    ) -> list[ExportQuotationPurchaseReferenceRow]:
        statement = (
            select(ExportQuotation, ExportQuotationLine)
            .join(ExportQuotationLine, ExportQuotationLine.quotation_id == ExportQuotation.id)
            .where(ExportQuotationLine.purchase_reference_price.is_not(None))
            .where(ExportQuotationLine.purchase_reference_supplier_name.is_not(None))
            .order_by(ExportQuotation.quote_date.desc(), ExportQuotation.code.asc())
        )
        if product_id:
            statement = statement.where(ExportQuotationLine.product_id == product_id)
        rows = await self.session.execute(statement)
        return [
            ExportQuotationPurchaseReferenceRow(
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                supplier_name=line.purchase_reference_supplier_name or "",
                reference_price=self._quantity(line.purchase_reference_price or Decimal("0")),
                currency=quotation.currency,
                quote_date=quotation.quote_date,
                source_quotation_no=quotation.code,
            )
            for quotation, line in rows
        ]

    async def _scalars(self, statement: Select[tuple[ExportQuotation]]) -> list[ExportQuotation]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_quotation(self, quotation: ExportQuotation) -> ExportQuotationRow:
        return ExportQuotationRow(
            id=quotation.id,
            code=quotation.code,
            quote_date=quotation.quote_date,
            customer_id=quotation.customer_id,
            customer_name=quotation.customer_name,
            sales_user_id=quotation.sales_user_id,
            sales_user_name=quotation.sales_user_name,
            currency=quotation.currency,
            trade_term=quotation.trade_term,
            valid_until=quotation.valid_until,
            description=quotation.description,
            total_amount=self._money(quotation.total_amount),
            approval_status=quotation.approval_status,
            submitted_at=quotation.submitted_at,
            approved_at=quotation.approved_at,
            reviewer_name=quotation.reviewer_name,
            confirmed_at=quotation.confirmed_at,
            generated_contract_id=quotation.generated_contract_id,
            generated_contract_no=quotation.generated_contract_no,
            owner_user_id=quotation.owner_user_id,
            created_at=quotation.created_at,
        )

    def _map_line(self, line: ExportQuotationLine) -> ExportQuotationLineRow:
        return ExportQuotationLineRow(
            id=line.id,
            quotation_id=line.quotation_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=line.quantity,
            unit=line.unit,
            unit_price=line.unit_price,
            amount=self._money(line.amount),
            freight_method=line.freight_method,
            freight_amount=self._money(line.freight_amount),
            purchase_reference_supplier_name=line.purchase_reference_supplier_name,
            purchase_reference_price=(
                self._quantity(line.purchase_reference_price)
                if line.purchase_reference_price is not None
                else None
            ),
            remark=line.remark,
            created_at=line.created_at,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
