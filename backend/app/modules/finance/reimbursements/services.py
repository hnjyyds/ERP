from collections.abc import Iterable
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.reimbursements.repositories import (
    ReimbursementRepository,
    ReimbursementRow,
)
from app.modules.finance.reimbursements.schemas import (
    VALID_REIMBURSEMENT_CATEGORIES,
    VALID_REIMBURSEMENT_PAYMENT_METHODS,
    VALID_REIMBURSEMENT_STATUSES,
    ReimbursementApprove,
    ReimbursementCreate,
    ReimbursementItemResponse,
    ReimbursementListResponse,
    ReimbursementPay,
    ReimbursementResponse,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ReimbursementNotFoundError(Exception):
    pass


class ReimbursementService:
    def __init__(self, repository: ReimbursementRepository) -> None:
        self._repository = repository

    async def create_reimbursement(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: ReimbursementCreate,
    ) -> ReimbursementResponse:
        self._require_finance(current_user)
        self._validate_category(payload.category)
        self._validate_items_total(payload)
        async with UnitOfWork(self._repository.session):
            reimbursement = await self._repository.create(
                reimbursement_no=payload.reimbursement_no,
                applicant_user_id=payload.applicant_user_id,
                applicant_user_name=payload.applicant_user_name,
                department=payload.department,
                category=payload.category,
                currency=payload.currency,
                amount=payload.amount,
                reason=payload.reason,
                remark=payload.remark,
                items=payload.items,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
        return self._response(reimbursement)

    async def list_reimbursements(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        category: str | None,
        applicant_user_id: str | None = None,
    ) -> ReimbursementListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_status(status)
        if category is not None:
            self._validate_category(category)
        rows, total = await self._repository.list(
            q=q,
            status=status,
            category=category,
            applicant_user_id=applicant_user_id,
        )
        return ReimbursementListResponse(
            items=[self._response(row) for row in rows],
            total=total,
            total_amount=self._money_sum(row.amount for row in rows),
        )

    async def approve_reimbursement(
        self,
        *,
        current_user: CurrentUserResponse,
        reimbursement_id: str,
        payload: ReimbursementApprove,
    ) -> ReimbursementResponse:
        self._require_finance(current_user)
        existing = await self._get(reimbursement_id)
        if existing.status != "submitted":
            raise ValueError("只有已提交的报销单可以审批")
        async with UnitOfWork(self._repository.session):
            reimbursement = await self._repository.approve(
                reimbursement_id=reimbursement_id,
                approved=payload.approved,
                approval_remark=payload.approval_remark,
                approved_by_user_id=current_user.id,
                approved_by_user_name=current_user.display_name,
            )
        if reimbursement is None:
            raise ReimbursementNotFoundError
        return self._response(reimbursement)

    async def pay_reimbursement(
        self,
        *,
        current_user: CurrentUserResponse,
        reimbursement_id: str,
        payload: ReimbursementPay,
    ) -> ReimbursementResponse:
        self._require_finance(current_user)
        self._validate_payment_method(payload.payment_method)
        existing = await self._get(reimbursement_id)
        if existing.status != "approved":
            raise ValueError("只有已审批通过的报销单可以付款")
        async with UnitOfWork(self._repository.session):
            reimbursement = await self._repository.pay(
                reimbursement_id=reimbursement_id,
                payment_method=payload.payment_method,
                remark=payload.remark,
            )
        if reimbursement is None:
            raise ReimbursementNotFoundError
        return self._response(reimbursement)

    async def _get(self, reimbursement_id: str) -> ReimbursementRow:
        reimbursement = await self._repository.get(reimbursement_id)
        if reimbursement is None:
            raise ReimbursementNotFoundError
        return reimbursement

    def _validate_category(self, category: str) -> None:
        if category not in VALID_REIMBURSEMENT_CATEGORIES:
            raise ValueError("报销分类无效")

    def _validate_status(self, status: str) -> None:
        if status not in VALID_REIMBURSEMENT_STATUSES:
            raise ValueError("报销单状态无效")

    def _validate_payment_method(self, payment_method: str) -> None:
        if payment_method not in VALID_REIMBURSEMENT_PAYMENT_METHODS:
            raise ValueError("付款方式无效")

    def _validate_items_total(self, payload: ReimbursementCreate) -> None:
        if not payload.items:
            return
        items_total = sum(Decimal(str(item.amount)) for item in payload.items)
        if items_total != Decimal(str(payload.amount)):
            raise ValueError("报销明细金额合计必须等于报销总金额")

    def _response(self, row: ReimbursementRow) -> ReimbursementResponse:
        return ReimbursementResponse(
            id=row.id,
            reimbursement_no=row.reimbursement_no,
            applicant_user_id=row.applicant_user_id,
            applicant_user_name=row.applicant_user_name,
            department=row.department,
            category=row.category,
            currency=row.currency,
            amount=row.amount,
            reason=row.reason,
            status=row.status,
            approved_by_user_id=row.approved_by_user_id,
            approved_by_user_name=row.approved_by_user_name,
            approval_remark=row.approval_remark,
            payment_method=row.payment_method,
            remark=row.remark,
            created_by_user_id=row.created_by_user_id,
            created_by_user_name=row.created_by_user_name,
            items=[
                ReimbursementItemResponse(
                    id=item.id,
                    expense_item=item.expense_item,
                    amount=item.amount,
                    remark=item.remark,
                )
                for item in row.items
            ],
        )

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError

    def _money_sum(self, values: Iterable[str]) -> str:
        return f"{sum(Decimal(str(value)) for value in values):.2f}"
