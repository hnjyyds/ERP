from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.reimbursements.models import Reimbursement, ReimbursementItem
from app.modules.finance.reimbursements.schemas import ReimbursementItemCreate


@dataclass(frozen=True)
class ReimbursementItemRow:
    id: str
    expense_item: str
    amount: str
    remark: str | None


@dataclass(frozen=True)
class ReimbursementRow:
    id: str
    reimbursement_no: str
    applicant_user_id: str
    applicant_user_name: str
    department: str
    category: str
    currency: str
    amount: str
    reason: str | None
    status: str
    approved_by_user_id: str | None
    approved_by_user_name: str | None
    approval_remark: str | None
    approved_at: datetime | None
    paid_at: datetime | None
    payment_method: str | None
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime
    items: list[ReimbursementItemRow]


class ReimbursementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        reimbursement_no: str,
        applicant_user_id: str,
        applicant_user_name: str,
        department: str,
        category: str,
        currency: str,
        amount: Decimal | str,
        reason: str | None,
        remark: str | None,
        items: list[ReimbursementItemCreate],
        created_by_user_id: str,
        created_by_user_name: str,
    ) -> ReimbursementRow:
        reimbursement = Reimbursement(
            reimbursement_no=reimbursement_no,
            applicant_user_id=applicant_user_id,
            applicant_user_name=applicant_user_name,
            department=department,
            category=category,
            currency=currency,
            amount=Decimal(str(amount)),
            reason=reason,
            status="submitted",
            remark=remark,
            created_by_user_id=created_by_user_id,
            created_by_user_name=created_by_user_name,
        )
        self.session.add(reimbursement)
        await self.session.flush()
        for item in items:
            self.session.add(
                ReimbursementItem(
                    reimbursement_id=reimbursement.id,
                    expense_item=item.expense_item,
                    amount=Decimal(str(item.amount)),
                    remark=item.remark,
                )
            )
        await self.session.flush()
        return await self._map(reimbursement)

    async def get(self, reimbursement_id: str) -> ReimbursementRow | None:
        reimbursement = await self.session.get(Reimbursement, reimbursement_id)
        if reimbursement is None:
            return None
        return await self._map(reimbursement)

    async def list(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        category: str | None = None,
        applicant_user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ReimbursementRow], int]:
        statement = select(Reimbursement)
        count_statement = select(func.count()).select_from(Reimbursement)
        conditions = self._conditions(
            q=q,
            status=status,
            category=category,
            applicant_user_id=applicant_user_id,
        )
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                Reimbursement.created_at.desc(),
                Reimbursement.reimbursement_no.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        mapped = [await self._map(row) for row in rows]
        return mapped, int(total or 0)

    async def approve(
        self,
        *,
        reimbursement_id: str,
        approved: bool,
        approval_remark: str | None,
        approved_by_user_id: str,
        approved_by_user_name: str,
    ) -> ReimbursementRow | None:
        reimbursement = await self.session.get(Reimbursement, reimbursement_id)
        if reimbursement is None:
            return None
        reimbursement.status = "approved" if approved else "rejected"
        reimbursement.approved_by_user_id = approved_by_user_id
        reimbursement.approved_by_user_name = approved_by_user_name
        reimbursement.approval_remark = approval_remark
        reimbursement.approved_at = datetime.now(UTC)
        await self.session.flush()
        return await self._map(reimbursement)

    async def pay(
        self,
        *,
        reimbursement_id: str,
        payment_method: str,
        remark: str | None,
    ) -> ReimbursementRow | None:
        reimbursement = await self.session.get(Reimbursement, reimbursement_id)
        if reimbursement is None:
            return None
        reimbursement.status = "paid"
        reimbursement.payment_method = payment_method
        reimbursement.paid_at = datetime.now(UTC)
        if remark is not None:
            reimbursement.remark = remark
        await self.session.flush()
        return await self._map(reimbursement)

    def _conditions(
        self,
        *,
        q: str | None,
        status: str | None,
        category: str | None,
        applicant_user_id: str | None,
    ) -> list[object]:
        conditions: list[object] = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    Reimbursement.reimbursement_no.ilike(pattern),
                    Reimbursement.applicant_user_name.ilike(pattern),
                    Reimbursement.department.ilike(pattern),
                )
            )
        if status:
            conditions.append(Reimbursement.status == status)
        if category:
            conditions.append(Reimbursement.category == category)
        if applicant_user_id:
            conditions.append(Reimbursement.applicant_user_id == applicant_user_id)
        return conditions

    async def _scalars(self, statement: Select[tuple[Reimbursement]]) -> list[Reimbursement]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _load_items(self, reimbursement_id: str) -> list[ReimbursementItemRow]:
        statement = (
            select(ReimbursementItem)
            .where(ReimbursementItem.reimbursement_id == reimbursement_id)
            .order_by(ReimbursementItem.created_at.asc())
        )
        result = await self.session.scalars(statement)
        return [
            ReimbursementItemRow(
                id=item.id,
                expense_item=item.expense_item,
                amount=self._decimal(item.amount),
                remark=item.remark,
            )
            for item in result.unique()
        ]

    async def _map(self, reimbursement: Reimbursement) -> ReimbursementRow:
        items = await self._load_items(reimbursement.id)
        return ReimbursementRow(
            id=reimbursement.id,
            reimbursement_no=reimbursement.reimbursement_no,
            applicant_user_id=reimbursement.applicant_user_id,
            applicant_user_name=reimbursement.applicant_user_name,
            department=reimbursement.department,
            category=reimbursement.category,
            currency=reimbursement.currency,
            amount=self._decimal(reimbursement.amount),
            reason=reimbursement.reason,
            status=reimbursement.status,
            approved_by_user_id=reimbursement.approved_by_user_id,
            approved_by_user_name=reimbursement.approved_by_user_name,
            approval_remark=reimbursement.approval_remark,
            approved_at=reimbursement.approved_at,
            paid_at=reimbursement.paid_at,
            payment_method=reimbursement.payment_method,
            remark=reimbursement.remark,
            created_by_user_id=reimbursement.created_by_user_id,
            created_by_user_name=reimbursement.created_by_user_name,
            created_at=reimbursement.created_at,
            items=items,
        )

    def _decimal(self, value: Decimal) -> str:
        return f"{Decimal(str(value)):.2f}"
