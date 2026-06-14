from collections.abc import Iterable
from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.finance.tax_refunds.repositories import (
    TaxRefundRepository,
    VerificationDocumentRow,
    VerificationTaxRefundRow,
    VerificationUsageRow,
)
from app.modules.finance.tax_refunds.schemas import (
    VALID_VERIFICATION_DOCUMENT_STATUSES,
    VALID_VERIFICATION_REMINDER_STATUSES,
    CustomsReceiptRegister,
    TaxRefundRegister,
    VerificationDocumentCreate,
    VerificationDocumentListResponse,
    VerificationDocumentResponse,
    VerificationRegister,
    VerificationTaxRefundResponse,
    VerificationUsageItemResponse,
    VerificationUsageListResponse,
)
from app.modules.sales.shipments.repositories import ShipmentPlanRepository, ShipmentPlanRow
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class TaxRefundNotFoundError(Exception):
    pass


class TaxRefundService:
    def __init__(
        self,
        repository: TaxRefundRepository,
        shipment_repository: ShipmentPlanRepository,
    ) -> None:
        self._repository = repository
        self._shipment_repository = shipment_repository

    async def create_document(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: VerificationDocumentCreate,
    ) -> VerificationDocumentResponse:
        self._require_finance(current_user)
        if payload.valid_until < payload.received_at:
            raise ValueError("核销单有效期不能早于领用日期")
        shipment = await self._resolve_shipment(payload)
        async with UnitOfWork(self._repository.session):
            document = await self._repository.create_document(
                document_no=payload.document_no,
                received_at=payload.received_at,
                owner_user_id=payload.owner_user_id,
                owner_user_name=payload.owner_user_name,
                shipment_plan_id=shipment.id if shipment is not None else payload.shipment_plan_id,
                shipment_no=shipment.code if shipment is not None else payload.shipment_no,
                customer_name=(
                    shipment.customer_name if shipment is not None else payload.customer_name
                ),
                currency=payload.currency,
                refundable_amount=payload.refundable_amount,
                valid_until=payload.valid_until,
                remark=payload.remark,
                created_by_user_id=current_user.id,
                created_by_user_name=current_user.display_name,
            )
        return await self._document_response(document)

    async def list_documents(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        owner_user_id: str | None,
        shipment_no: str | None,
        reminder_status: str | None,
    ) -> VerificationDocumentListResponse:
        self._require_finance(current_user)
        self._validate_filters(status=status, reminder_status=reminder_status)
        documents, total = await self._repository.list_documents(
            q=q,
            status=status,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
        )
        return VerificationDocumentListResponse(
            items=[await self._document_response(document) for document in documents],
            total=total,
        )

    async def register_customs_receipt(
        self,
        *,
        current_user: CurrentUserResponse,
        document_id: str,
        payload: CustomsReceiptRegister,
    ) -> VerificationDocumentResponse:
        self._require_finance(current_user)
        document = await self._get_document(document_id)
        if document.status not in ("issued", "customs_receipt_registered"):
            raise ValueError("只有已领用核销单可以登记报关回单")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.register_customs_receipt(
                document_id=document.id,
                customs_declaration_no=payload.customs_declaration_no,
                customs_receipt_no=payload.customs_receipt_no,
                received_at=payload.received_at,
                remark=payload.remark,
            )
            if updated is None:
                raise TaxRefundNotFoundError
        return await self._document_response(updated)

    async def register_verification(
        self,
        *,
        current_user: CurrentUserResponse,
        document_id: str,
        payload: VerificationRegister,
    ) -> VerificationDocumentResponse:
        self._require_finance(current_user)
        document = await self._get_document(document_id)
        if document.status not in ("customs_receipt_registered", "verified"):
            raise ValueError("报关回单登记后才能核销")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.register_verification(
                document_id=document.id,
                verification_no=payload.verification_no,
                verified_at=payload.verified_at,
                remark=payload.remark,
            )
            if updated is None:
                raise TaxRefundNotFoundError
        return await self._document_response(updated)

    async def register_tax_refund(
        self,
        *,
        current_user: CurrentUserResponse,
        document_id: str,
        payload: TaxRefundRegister,
    ) -> VerificationDocumentResponse:
        self._require_finance(current_user)
        document = await self._get_document(document_id)
        self._validate_refund(document, payload)
        async with UnitOfWork(self._repository.session):
            await self._repository.add_tax_refund(
                document_id=document.id,
                refund_no=payload.refund_no,
                refunded_at=payload.refunded_at,
                amount=payload.amount,
                currency=payload.currency,
                bank_receipt_no=payload.bank_receipt_no,
                remark=payload.remark,
            )
            updated = await self._repository.refresh_refund_status(document.id)
            if updated is None:
                raise TaxRefundNotFoundError
            if document.shipment_plan_id is not None:
                await self._repository.add_refund_to_shipment_profit(
                    shipment_plan_id=document.shipment_plan_id,
                    amount=payload.amount,
                )
        return await self._document_response(updated)

    async def list_usage(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        owner_user_id: str | None,
        shipment_no: str | None,
        reminder_status: str | None,
    ) -> VerificationUsageListResponse:
        self._require_finance(current_user)
        self._validate_filters(status=status, reminder_status=reminder_status)
        usage_rows, total = await self._repository.list_usage(
            q=q,
            status=status,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
        )
        return VerificationUsageListResponse(
            items=[self._usage_response(row) for row in usage_rows],
            total=total,
            total_refunded_amount=self._money_sum(row.refunded_amount for row in usage_rows),
        )

    async def _resolve_shipment(
        self,
        payload: VerificationDocumentCreate,
    ) -> ShipmentPlanRow | None:
        if payload.shipment_plan_id is None:
            return None
        shipment = await self._shipment_repository.get_plan(payload.shipment_plan_id)
        if shipment is None:
            raise TaxRefundNotFoundError
        if payload.shipment_no is not None and payload.shipment_no != shipment.code:
            raise ValueError("核销单出运单号和出运单标识不一致")
        if shipment.approval_status != "approved":
            raise ValueError("核销单只能关联已审批出运单")
        if payload.currency != shipment.currency:
            raise ValueError("核销单币种必须和出运单一致")
        return shipment

    async def _get_document(self, document_id: str) -> VerificationDocumentRow:
        document = await self._repository.get_document(document_id)
        if document is None:
            raise TaxRefundNotFoundError
        return document

    def _validate_refund(
        self,
        document: VerificationDocumentRow,
        payload: TaxRefundRegister,
    ) -> None:
        if document.status not in ("verified", "refunded"):
            raise ValueError("核销登记后才能登记退税")
        if payload.currency != document.currency:
            raise ValueError("退税币种必须和核销单一致")
        if payload.amount > self._decimal(document.unrefunded_amount):
            raise ValueError("退税金额不能超过未退税金额")

    def _validate_filters(
        self,
        *,
        status: str | None,
        reminder_status: str | None,
    ) -> None:
        if status is not None and status not in VALID_VERIFICATION_DOCUMENT_STATUSES:
            raise ValueError("核销单状态无效")
        if (
            reminder_status is not None
            and reminder_status not in VALID_VERIFICATION_REMINDER_STATUSES
        ):
            raise ValueError("核销单提醒状态无效")

    async def _document_response(
        self,
        document: VerificationDocumentRow,
    ) -> VerificationDocumentResponse:
        refunds = await self._repository.list_refunds(document.id)
        return VerificationDocumentResponse(
            id=document.id,
            document_no=document.document_no,
            received_at=document.received_at,
            owner_user_id=document.owner_user_id,
            owner_user_name=document.owner_user_name,
            shipment_plan_id=document.shipment_plan_id,
            shipment_no=document.shipment_no,
            customer_name=document.customer_name,
            currency=document.currency,
            refundable_amount=document.refundable_amount,
            refunded_amount=document.refunded_amount,
            unrefunded_amount=document.unrefunded_amount,
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
            refunds=[self._refund_response(refund) for refund in refunds],
        )

    def _refund_response(
        self,
        refund: VerificationTaxRefundRow,
    ) -> VerificationTaxRefundResponse:
        return VerificationTaxRefundResponse(
            id=refund.id,
            verification_document_id=refund.verification_document_id,
            refund_no=refund.refund_no,
            refunded_at=refund.refunded_at,
            amount=refund.amount,
            currency=refund.currency,
            bank_receipt_no=refund.bank_receipt_no,
            remark=refund.remark,
        )

    def _usage_response(self, row: VerificationUsageRow) -> VerificationUsageItemResponse:
        return VerificationUsageItemResponse(
            verification_document_id=row.verification_document_id,
            document_no=row.document_no,
            shipment_plan_id=row.shipment_plan_id,
            shipment_no=row.shipment_no,
            owner_user_id=row.owner_user_id,
            owner_user_name=row.owner_user_name,
            customer_name=row.customer_name,
            currency=row.currency,
            refundable_amount=row.refundable_amount,
            refunded_amount=row.refunded_amount,
            unrefunded_amount=row.unrefunded_amount,
            valid_until=row.valid_until,
            reminder_date=row.reminder_date,
            reminder_status=row.reminder_status,
            status=row.status,
            customs_receipt_no=row.customs_receipt_no,
            verification_no=row.verification_no,
        )

    def _require_finance(self, current_user: CurrentUserResponse) -> None:
        if "finance:view" not in current_user.permissions:
            raise PermissionDeniedError

    def _money_sum(self, values: Iterable[str]) -> str:
        return f"{sum((self._decimal(value) for value in values), Decimal('0')):.2f}"

    def _decimal(self, value: Decimal | int | str | None) -> Decimal:
        return Decimal(str(value or 0))
