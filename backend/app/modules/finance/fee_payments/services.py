from collections.abc import Iterable
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.fee_payments.repositories import (
    FeePayableRow,
    FeePaymentAllocationRow,
    FeePaymentRepository,
    FeePaymentRequestRow,
    PartnerFeeInvoiceRow,
)
from app.modules.finance.fee_payments.schemas import (
    VALID_FEE_PAYMENT_REQUEST_STATUSES,
    VALID_FEE_TYPES,
    VALID_PARTNER_FEE_INVOICE_STATUSES,
    FeePayableItemResponse,
    FeePayableListResponse,
    FeePaymentAllocationResponse,
    FeePaymentRequestApprove,
    FeePaymentRequestCreate,
    FeePaymentRequestListResponse,
    FeePaymentRequestResponse,
    PartnerFeeInvoiceCreate,
    PartnerFeeInvoiceListResponse,
    PartnerFeeInvoiceResponse,
)
from app.modules.masterdata.partners.repositories import PartnerRepository, PartnerRow
from app.modules.sales.shipments.repositories import ShipmentPlanRepository, ShipmentPlanRow
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class FeePaymentNotFoundError(Exception):
    pass


class FeePaymentService:
    def __init__(
        self,
        repository: FeePaymentRepository,
        partner_repository: PartnerRepository,
        shipment_repository: ShipmentPlanRepository,
    ) -> None:
        self._repository = repository
        self._partner_repository = partner_repository
        self._shipment_repository = shipment_repository

    async def create_partner_fee_invoice(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PartnerFeeInvoiceCreate,
    ) -> PartnerFeeInvoiceResponse:
        self._require_finance(current_user)
        self._validate_fee_type(payload.fee_type)
        partner = await self._resolve_partner(payload)
        await self._resolve_shipment(payload)
        partner_type = partner.partner_type if partner is not None else payload.partner_type
        async with UnitOfWork(self._repository.session):
            invoice = await self._repository.create_partner_fee_invoice(
                invoice_no=payload.invoice_no,
                invoice_date=payload.invoice_date,
                partner_id=payload.partner_id,
                partner_name=payload.partner_name,
                partner_type=partner_type,
                shipment_plan_id=payload.shipment_plan_id,
                shipment_no=payload.shipment_no,
                sales_user_id=payload.sales_user_id,
                sales_user_name=payload.sales_user_name,
                fee_type=payload.fee_type,
                total_amount=payload.total_amount,
                currency=payload.currency,
                due_date=payload.due_date,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
        return await self._partner_fee_invoice_response(invoice)

    async def list_partner_fee_invoices(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        fee_type: str | None,
        partner_id: str | None,
        sales_user_id: str | None,
        shipment_no: str | None,
    ) -> PartnerFeeInvoiceListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_invoice_status(status)
        if fee_type is not None:
            self._validate_fee_type(fee_type)
        invoices, total = await self._repository.list_partner_fee_invoices(
            q=q,
            status=status,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        return PartnerFeeInvoiceListResponse(
            items=[await self._partner_fee_invoice_response(invoice) for invoice in invoices],
            total=total,
        )

    async def create_fee_payment_request(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: FeePaymentRequestCreate,
    ) -> FeePaymentRequestResponse:
        self._require_finance(current_user)
        invoice = await self._get_partner_fee_invoice(payload.partner_fee_invoice_id)
        self._validate_fee_request_amount(invoice, payload.requested_amount, payload.currency)
        async with UnitOfWork(self._repository.session):
            request = await self._repository.create_fee_payment_request(
                request_no=payload.request_no,
                invoice=invoice,
                request_date=payload.request_date,
                requested_amount=payload.requested_amount,
                currency=payload.currency,
                requester_user_id=current_user.id,
                requester_user_name=current_user.display_name,
                remark=payload.remark,
            )
        return self._fee_payment_request_response(request)

    async def list_fee_payment_requests(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        fee_type: str | None,
        partner_id: str | None,
        sales_user_id: str | None,
        shipment_no: str | None,
    ) -> FeePaymentRequestListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_request_status(status)
        if fee_type is not None:
            self._validate_fee_type(fee_type)
        rows, total = await self._repository.list_fee_payment_requests(
            q=q,
            status=status,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        return FeePaymentRequestListResponse(
            items=[self._fee_payment_request_response(row) for row in rows],
            total=total,
        )

    async def approve_fee_payment_request(
        self,
        *,
        current_user: CurrentUserResponse,
        fee_payment_request_id: str,
        payload: FeePaymentRequestApprove,
    ) -> FeePaymentRequestResponse:
        self._require_finance(current_user)
        request = await self._get_fee_payment_request(fee_payment_request_id)
        invoice = await self._get_partner_fee_invoice(request.partner_fee_invoice_id)
        self._validate_fee_approval(request, invoice, payload)
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_fee_payment_request(
                request_id=request.id,
                approved_amount=payload.approved_amount,
                approved_at=payload.approved_at,
                reviewer_name=payload.reviewer_name,
                payment_account=payload.payment_account,
                remark=payload.remark,
            )
            if approved is None:
                raise FeePaymentNotFoundError
            await self._repository.add_allocation(
                fee_payment_request_id=approved.id,
                partner_fee_invoice_id=invoice.id,
                allocated_at=payload.approved_at,
                amount=payload.approved_amount,
                currency=approved.currency,
                remark=payload.remark,
            )
            refreshed = await self._repository.refresh_partner_fee_invoice_status(invoice.id)
            if refreshed is None:
                raise FeePaymentNotFoundError
        return self._fee_payment_request_response(approved)

    async def list_fee_payables(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        fee_type: str | None,
        partner_id: str | None,
        sales_user_id: str | None,
        shipment_no: str | None,
    ) -> FeePayableListResponse:
        self._require_finance(current_user)
        if status is not None:
            self._validate_invoice_status(status)
        if fee_type is not None:
            self._validate_fee_type(fee_type)
        rows, total = await self._repository.list_fee_payables(
            q=q,
            status=status,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
        return FeePayableListResponse(
            items=[self._fee_payable_response(row) for row in rows],
            total=total,
            total_payable_amount=self._money_sum(row.payable_amount for row in rows),
        )

    async def _resolve_partner(
        self,
        payload: PartnerFeeInvoiceCreate,
    ) -> PartnerRow | None:
        if payload.partner_id is None:
            return None
        partner = await self._partner_repository.get_partner(payload.partner_id)
        if partner is None:
            raise FeePaymentNotFoundError
        if partner.cn_name != payload.partner_name:
            raise ValueError("合作伙伴费用发票关联的合作伙伴名称不一致")
        if payload.partner_type is not None and partner.partner_type != payload.partner_type:
            raise ValueError("合作伙伴费用发票关联的合作伙伴类型不一致")
        if partner.status != "active":
            raise ValueError("只能登记启用合作伙伴的费用发票")
        return partner

    async def _resolve_shipment(
        self,
        payload: PartnerFeeInvoiceCreate,
    ) -> ShipmentPlanRow | None:
        if payload.shipment_plan_id is None:
            return None
        shipment = await self._shipment_repository.get_plan(payload.shipment_plan_id)
        if shipment is None:
            raise FeePaymentNotFoundError
        if payload.shipment_no is not None and payload.shipment_no != shipment.code:
            raise ValueError("合作伙伴费用发票关联的出运单号不一致")
        if payload.currency != shipment.currency:
            raise ValueError("费用发票币种必须和出运单币种一致")
        if shipment.approval_status != "approved":
            raise ValueError("只有已审批出运单可以登记合作伙伴费用发票")
        return shipment

    async def _get_partner_fee_invoice(self, invoice_id: str) -> PartnerFeeInvoiceRow:
        invoice = await self._repository.get_partner_fee_invoice(invoice_id)
        if invoice is None:
            raise FeePaymentNotFoundError
        return invoice

    async def _get_fee_payment_request(self, request_id: str) -> FeePaymentRequestRow:
        request = await self._repository.get_fee_payment_request(request_id)
        if request is None:
            raise FeePaymentNotFoundError
        return request

    def _validate_fee_request_amount(
        self,
        invoice: PartnerFeeInvoiceRow,
        requested_amount: Decimal,
        currency: str,
    ) -> None:
        if invoice.status == "paid":
            raise ValueError("合作伙伴费用发票已付清")
        if currency != invoice.currency:
            raise ValueError("付费申请币种必须和费用发票一致")
        if requested_amount > self._decimal(invoice.unpaid_amount):
            raise ValueError("付费申请金额不能超过费用发票未付金额")

    def _validate_fee_approval(
        self,
        request: FeePaymentRequestRow,
        invoice: PartnerFeeInvoiceRow,
        payload: FeePaymentRequestApprove,
    ) -> None:
        if request.status != "submitted":
            raise ValueError("只有待审批付费申请可以审批")
        if payload.approved_amount > self._decimal(request.requested_amount):
            raise ValueError("审批金额不能超过申请金额")
        if payload.approved_amount > self._decimal(invoice.unpaid_amount):
            raise ValueError("审批付费金额不能超过费用发票未付金额")
        if request.currency != invoice.currency:
            raise ValueError("付费申请币种和费用发票不一致")

    def _validate_invoice_status(self, invoice_status: str) -> None:
        if invoice_status not in VALID_PARTNER_FEE_INVOICE_STATUSES:
            raise ValueError("合作伙伴费用发票状态无效")

    def _validate_request_status(self, request_status: str) -> None:
        if request_status not in VALID_FEE_PAYMENT_REQUEST_STATUSES:
            raise ValueError("付费申请状态无效")

    def _validate_fee_type(self, fee_type: str) -> None:
        if fee_type not in VALID_FEE_TYPES:
            raise ValueError("费用类型无效")

    async def _partner_fee_invoice_response(
        self,
        invoice: PartnerFeeInvoiceRow,
    ) -> PartnerFeeInvoiceResponse:
        requests = await self._repository.list_requests_for_invoice(invoice.id)
        allocations = await self._repository.list_allocations_for_invoice(invoice.id)
        return PartnerFeeInvoiceResponse(
            id=invoice.id,
            invoice_no=invoice.invoice_no,
            invoice_date=invoice.invoice_date,
            partner_id=invoice.partner_id,
            partner_name=invoice.partner_name,
            partner_type=invoice.partner_type,
            shipment_plan_id=invoice.shipment_plan_id,
            shipment_no=invoice.shipment_no,
            sales_user_id=invoice.sales_user_id,
            sales_user_name=invoice.sales_user_name,
            fee_type=invoice.fee_type,
            total_amount=invoice.total_amount,
            paid_amount=invoice.paid_amount,
            unpaid_amount=invoice.unpaid_amount,
            currency=invoice.currency,
            due_date=invoice.due_date,
            status=invoice.status,
            remark=invoice.remark,
            created_by_user_id=invoice.created_by_user_id,
            created_by_user_name=invoice.created_by_user_name,
            fee_payment_requests=[self._fee_payment_request_response(row) for row in requests],
            allocations=[self._allocation_response(row) for row in allocations],
        )

    def _fee_payment_request_response(
        self,
        request: FeePaymentRequestRow,
    ) -> FeePaymentRequestResponse:
        return FeePaymentRequestResponse(
            id=request.id,
            request_no=request.request_no,
            partner_fee_invoice_id=request.partner_fee_invoice_id,
            partner_fee_invoice_no=request.partner_fee_invoice_no,
            partner_id=request.partner_id,
            partner_name=request.partner_name,
            partner_type=request.partner_type,
            shipment_plan_id=request.shipment_plan_id,
            shipment_no=request.shipment_no,
            sales_user_id=request.sales_user_id,
            sales_user_name=request.sales_user_name,
            fee_type=request.fee_type,
            request_date=request.request_date,
            requested_amount=request.requested_amount,
            approved_amount=request.approved_amount,
            paid_amount=request.paid_amount,
            currency=request.currency,
            status=request.status,
            requester_user_id=request.requester_user_id,
            requester_user_name=request.requester_user_name,
            reviewer_name=request.reviewer_name,
            approved_at=request.approved_at,
            payment_account=request.payment_account,
            remark=request.remark,
        )

    def _allocation_response(
        self,
        allocation: FeePaymentAllocationRow,
    ) -> FeePaymentAllocationResponse:
        return FeePaymentAllocationResponse(
            id=allocation.id,
            fee_payment_request_id=allocation.fee_payment_request_id,
            partner_fee_invoice_id=allocation.partner_fee_invoice_id,
            allocated_at=allocation.allocated_at,
            amount=allocation.amount,
            currency=allocation.currency,
            remark=allocation.remark,
        )

    def _fee_payable_response(self, row: FeePayableRow) -> FeePayableItemResponse:
        return FeePayableItemResponse(
            partner_fee_invoice_id=row.partner_fee_invoice_id,
            invoice_no=row.invoice_no,
            partner_id=row.partner_id,
            partner_name=row.partner_name,
            partner_type=row.partner_type,
            shipment_plan_id=row.shipment_plan_id,
            shipment_no=row.shipment_no,
            sales_user_id=row.sales_user_id,
            sales_user_name=row.sales_user_name,
            fee_type=row.fee_type,
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
