from collections.abc import Iterable
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.payments.repositories import (
    PayableRow,
    PaymentAllocationRow,
    PaymentRepository,
    PaymentRequestRow,
    SupplierInvoiceRow,
)
from app.modules.finance.payments.schemas import (
    VALID_PAYMENT_REQUEST_STATUSES,
    VALID_PAYMENT_TYPES,
    VALID_SUPPLIER_INVOICE_STATUSES,
    PayableItemResponse,
    PayableListResponse,
    PaymentAllocationResponse,
    PaymentRequestApprove,
    PaymentRequestCreate,
    PaymentRequestListResponse,
    PaymentRequestResponse,
    SupplierInvoiceCreate,
    SupplierInvoiceListResponse,
    SupplierInvoiceResponse,
)
from app.modules.purchase.invoice_notices.repositories import (
    PurchaseInvoiceNoticeRepository,
    PurchaseInvoiceNoticeRow,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class PaymentNotFoundError(Exception):
    pass


class PaymentService:
    def __init__(
        self,
        repository: PaymentRepository,
        invoice_notice_repository: PurchaseInvoiceNoticeRepository,
    ) -> None:
        self._repository = repository
        self._invoice_notice_repository = invoice_notice_repository

    async def create_supplier_invoice(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: SupplierInvoiceCreate,
    ) -> SupplierInvoiceResponse:
        self._require_finance(current_user)
        source_notice = await self._resolve_purchase_invoice_notice(payload)
        purchase_invoice_notice_code = payload.purchase_invoice_notice_code
        if source_notice is not None:
            purchase_invoice_notice_code = source_notice.code
        async with UnitOfWork(self._repository.session):
            invoice = await self._repository.create_supplier_invoice(
                invoice_no=payload.invoice_no,
                invoice_date=payload.invoice_date,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                purchase_invoice_notice_id=payload.purchase_invoice_notice_id,
                purchase_invoice_notice_code=purchase_invoice_notice_code,
                purchase_contract_id=payload.purchase_contract_id,
                purchase_contract_no=payload.purchase_contract_no,
                total_amount=payload.total_amount,
                currency=payload.currency,
                due_date=payload.due_date,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
        return await self._supplier_invoice_response(invoice)

    async def list_supplier_invoices(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        supplier_id: str | None,
        purchase_contract_no: str | None,
    ) -> SupplierInvoiceListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_supplier_invoice_status(status)
        invoices, total = await self._repository.list_supplier_invoices(
            q=q,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_no=purchase_contract_no,
        )
        return SupplierInvoiceListResponse(
            items=[await self._supplier_invoice_response(invoice) for invoice in invoices],
            total=total,
        )

    async def create_payment_request(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PaymentRequestCreate,
    ) -> PaymentRequestResponse:
        self._require_finance(current_user)
        self._validate_payment_type(payload.payment_type)
        invoice = await self._get_supplier_invoice(payload.supplier_invoice_id)
        self._validate_payment_request_amount(invoice, payload.requested_amount, payload.currency)
        async with UnitOfWork(self._repository.session):
            payment_request = await self._repository.create_payment_request(
                request_no=payload.request_no,
                invoice=invoice,
                payment_type=payload.payment_type,
                request_date=payload.request_date,
                requested_amount=payload.requested_amount,
                currency=payload.currency,
                requester_user_id=current_user.id,
                requester_user_name=current_user.display_name,
                remark=payload.remark,
            )
        return self._payment_request_response(payment_request)

    async def list_payment_requests(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        payment_type: str | None,
        supplier_id: str | None,
    ) -> PaymentRequestListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_payment_request_status(status)
        if payment_type is not None:
            self._validate_payment_type(payment_type)
        rows, total = await self._repository.list_payment_requests(
            q=q,
            status=status,
            payment_type=payment_type,
            supplier_id=supplier_id,
        )
        return PaymentRequestListResponse(
            items=[self._payment_request_response(row) for row in rows],
            total=total,
        )

    async def approve_payment_request(
        self,
        *,
        current_user: CurrentUserResponse,
        payment_request_id: str,
        payload: PaymentRequestApprove,
    ) -> PaymentRequestResponse:
        self._require_finance(current_user)
        payment_request = await self._get_payment_request(payment_request_id)
        invoice = await self._get_supplier_invoice(payment_request.supplier_invoice_id)
        self._validate_payment_approval(payment_request, invoice, payload)
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_payment_request(
                request_id=payment_request.id,
                approved_amount=payload.approved_amount,
                approved_at=payload.approved_at,
                reviewer_name=payload.reviewer_name,
                payment_account=payload.payment_account,
                remark=payload.remark,
            )
            if approved is None:
                raise PaymentNotFoundError
            await self._repository.add_allocation(
                payment_request_id=approved.id,
                supplier_invoice_id=invoice.id,
                allocated_at=payload.approved_at,
                amount=payload.approved_amount,
                currency=approved.currency,
                remark=payload.remark,
            )
            refreshed = await self._repository.refresh_supplier_invoice_status(invoice.id)
            if refreshed is None:
                raise PaymentNotFoundError
        return self._payment_request_response(approved)

    async def list_payables(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        supplier_id: str | None,
        purchase_contract_no: str | None,
    ) -> PayableListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_supplier_invoice_status(status)
        rows, total = await self._repository.list_payables(
            q=q,
            status=status,
            supplier_id=supplier_id,
            purchase_contract_no=purchase_contract_no,
        )
        return PayableListResponse(
            items=[self._payable_response(row) for row in rows],
            total=total,
            total_payable_amount=self._money_sum(row.payable_amount for row in rows),
        )

    async def _resolve_purchase_invoice_notice(
        self,
        payload: SupplierInvoiceCreate,
    ) -> PurchaseInvoiceNoticeRow | None:
        if payload.purchase_invoice_notice_id is None:
            return None
        notice = await self._invoice_notice_repository.get_notice(
            payload.purchase_invoice_notice_id
        )
        if notice is None:
            raise PaymentNotFoundError
        if notice.status != "received":
            raise ValueError("供应商税票收到后才能登记付款发票")
        if (
            payload.purchase_invoice_notice_code is not None
            and payload.purchase_invoice_notice_code != notice.code
        ):
            raise ValueError("供应商发票关联的开票通知编号不一致")
        if payload.supplier_id is not None and payload.supplier_id != notice.supplier_id:
            raise ValueError("供应商发票关联的供应商不一致")
        if payload.currency != notice.currency:
            raise ValueError("供应商发票币种必须和开票通知一致")
        return notice

    async def _get_supplier_invoice(self, invoice_id: str) -> SupplierInvoiceRow:
        invoice = await self._repository.get_supplier_invoice(invoice_id)
        if invoice is None:
            raise PaymentNotFoundError
        return invoice

    async def _get_payment_request(self, payment_request_id: str) -> PaymentRequestRow:
        payment_request = await self._repository.get_payment_request(payment_request_id)
        if payment_request is None:
            raise PaymentNotFoundError
        return payment_request

    def _validate_payment_request_amount(
        self,
        invoice: SupplierInvoiceRow,
        requested_amount: Decimal,
        currency: str,
    ) -> None:
        if invoice.status == "paid":
            raise ValueError("供应商发票已付清")
        if currency != invoice.currency:
            raise ValueError("付款申请币种必须和供应商发票一致")
        if requested_amount > self._decimal(invoice.unpaid_amount):
            raise ValueError("付款申请金额不能超过供应商发票未付金额")

    def _validate_payment_approval(
        self,
        payment_request: PaymentRequestRow,
        invoice: SupplierInvoiceRow,
        payload: PaymentRequestApprove,
    ) -> None:
        if payment_request.status != "submitted":
            raise ValueError("只有待审批付款申请可以审批")
        if payload.approved_amount > self._decimal(payment_request.requested_amount):
            raise ValueError("审批金额不能超过申请金额")
        if payload.approved_amount > self._decimal(invoice.unpaid_amount):
            raise ValueError("审批付款金额不能超过供应商发票未付金额")
        if payment_request.currency != invoice.currency:
            raise ValueError("付款申请币种和供应商发票不一致")

    def _validate_supplier_invoice_status(self, invoice_status: str) -> None:
        if invoice_status not in VALID_SUPPLIER_INVOICE_STATUSES:
            raise ValueError("供应商发票状态无效")

    def _validate_payment_request_status(self, request_status: str) -> None:
        if request_status not in VALID_PAYMENT_REQUEST_STATUSES:
            raise ValueError("付款申请状态无效")

    def _validate_payment_type(self, payment_type: str) -> None:
        if payment_type not in VALID_PAYMENT_TYPES:
            raise ValueError("付款类型无效")

    async def _supplier_invoice_response(
        self,
        invoice: SupplierInvoiceRow,
    ) -> SupplierInvoiceResponse:
        requests = await self._repository.list_requests_for_invoice(invoice.id)
        allocations = await self._repository.list_allocations_for_invoice(invoice.id)
        return SupplierInvoiceResponse(
            id=invoice.id,
            invoice_no=invoice.invoice_no,
            invoice_date=invoice.invoice_date,
            supplier_id=invoice.supplier_id,
            supplier_name=invoice.supplier_name,
            purchase_invoice_notice_id=invoice.purchase_invoice_notice_id,
            purchase_invoice_notice_code=invoice.purchase_invoice_notice_code,
            purchase_contract_id=invoice.purchase_contract_id,
            purchase_contract_no=invoice.purchase_contract_no,
            total_amount=invoice.total_amount,
            paid_amount=invoice.paid_amount,
            unpaid_amount=invoice.unpaid_amount,
            currency=invoice.currency,
            due_date=invoice.due_date,
            status=invoice.status,
            remark=invoice.remark,
            created_by_user_id=invoice.created_by_user_id,
            created_by_user_name=invoice.created_by_user_name,
            payment_requests=[self._payment_request_response(row) for row in requests],
            allocations=[self._allocation_response(row) for row in allocations],
        )

    def _payment_request_response(
        self,
        payment_request: PaymentRequestRow,
    ) -> PaymentRequestResponse:
        return PaymentRequestResponse(
            id=payment_request.id,
            request_no=payment_request.request_no,
            supplier_invoice_id=payment_request.supplier_invoice_id,
            supplier_invoice_no=payment_request.supplier_invoice_no,
            supplier_id=payment_request.supplier_id,
            supplier_name=payment_request.supplier_name,
            purchase_contract_id=payment_request.purchase_contract_id,
            purchase_contract_no=payment_request.purchase_contract_no,
            payment_type=payment_request.payment_type,
            request_date=payment_request.request_date,
            requested_amount=payment_request.requested_amount,
            approved_amount=payment_request.approved_amount,
            paid_amount=payment_request.paid_amount,
            currency=payment_request.currency,
            status=payment_request.status,
            requester_user_id=payment_request.requester_user_id,
            requester_user_name=payment_request.requester_user_name,
            reviewer_name=payment_request.reviewer_name,
            approved_at=payment_request.approved_at,
            payment_account=payment_request.payment_account,
            remark=payment_request.remark,
        )

    def _allocation_response(self, allocation: PaymentAllocationRow) -> PaymentAllocationResponse:
        return PaymentAllocationResponse(
            id=allocation.id,
            payment_request_id=allocation.payment_request_id,
            supplier_invoice_id=allocation.supplier_invoice_id,
            allocated_at=allocation.allocated_at,
            amount=allocation.amount,
            currency=allocation.currency,
            remark=allocation.remark,
        )

    def _payable_response(self, row: PayableRow) -> PayableItemResponse:
        return PayableItemResponse(
            supplier_invoice_id=row.supplier_invoice_id,
            invoice_no=row.invoice_no,
            supplier_id=row.supplier_id,
            supplier_name=row.supplier_name,
            purchase_invoice_notice_id=row.purchase_invoice_notice_id,
            purchase_invoice_notice_code=row.purchase_invoice_notice_code,
            purchase_contract_id=row.purchase_contract_id,
            purchase_contract_no=row.purchase_contract_no,
            currency=row.currency,
            total_amount=row.total_amount,
            paid_amount=row.paid_amount,
            payable_amount=row.payable_amount,
            due_date=row.due_date,
            status=row.status,
        )

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError

    def _money_sum(self, values: Iterable[str]) -> str:
        return f"{sum((self._decimal(value) for value in values), Decimal('0')):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
