from collections.abc import Iterable
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.receipts.repositories import (
    BankReceiptRow,
    ReceiptAllocationRow,
    ReceiptClaimRow,
    ReceiptRepository,
    ReceivableRow,
)
from app.modules.finance.receipts.schemas import (
    VALID_ALLOCATION_TYPES,
    VALID_RECEIPT_STATUSES,
    VALID_RECEIPT_TYPES,
    BankReceiptCreate,
    BankReceiptListResponse,
    BankReceiptResponse,
    ReceiptAllocationCreate,
    ReceiptAllocationResponse,
    ReceiptClaimCreate,
    ReceiptClaimResponse,
    ReceivableItemResponse,
    ReceivableListResponse,
)
from app.modules.sales.contracts.repositories import ExportContractRepository, ExportContractRow
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ReceiptNotFoundError(Exception):
    pass


class ReceiptService:
    def __init__(
        self,
        repository: ReceiptRepository,
        contract_repository: ExportContractRepository,
    ) -> None:
        self._repository = repository
        self._contract_repository = contract_repository

    async def create_receipt(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: BankReceiptCreate,
    ) -> BankReceiptResponse:
        self._require_finance(current_user)
        self._validate_receipt_type(payload.receipt_type)
        async with UnitOfWork(self._repository.session):
            receipt = await self._repository.create_receipt(
                receipt_no=payload.receipt_no,
                received_at=payload.received_at,
                payer_name=payload.payer_name,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                amount=payload.amount,
                currency=payload.currency,
                bank_account=payload.bank_account,
                reference_no=payload.reference_no,
                receipt_type=payload.receipt_type,
                claim_message=f"银行水单 {payload.receipt_no} 待业务员认领",
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
        return await self._receipt_response(receipt)

    async def list_receipts(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        customer_id: str | None,
    ) -> BankReceiptListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_receipt_status(status)
        receipts, total = await self._repository.list_receipts(
            q=q,
            status=status,
            customer_id=customer_id,
        )
        return BankReceiptListResponse(
            items=[await self._receipt_response(receipt) for receipt in receipts],
            total=total,
        )

    async def claim_receipt(
        self,
        *,
        current_user: CurrentUserResponse,
        receipt_id: str,
        payload: ReceiptClaimCreate,
    ) -> BankReceiptResponse:
        self._require_claim_permission(current_user)
        receipt = await self._get_receipt(receipt_id)
        if receipt.status != "unclaimed":
            raise ValueError("只有待认领水单可以认领")
        async with UnitOfWork(self._repository.session):
            await self._repository.add_claim(
                receipt_id=receipt.id,
                claimed_by_user_id=payload.sales_user_id or current_user.id,
                claimed_by_user_name=payload.sales_user_name or current_user.display_name,
                claimed_at=payload.claimed_at,
                note=payload.note,
            )
            refreshed = await self._repository.refresh_receipt_status(receipt.id)
            if refreshed is None:
                raise ReceiptNotFoundError
        return await self._receipt_response(refreshed)

    async def allocate_receipt(
        self,
        *,
        current_user: CurrentUserResponse,
        receipt_id: str,
        payload: ReceiptAllocationCreate,
    ) -> BankReceiptResponse:
        self._require_finance(current_user)
        receipt = await self._get_receipt(receipt_id)
        self._validate_allocation(receipt, payload)
        contract = await self._resolve_contract(payload)
        contract_no = contract.code if contract is not None else payload.contract_no
        async with UnitOfWork(self._repository.session):
            await self._repository.add_allocation(
                receipt_id=receipt.id,
                allocation_type=payload.allocation_type,
                contract_id=contract.id if contract is not None else payload.contract_id,
                contract_no=contract_no,
                invoice_no=payload.invoice_no,
                allocated_at=payload.allocated_at,
                amount=payload.amount,
                currency=payload.currency,
                remark=payload.remark,
            )
            refreshed = await self._repository.refresh_receipt_status(receipt.id)
            if refreshed is None:
                raise ReceiptNotFoundError
        return await self._receipt_response(refreshed)

    async def list_receivables(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        customer_id: str | None,
        sales_user_id: str | None,
        contract_no: str | None,
        invoice_no: str | None,
    ) -> ReceivableListResponse:
        self._require_finance(current_user)
        rows, total = await self._repository.list_receivables(
            q=q,
            customer_id=customer_id,
            sales_user_id=sales_user_id,
            contract_no=contract_no,
            invoice_no=invoice_no,
        )
        return ReceivableListResponse(
            items=[self._receivable_response(row) for row in rows],
            total=total,
            total_receivable_amount=self._money_sum(row.receivable_amount for row in rows),
        )

    async def _get_receipt(self, receipt_id: str) -> BankReceiptRow:
        receipt = await self._repository.get_receipt(receipt_id)
        if receipt is None:
            raise ReceiptNotFoundError
        return receipt

    async def _resolve_contract(
        self,
        payload: ReceiptAllocationCreate,
    ) -> ExportContractRow | None:
        if payload.contract_id is None:
            return None
        contract = await self._contract_repository.get_contract(payload.contract_id)
        if contract is None:
            raise ReceiptNotFoundError
        if payload.contract_no is not None and payload.contract_no != contract.code:
            raise ValueError("分摊合同号和合同标识不一致")
        return contract

    def _validate_allocation(
        self,
        receipt: BankReceiptRow,
        payload: ReceiptAllocationCreate,
    ) -> None:
        if payload.allocation_type not in VALID_ALLOCATION_TYPES:
            raise ValueError("收款分摊类型无效")
        if receipt.status == "unclaimed":
            raise ValueError("银行水单认领后才能分摊")
        if payload.currency != receipt.currency:
            raise ValueError("收款分摊币种必须和银行水单一致")
        if payload.amount > self._decimal(receipt.unallocated_amount):
            raise ValueError("收款分摊金额不能超过未分摊金额")
        if payload.allocation_type == "contract" and payload.contract_id is None:
            raise ValueError("合同分摊必须选择出口合同")
        if payload.allocation_type == "invoice" and not payload.invoice_no:
            raise ValueError("发票分摊必须填写出口发票号")
        if payload.allocation_type == "advance" and not payload.invoice_no:
            raise ValueError("预收款分摊必须填写出口发票号")

    def _validate_receipt_type(self, receipt_type: str) -> None:
        if receipt_type not in VALID_RECEIPT_TYPES:
            raise ValueError("银行水单收款性质无效")

    def _validate_receipt_status(self, receipt_status: str) -> None:
        if receipt_status not in VALID_RECEIPT_STATUSES:
            raise ValueError("银行水单状态无效")

    async def _receipt_response(self, receipt: BankReceiptRow) -> BankReceiptResponse:
        claims = await self._repository.list_claims(receipt.id)
        allocations = await self._repository.list_allocations(receipt.id)
        return BankReceiptResponse(
            id=receipt.id,
            receipt_no=receipt.receipt_no,
            received_at=receipt.received_at,
            payer_name=receipt.payer_name,
            customer_id=receipt.customer_id,
            customer_name=receipt.customer_name,
            amount=receipt.amount,
            allocated_amount=receipt.allocated_amount,
            unallocated_amount=receipt.unallocated_amount,
            currency=receipt.currency,
            bank_account=receipt.bank_account,
            reference_no=receipt.reference_no,
            receipt_type=receipt.receipt_type,
            status=receipt.status,
            claim_message=receipt.claim_message,
            remark=receipt.remark,
            created_by_user_id=receipt.created_by_user_id,
            created_by_user_name=receipt.created_by_user_name,
            claims=[self._claim_response(claim) for claim in claims],
            allocations=[self._allocation_response(allocation) for allocation in allocations],
        )

    def _claim_response(self, claim: ReceiptClaimRow) -> ReceiptClaimResponse:
        return ReceiptClaimResponse(
            id=claim.id,
            receipt_id=claim.receipt_id,
            claimed_by_user_id=claim.claimed_by_user_id,
            claimed_by_user_name=claim.claimed_by_user_name,
            claimed_at=claim.claimed_at,
            note=claim.note,
        )

    def _allocation_response(
        self,
        allocation: ReceiptAllocationRow,
    ) -> ReceiptAllocationResponse:
        return ReceiptAllocationResponse(
            id=allocation.id,
            receipt_id=allocation.receipt_id,
            allocation_type=allocation.allocation_type,
            contract_id=allocation.contract_id,
            contract_no=allocation.contract_no,
            invoice_no=allocation.invoice_no,
            allocated_at=allocation.allocated_at,
            amount=allocation.amount,
            currency=allocation.currency,
            remark=allocation.remark,
        )

    def _receivable_response(self, row: ReceivableRow) -> ReceivableItemResponse:
        return ReceivableItemResponse(
            contract_id=row.contract_id,
            contract_no=row.contract_no,
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            sales_user_id=row.sales_user_id,
            sales_user_name=row.sales_user_name,
            currency=row.currency,
            total_amount=row.total_amount,
            received_amount=row.received_amount,
            receivable_amount=row.receivable_amount,
            status=row.status,
        )

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError

    def _require_claim_permission(self, current_user: CurrentUserResponse) -> None:
        if (
            "finance:view" not in current_user.permissions
            and "sales:contract:view" not in current_user.permissions
        ):
            raise PermissionDeniedError

    def _money_sum(self, values: Iterable[str]) -> str:
        return f"{sum((self._decimal(value) for value in values), Decimal('0')):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
