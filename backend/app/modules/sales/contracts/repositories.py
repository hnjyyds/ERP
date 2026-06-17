from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sales.contracts.models import (
    ExportContract,
    ExportContractAdvancePayment,
    ExportContractEvent,
    ExportContractLine,
    ExportContractSignature,
)


@dataclass(frozen=True)
class ExportContractRow:
    id: str
    code: str
    contract_date: date
    customer_id: str | None
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    trade_term: str
    planned_ship_date: date
    payment_terms: str
    source_quotation_id: str | None
    source_quotation_no: str | None
    remarks: str | None
    total_quantity: str
    total_amount: str
    shipped_quantity: str
    shipped_amount: str
    unshipped_quantity: str
    unshipped_amount: str
    purchased_quantity: str
    unpurchased_quantity: str
    advance_payment_amount: str
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    signature_status: str
    customer_signed_at: date | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class ExportContractLineRow:
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
    purchased_quantity: Decimal
    unpurchased_quantity: str
    shipped_quantity: Decimal
    unshipped_quantity: str
    shipped_amount: str
    unshipped_amount: str
    image_url: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ExportContractSignatureRow:
    id: str
    contract_id: str
    signed_by: str
    signed_at: date
    signature_method: str
    file_no: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ExportContractAdvancePaymentRow:
    id: str
    contract_id: str
    payment_no: str
    received_at: date
    amount: str
    currency: str
    payer_name: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ExportContractEventRow:
    id: str
    contract_id: str
    contract_no: str
    event_type: str
    payload: str
    created_at: datetime


class ExportContractRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_contract(
        self,
        *,
        code: str,
        contract_date: date,
        customer_id: str | None,
        customer_name: str,
        sales_user_id: str | None,
        sales_user_name: str | None,
        currency: str,
        trade_term: str,
        planned_ship_date: date,
        payment_terms: str,
        source_quotation_id: str | None,
        source_quotation_no: str | None,
        remarks: str | None,
        approval_status: str,
        owner_user_id: str,
    ) -> ExportContractRow:
        contract = ExportContract(
            code=code,
            contract_date=contract_date,
            customer_id=customer_id,
            customer_name=customer_name,
            sales_user_id=sales_user_id,
            sales_user_name=sales_user_name,
            currency=currency,
            trade_term=trade_term,
            planned_ship_date=planned_ship_date,
            payment_terms=payment_terms,
            source_quotation_id=source_quotation_id,
            source_quotation_no=source_quotation_no,
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
        customer_id: str | None,
        customer_name: str,
        sales_user_id: str | None,
        sales_user_name: str | None,
        currency: str,
        trade_term: str,
        planned_ship_date: date,
        payment_terms: str,
        source_quotation_id: str | None,
        source_quotation_no: str | None,
        remarks: str | None,
    ) -> ExportContractRow | None:
        contract = await self.session.scalar(
            select(ExportContract).where(ExportContract.id == contract_id)
        )
        if contract is None:
            return None
        contract.code = code
        contract.contract_date = contract_date
        contract.customer_id = customer_id
        contract.customer_name = customer_name
        contract.sales_user_id = sales_user_id
        contract.sales_user_name = sales_user_name
        contract.currency = currency
        contract.trade_term = trade_term
        contract.planned_ship_date = planned_ship_date
        contract.payment_terms = payment_terms
        contract.source_quotation_id = source_quotation_id
        contract.source_quotation_no = source_quotation_no
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
        purchased_quantity: Decimal | str,
        shipped_quantity: Decimal | str,
        image_url: str | None,
        remark: str | None,
    ) -> ExportContractLineRow:
        line = ExportContractLine(
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
            purchased_quantity=Decimal(str(purchased_quantity)),
            shipped_quantity=Decimal(str(shipped_quantity)),
            image_url=image_url,
            remark=remark,
        )
        self.session.add(line)
        await self.session.flush()
        return self._map_line(line)

    async def delete_lines(self, contract_id: str) -> None:
        await self.session.execute(
            delete(ExportContractLine).where(ExportContractLine.contract_id == contract_id)
        )
        await self.session.flush()

    async def refresh_statistics(self, contract_id: str) -> ExportContractRow | None:
        contract = await self.session.scalar(
            select(ExportContract).where(ExportContract.id == contract_id)
        )
        if contract is None:
            return None
        lines = list(
            await self.session.scalars(
                select(ExportContractLine).where(ExportContractLine.contract_id == contract_id)
            )
        )
        total_quantity = Decimal("0")
        total_amount = Decimal("0")
        shipped_quantity = Decimal("0")
        shipped_amount = Decimal("0")
        purchased_quantity = Decimal("0")
        for line in lines:
            total_quantity += line.quantity
            total_amount += line.amount
            shipped_quantity += line.shipped_quantity
            shipped_amount += line.shipped_quantity * line.unit_price
            purchased_quantity += line.purchased_quantity
        advance_payment_amount = await self.session.scalar(
            select(func.sum(ExportContractAdvancePayment.amount)).where(
                ExportContractAdvancePayment.contract_id == contract_id
            )
        )
        contract.total_quantity = total_quantity
        contract.total_amount = total_amount
        contract.shipped_quantity = shipped_quantity
        contract.shipped_amount = shipped_amount
        contract.purchased_quantity = purchased_quantity
        contract.advance_payment_amount = Decimal(str(advance_payment_amount or 0))
        await self.session.flush()
        return self._map_contract(contract)

    async def get_contract(self, contract_id: str) -> ExportContractRow | None:
        contract = await self.session.scalar(
            select(ExportContract).where(ExportContract.id == contract_id)
        )
        if contract is None:
            return None
        return self._map_contract(contract)

    async def list_lines(self, contract_id: str) -> list[ExportContractLineRow]:
        rows = await self.session.scalars(
            select(ExportContractLine)
            .where(ExportContractLine.contract_id == contract_id)
            .order_by(ExportContractLine.created_at.asc())
        )
        return [self._map_line(row) for row in rows]

    async def increase_line_shipped_quantity(
        self,
        *,
        line_id: str,
        quantity: Decimal | str,
    ) -> ExportContractLineRow | None:
        line = await self.session.scalar(
            select(ExportContractLine).where(ExportContractLine.id == line_id)
        )
        if line is None:
            return None
        line.shipped_quantity += Decimal(str(quantity))
        await self.session.flush()
        return self._map_line(line)

    async def increase_line_purchased_quantity(
        self,
        *,
        line_id: str,
        quantity: Decimal | str,
    ) -> ExportContractLineRow | None:
        line = await self.session.scalar(
            select(ExportContractLine).where(ExportContractLine.id == line_id)
        )
        if line is None:
            return None
        line.purchased_quantity += Decimal(str(quantity))
        await self.session.flush()
        return self._map_line(line)

    async def list_contracts(
        self,
        *,
        q: str | None = None,
        approval_status: str | None = None,
        customer_id: str | None = None,
        owner_user_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ExportContractRow], int]:
        statement = select(ExportContract)
        count_statement = select(func.count()).select_from(ExportContract)
        conditions = []
        if q:
            pattern = f"%{q}%"
            line_exists = (
                select(ExportContractLine.id)
                .where(ExportContractLine.contract_id == ExportContract.id)
                .where(
                    or_(
                        ExportContractLine.product_code.ilike(pattern),
                        ExportContractLine.product_name.ilike(pattern),
                        ExportContractLine.specification.ilike(pattern),
                        ExportContractLine.model.ilike(pattern),
                    )
                )
                .exists()
            )
            conditions.append(
                or_(
                    ExportContract.code.ilike(pattern),
                    ExportContract.customer_name.ilike(pattern),
                    ExportContract.trade_term.ilike(pattern),
                    ExportContract.source_quotation_no.ilike(pattern),
                    line_exists,
                )
            )
        if approval_status:
            conditions.append(ExportContract.approval_status == approval_status)
        if customer_id:
            conditions.append(ExportContract.customer_id == customer_id)
        if owner_user_ids is not None:
            conditions.append(ExportContract.owner_user_id.in_(owner_user_ids))
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(ExportContract.contract_date.desc(), ExportContract.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_contract(row) for row in rows], int(total or 0)

    async def submit_contract(self, contract_id: str) -> ExportContractRow | None:
        contract = await self.session.scalar(
            select(ExportContract).where(ExportContract.id == contract_id)
        )
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
    ) -> ExportContractRow | None:
        contract = await self.session.scalar(
            select(ExportContract).where(ExportContract.id == contract_id)
        )
        if contract is None:
            return None
        contract.approval_status = "approved"
        contract.reviewer_name = reviewer_name
        contract.approved_at = approved_at
        await self.session.flush()
        return self._map_contract(contract)

    async def add_signature(
        self,
        *,
        contract_id: str,
        signed_by: str,
        signed_at: date,
        signature_method: str,
        file_no: str | None,
        remark: str | None,
    ) -> ExportContractSignatureRow:
        signature = ExportContractSignature(
            contract_id=contract_id,
            signed_by=signed_by,
            signed_at=signed_at,
            signature_method=signature_method,
            file_no=file_no,
            remark=remark,
        )
        self.session.add(signature)
        contract = await self.session.scalar(
            select(ExportContract).where(ExportContract.id == contract_id)
        )
        if contract is not None:
            contract.signature_status = "signed"
            contract.customer_signed_at = signed_at
        await self.session.flush()
        return self._map_signature(signature)

    async def list_signatures(self, contract_id: str) -> list[ExportContractSignatureRow]:
        rows = await self.session.scalars(
            select(ExportContractSignature)
            .where(ExportContractSignature.contract_id == contract_id)
            .order_by(
                ExportContractSignature.signed_at.desc(),
                ExportContractSignature.created_at.desc(),
            )
        )
        return [self._map_signature(row) for row in rows]

    async def add_advance_payment(
        self,
        *,
        contract_id: str,
        payment_no: str,
        received_at: date,
        amount: Decimal | str,
        currency: str,
        payer_name: str,
        remark: str | None,
    ) -> ExportContractAdvancePaymentRow:
        payment = ExportContractAdvancePayment(
            contract_id=contract_id,
            payment_no=payment_no,
            received_at=received_at,
            amount=Decimal(str(amount)),
            currency=currency,
            payer_name=payer_name,
            remark=remark,
        )
        self.session.add(payment)
        await self.session.flush()
        await self.refresh_statistics(contract_id)
        return self._map_advance_payment(payment)

    async def list_advance_payments(
        self,
        contract_id: str,
    ) -> list[ExportContractAdvancePaymentRow]:
        rows = await self.session.scalars(
            select(ExportContractAdvancePayment)
            .where(ExportContractAdvancePayment.contract_id == contract_id)
            .order_by(
                ExportContractAdvancePayment.received_at.desc(),
                ExportContractAdvancePayment.created_at.desc(),
            )
        )
        return [self._map_advance_payment(row) for row in rows]

    async def add_event(
        self,
        *,
        contract_id: str,
        contract_no: str,
        event_type: str,
        payload: str,
    ) -> ExportContractEventRow:
        event = ExportContractEvent(
            contract_id=contract_id,
            contract_no=contract_no,
            event_type=event_type,
            payload=payload,
        )
        self.session.add(event)
        await self.session.flush()
        return self._map_event(event)

    async def list_events(self, contract_id: str) -> list[ExportContractEventRow]:
        rows = await self.session.scalars(
            select(ExportContractEvent)
            .where(ExportContractEvent.contract_id == contract_id)
            .order_by(ExportContractEvent.created_at.desc())
        )
        return [self._map_event(row) for row in rows]

    async def _scalars(self, statement: Select[tuple[ExportContract]]) -> list[ExportContract]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_contract(self, contract: ExportContract) -> ExportContractRow:
        unshipped_quantity = contract.total_quantity - contract.shipped_quantity
        unshipped_amount = contract.total_amount - contract.shipped_amount
        unpurchased_quantity = contract.total_quantity - contract.purchased_quantity
        return ExportContractRow(
            id=contract.id,
            code=contract.code,
            contract_date=contract.contract_date,
            customer_id=contract.customer_id,
            customer_name=contract.customer_name,
            sales_user_id=contract.sales_user_id,
            sales_user_name=contract.sales_user_name,
            currency=contract.currency,
            trade_term=contract.trade_term,
            planned_ship_date=contract.planned_ship_date,
            payment_terms=contract.payment_terms,
            source_quotation_id=contract.source_quotation_id,
            source_quotation_no=contract.source_quotation_no,
            remarks=contract.remarks,
            total_quantity=self._quantity(contract.total_quantity),
            total_amount=self._money(contract.total_amount),
            shipped_quantity=self._quantity(contract.shipped_quantity),
            shipped_amount=self._money(contract.shipped_amount),
            unshipped_quantity=self._quantity(unshipped_quantity),
            unshipped_amount=self._money(unshipped_amount),
            purchased_quantity=self._quantity(contract.purchased_quantity),
            unpurchased_quantity=self._quantity(unpurchased_quantity),
            advance_payment_amount=self._money(contract.advance_payment_amount),
            approval_status=contract.approval_status,
            submitted_at=contract.submitted_at,
            approved_at=contract.approved_at,
            reviewer_name=contract.reviewer_name,
            signature_status=contract.signature_status,
            customer_signed_at=contract.customer_signed_at,
            owner_user_id=contract.owner_user_id,
            created_at=contract.created_at,
        )

    def _map_line(self, line: ExportContractLine) -> ExportContractLineRow:
        unpurchased_quantity = line.quantity - line.purchased_quantity
        unshipped_quantity = line.quantity - line.shipped_quantity
        shipped_amount = line.shipped_quantity * line.unit_price
        unshipped_amount = unshipped_quantity * line.unit_price
        return ExportContractLineRow(
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
            purchased_quantity=line.purchased_quantity,
            unpurchased_quantity=self._quantity(unpurchased_quantity),
            shipped_quantity=line.shipped_quantity,
            unshipped_quantity=self._quantity(unshipped_quantity),
            shipped_amount=self._money(shipped_amount),
            unshipped_amount=self._money(unshipped_amount),
            image_url=line.image_url,
            remark=line.remark,
            created_at=line.created_at,
        )

    def _map_signature(self, signature: ExportContractSignature) -> ExportContractSignatureRow:
        return ExportContractSignatureRow(
            id=signature.id,
            contract_id=signature.contract_id,
            signed_by=signature.signed_by,
            signed_at=signature.signed_at,
            signature_method=signature.signature_method,
            file_no=signature.file_no,
            remark=signature.remark,
            created_at=signature.created_at,
        )

    def _map_advance_payment(
        self,
        payment: ExportContractAdvancePayment,
    ) -> ExportContractAdvancePaymentRow:
        return ExportContractAdvancePaymentRow(
            id=payment.id,
            contract_id=payment.contract_id,
            payment_no=payment.payment_no,
            received_at=payment.received_at,
            amount=self._money(payment.amount),
            currency=payment.currency,
            payer_name=payment.payer_name,
            remark=payment.remark,
            created_at=payment.created_at,
        )

    def _map_event(self, event: ExportContractEvent) -> ExportContractEventRow:
        return ExportContractEventRow(
            id=event.id,
            contract_id=event.contract_id,
            contract_no=event.contract_no,
            event_type=event.event_type,
            payload=event.payload,
            created_at=event.created_at,
        )

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
