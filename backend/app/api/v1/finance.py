from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.finance.fee_payments.providers import get_fee_payment_service
from app.modules.finance.fee_payments.schemas import (
    FeePayableListResponse,
    FeePaymentRequestApprove,
    FeePaymentRequestCreate,
    FeePaymentRequestListResponse,
    FeePaymentRequestResponse,
    PartnerFeeInvoiceCreate,
    PartnerFeeInvoiceListResponse,
    PartnerFeeInvoiceResponse,
)
from app.modules.finance.fee_payments.services import (
    FeePaymentNotFoundError,
    FeePaymentService,
)
from app.modules.finance.fee_payments.services import (
    PermissionDeniedError as FeePaymentPermissionDeniedError,
)
from app.modules.finance.misc_fees.providers import get_misc_fee_service
from app.modules.finance.misc_fees.schemas import (
    MiscFeeAllocationCreate,
    MiscFeeAllocationListResponse,
    MiscFeeAllocationResponse,
    MiscFeeItemCreate,
    MiscFeeItemListResponse,
    MiscFeeItemResponse,
)
from app.modules.finance.misc_fees.services import (
    MiscFeeNotFoundError,
    MiscFeeService,
)
from app.modules.finance.misc_fees.services import (
    PermissionDeniedError as MiscFeePermissionDeniedError,
)
from app.modules.finance.overview.providers import get_finance_overview_service
from app.modules.finance.overview.schemas import FinanceOverviewResponse
from app.modules.finance.overview.services import (
    FinanceOverviewService,
)
from app.modules.finance.overview.services import (
    PermissionDeniedError as OverviewPermissionDeniedError,
)
from app.modules.finance.payments.providers import get_payment_service
from app.modules.finance.payments.schemas import (
    PayableListResponse,
    PaymentRequestApprove,
    PaymentRequestCreate,
    PaymentRequestListResponse,
    PaymentRequestResponse,
    SupplierInvoiceCreate,
    SupplierInvoiceListResponse,
    SupplierInvoiceResponse,
)
from app.modules.finance.payments.services import (
    PaymentNotFoundError,
    PaymentService,
)
from app.modules.finance.payments.services import (
    PermissionDeniedError as PaymentPermissionDeniedError,
)
from app.modules.finance.receipts.providers import get_receipt_service
from app.modules.finance.receipts.schemas import (
    BankReceiptCreate,
    BankReceiptListResponse,
    BankReceiptResponse,
    ReceiptAllocationCreate,
    ReceiptClaimCreate,
    ReceivableListResponse,
)
from app.modules.finance.receipts.services import (
    PermissionDeniedError as ReceiptPermissionDeniedError,
)
from app.modules.finance.receipts.services import (
    ReceiptNotFoundError,
    ReceiptService,
)
from app.modules.finance.settlements.providers import get_financial_settlement_service
from app.modules.finance.settlements.schemas import (
    FinancialSettlementCreate,
    FinancialSettlementListResponse,
    FinancialSettlementResponse,
    ManualProfitCostCreate,
    ProfitCalculationListResponse,
)
from app.modules.finance.settlements.services import (
    FinancialSettlementNotFoundError,
    FinancialSettlementService,
)
from app.modules.finance.settlements.services import (
    PermissionDeniedError as SettlementPermissionDeniedError,
)
from app.modules.finance.tax_refunds.providers import get_tax_refund_service
from app.modules.finance.tax_refunds.schemas import (
    CustomsReceiptRegister,
    TaxRefundRegister,
    VerificationDocumentCreate,
    VerificationDocumentListResponse,
    VerificationDocumentResponse,
    VerificationRegister,
    VerificationUsageListResponse,
)
from app.modules.finance.tax_refunds.services import (
    PermissionDeniedError as TaxRefundPermissionDeniedError,
)
from app.modules.finance.tax_refunds.services import (
    TaxRefundNotFoundError,
    TaxRefundService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/finance", tags=["finance"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少财务管理权限")


def _raise_unprocessable(message: str) -> None:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=message)


@router.get("/overview", response_model=ApiResponse[FinanceOverviewResponse])
async def get_finance_overview(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinanceOverviewService, Depends(get_finance_overview_service)],
) -> ApiResponse[FinanceOverviewResponse]:
    user = await _current_user(token, auth_service)
    try:
        overview = await service.get_overview(current_user=user)
    except OverviewPermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=overview)


@router.get("/receipts", response_model=ApiResponse[BankReceiptListResponse])
async def list_bank_receipts(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[BankReceiptListResponse]:
    user = await _current_user(token, auth_service)
    try:
        receipts = await service.list_receipts(
            current_user=user,
            q=q,
            status=status_filter,
            customer_id=customer_id,
        )
    except ReceiptPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=receipts)


@router.post(
    "/receipts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[BankReceiptResponse],
)
async def create_bank_receipt(
    payload: BankReceiptCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ApiResponse[BankReceiptResponse]:
    user = await _current_user(token, auth_service)
    try:
        receipt = await service.create_receipt(current_user=user, payload=payload)
    except ReceiptPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=receipt)


@router.post(
    "/receipts/{receipt_id}/claim",
    response_model=ApiResponse[BankReceiptResponse],
)
async def claim_bank_receipt(
    receipt_id: str,
    payload: ReceiptClaimCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ApiResponse[BankReceiptResponse]:
    user = await _current_user(token, auth_service)
    try:
        receipt = await service.claim_receipt(
            current_user=user,
            receipt_id=receipt_id,
            payload=payload,
        )
    except ReceiptPermissionDeniedError:
        _raise_permission_denied()
    except ReceiptNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="银行水单不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=receipt)


@router.post(
    "/receipts/{receipt_id}/allocations",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[BankReceiptResponse],
)
async def allocate_bank_receipt(
    receipt_id: str,
    payload: ReceiptAllocationCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ApiResponse[BankReceiptResponse]:
    user = await _current_user(token, auth_service)
    try:
        receipt = await service.allocate_receipt(
            current_user=user,
            receipt_id=receipt_id,
            payload=payload,
        )
    except ReceiptPermissionDeniedError:
        _raise_permission_denied()
    except ReceiptNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="银行水单不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=receipt)


@router.get("/receivables", response_model=ApiResponse[ReceivableListResponse])
async def list_receivables(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    contract_no: Annotated[str | None, Query(max_length=80)] = None,
    invoice_no: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[ReceivableListResponse]:
    user = await _current_user(token, auth_service)
    try:
        receivables = await service.list_receivables(
            current_user=user,
            q=q,
            customer_id=customer_id,
            sales_user_id=sales_user_id,
            contract_no=contract_no,
            invoice_no=invoice_no,
        )
    except ReceiptPermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=receivables)


@router.post(
    "/supplier-invoices",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SupplierInvoiceResponse],
)
async def create_supplier_invoice(
    payload: SupplierInvoiceCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PaymentService, Depends(get_payment_service)],
) -> ApiResponse[SupplierInvoiceResponse]:
    user = await _current_user(token, auth_service)
    try:
        invoice = await service.create_supplier_invoice(current_user=user, payload=payload)
    except PaymentPermissionDeniedError:
        _raise_permission_denied()
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="供应商发票不存在",
        ) from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=invoice)


@router.get("/supplier-invoices", response_model=ApiResponse[SupplierInvoiceListResponse])
async def list_supplier_invoices(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PaymentService, Depends(get_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[SupplierInvoiceListResponse]:
    user = await _current_user(token, auth_service)
    try:
        invoices = await service.list_supplier_invoices(
            current_user=user,
            q=q,
            status=status_filter,
            supplier_id=supplier_id,
            purchase_contract_no=purchase_contract_no,
        )
    except PaymentPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=invoices)


@router.post(
    "/payment-requests",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PaymentRequestResponse],
)
async def create_payment_request(
    payload: PaymentRequestCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PaymentService, Depends(get_payment_service)],
) -> ApiResponse[PaymentRequestResponse]:
    user = await _current_user(token, auth_service)
    try:
        payment_request = await service.create_payment_request(
            current_user=user,
            payload=payload,
        )
    except PaymentPermissionDeniedError:
        _raise_permission_denied()
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="付款申请不存在",
        ) from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=payment_request)


@router.get("/payment-requests", response_model=ApiResponse[PaymentRequestListResponse])
async def list_payment_requests(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PaymentService, Depends(get_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    payment_type: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PaymentRequestListResponse]:
    user = await _current_user(token, auth_service)
    try:
        payment_requests = await service.list_payment_requests(
            current_user=user,
            q=q,
            status=status_filter,
            payment_type=payment_type,
            supplier_id=supplier_id,
        )
    except PaymentPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=payment_requests)


@router.post(
    "/payment-requests/{payment_request_id}/approve",
    response_model=ApiResponse[PaymentRequestResponse],
)
async def approve_payment_request(
    payment_request_id: str,
    payload: PaymentRequestApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PaymentService, Depends(get_payment_service)],
) -> ApiResponse[PaymentRequestResponse]:
    user = await _current_user(token, auth_service)
    try:
        payment_request = await service.approve_payment_request(
            current_user=user,
            payment_request_id=payment_request_id,
            payload=payload,
        )
    except PaymentPermissionDeniedError:
        _raise_permission_denied()
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="付款申请不存在",
        ) from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=payment_request)


@router.get("/payables", response_model=ApiResponse[PayableListResponse])
async def list_payables(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PaymentService, Depends(get_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[PayableListResponse]:
    user = await _current_user(token, auth_service)
    try:
        payables = await service.list_payables(
            current_user=user,
            q=q,
            status=status_filter,
            supplier_id=supplier_id,
            purchase_contract_no=purchase_contract_no,
        )
    except PaymentPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=payables)


@router.post(
    "/partner-fee-invoices",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PartnerFeeInvoiceResponse],
)
async def create_partner_fee_invoice(
    payload: PartnerFeeInvoiceCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
) -> ApiResponse[PartnerFeeInvoiceResponse]:
    user = await _current_user(token, auth_service)
    try:
        invoice = await service.create_partner_fee_invoice(current_user=user, payload=payload)
    except FeePaymentPermissionDeniedError:
        _raise_permission_denied()
    except FeePaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴费用发票不存在",
        ) from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=invoice)


@router.get(
    "/partner-fee-invoices",
    response_model=ApiResponse[PartnerFeeInvoiceListResponse],
)
async def list_partner_fee_invoices(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    partner_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[PartnerFeeInvoiceListResponse]:
    user = await _current_user(token, auth_service)
    try:
        invoices = await service.list_partner_fee_invoices(
            current_user=user,
            q=q,
            status=status_filter,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
    except FeePaymentPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=invoices)


@router.post(
    "/fee-payment-requests",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FeePaymentRequestResponse],
)
async def create_fee_payment_request(
    payload: FeePaymentRequestCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
) -> ApiResponse[FeePaymentRequestResponse]:
    user = await _current_user(token, auth_service)
    try:
        fee_payment_request = await service.create_fee_payment_request(
            current_user=user,
            payload=payload,
        )
    except FeePaymentPermissionDeniedError:
        _raise_permission_denied()
    except FeePaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="付费申请不存在",
        ) from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=fee_payment_request)


@router.get(
    "/fee-payment-requests",
    response_model=ApiResponse[FeePaymentRequestListResponse],
)
async def list_fee_payment_requests(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    partner_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FeePaymentRequestListResponse]:
    user = await _current_user(token, auth_service)
    try:
        fee_payment_requests = await service.list_fee_payment_requests(
            current_user=user,
            q=q,
            status=status_filter,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
    except FeePaymentPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=fee_payment_requests)


@router.post(
    "/fee-payment-requests/{fee_payment_request_id}/approve",
    response_model=ApiResponse[FeePaymentRequestResponse],
)
async def approve_fee_payment_request(
    fee_payment_request_id: str,
    payload: FeePaymentRequestApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
) -> ApiResponse[FeePaymentRequestResponse]:
    user = await _current_user(token, auth_service)
    try:
        fee_payment_request = await service.approve_fee_payment_request(
            current_user=user,
            fee_payment_request_id=fee_payment_request_id,
            payload=payload,
        )
    except FeePaymentPermissionDeniedError:
        _raise_permission_denied()
    except FeePaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="付费申请不存在",
        ) from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=fee_payment_request)


@router.get("/fee-payables", response_model=ApiResponse[FeePayableListResponse])
async def list_fee_payables(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FeePaymentService, Depends(get_fee_payment_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    fee_type: Annotated[str | None, Query(max_length=40)] = None,
    partner_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FeePayableListResponse]:
    user = await _current_user(token, auth_service)
    try:
        payables = await service.list_fee_payables(
            current_user=user,
            q=q,
            status=status_filter,
            fee_type=fee_type,
            partner_id=partner_id,
            sales_user_id=sales_user_id,
            shipment_no=shipment_no,
        )
    except FeePaymentPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=payables)


@router.post(
    "/misc-fee-items",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[MiscFeeItemResponse],
)
async def create_misc_fee_item(
    payload: MiscFeeItemCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
) -> ApiResponse[MiscFeeItemResponse]:
    user = await _current_user(token, auth_service)
    try:
        item = await service.create_item(current_user=user, payload=payload)
    except MiscFeePermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=item)


@router.get("/misc-fee-items", response_model=ApiResponse[MiscFeeItemListResponse])
async def list_misc_fee_items(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[MiscFeeItemListResponse]:
    user = await _current_user(token, auth_service)
    try:
        items = await service.list_items(
            current_user=user,
            q=q,
            category=category,
            status=status_filter,
        )
    except MiscFeePermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=items)


@router.post(
    "/misc-fee-allocations",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[MiscFeeAllocationResponse],
)
async def create_misc_fee_allocation(
    payload: MiscFeeAllocationCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
) -> ApiResponse[MiscFeeAllocationResponse]:
    user = await _current_user(token, auth_service)
    try:
        allocation = await service.create_allocation(current_user=user, payload=payload)
    except MiscFeePermissionDeniedError:
        _raise_permission_denied()
    except MiscFeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="杂费项目不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=allocation)


@router.get(
    "/misc-fee-allocations",
    response_model=ApiResponse[MiscFeeAllocationListResponse],
)
async def list_misc_fee_allocations(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    item_id: Annotated[str | None, Query(max_length=36)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[MiscFeeAllocationListResponse]:
    user = await _current_user(token, auth_service)
    try:
        allocations = await service.list_allocations(
            current_user=user,
            q=q,
            item_id=item_id,
            category=category,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            status=status_filter,
        )
    except MiscFeePermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=allocations)


@router.get(
    "/misc-fee-allocations/summary",
    response_model=ApiResponse[MiscFeeAllocationListResponse],
)
async def list_misc_fee_allocation_summary(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    item_id: Annotated[str | None, Query(max_length=36)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[MiscFeeAllocationListResponse]:
    user = await _current_user(token, auth_service)
    try:
        summary = await service.list_allocation_summary(
            current_user=user,
            q=q,
            item_id=item_id,
            category=category,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            status=status_filter,
        )
    except MiscFeePermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=summary)


@router.post(
    "/settlements",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FinancialSettlementResponse],
)
async def create_financial_settlement(
    payload: FinancialSettlementCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
) -> ApiResponse[FinancialSettlementResponse]:
    user = await _current_user(token, auth_service)
    try:
        settlement = await service.create_settlement(current_user=user, payload=payload)
    except SettlementPermissionDeniedError:
        _raise_permission_denied()
    except FinancialSettlementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="财务结算不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=settlement)


@router.get(
    "/settlements",
    response_model=ApiResponse[FinancialSettlementListResponse],
)
async def list_financial_settlements(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FinancialSettlementListResponse]:
    user = await _current_user(token, auth_service)
    try:
        settlements = await service.list_settlements(
            current_user=user,
            q=q,
            status=status_filter,
            shipment_no=shipment_no,
        )
    except SettlementPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=settlements)


@router.post(
    "/settlements/{settlement_id}/manual-costs",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FinancialSettlementResponse],
)
async def add_manual_profit_cost(
    settlement_id: str,
    payload: ManualProfitCostCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
) -> ApiResponse[FinancialSettlementResponse]:
    user = await _current_user(token, auth_service)
    try:
        settlement = await service.add_manual_cost(
            current_user=user,
            settlement_id=settlement_id,
            payload=payload,
        )
    except SettlementPermissionDeniedError:
        _raise_permission_denied()
    except FinancialSettlementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="财务结算不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=settlement)


@router.get(
    "/profit-calculations",
    response_model=ApiResponse[ProfitCalculationListResponse],
)
async def list_profit_calculations(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[ProfitCalculationListResponse]:
    user = await _current_user(token, auth_service)
    try:
        calculations = await service.list_profit_calculations(
            current_user=user,
            q=q,
            shipment_no=shipment_no,
        )
    except SettlementPermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=calculations)


@router.post(
    "/verification-documents",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def create_verification_document(
    payload: VerificationDocumentCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await _current_user(token, auth_service)
    try:
        document = await service.create_document(current_user=user, payload=payload)
    except TaxRefundPermissionDeniedError:
        _raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=document)


@router.get(
    "/verification-documents",
    response_model=ApiResponse[VerificationDocumentListResponse],
)
async def list_verification_documents(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    owner_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    reminder_status: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[VerificationDocumentListResponse]:
    user = await _current_user(token, auth_service)
    try:
        documents = await service.list_documents(
            current_user=user,
            q=q,
            status=status_filter,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
        )
    except TaxRefundPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=documents)


@router.post(
    "/verification-documents/{verification_document_id}/customs-receipt",
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def register_verification_customs_receipt(
    verification_document_id: str,
    payload: CustomsReceiptRegister,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await _current_user(token, auth_service)
    try:
        document = await service.register_customs_receipt(
            current_user=user,
            document_id=verification_document_id,
            payload=payload,
        )
    except TaxRefundPermissionDeniedError:
        _raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=document)


@router.post(
    "/verification-documents/{verification_document_id}/verify",
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def register_verification(
    verification_document_id: str,
    payload: VerificationRegister,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await _current_user(token, auth_service)
    try:
        document = await service.register_verification(
            current_user=user,
            document_id=verification_document_id,
            payload=payload,
        )
    except TaxRefundPermissionDeniedError:
        _raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=document)


@router.post(
    "/verification-documents/{verification_document_id}/tax-refunds",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def register_tax_refund(
    verification_document_id: str,
    payload: TaxRefundRegister,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await _current_user(token, auth_service)
    try:
        document = await service.register_tax_refund(
            current_user=user,
            document_id=verification_document_id,
            payload=payload,
        )
    except TaxRefundPermissionDeniedError:
        _raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=document)


@router.get("/verification-usage", response_model=ApiResponse[VerificationUsageListResponse])
async def list_verification_usage(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    owner_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    reminder_status: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[VerificationUsageListResponse]:
    user = await _current_user(token, auth_service)
    try:
        usage = await service.list_usage(
            current_user=user,
            q=q,
            status=status_filter,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
        )
    except TaxRefundPermissionDeniedError:
        _raise_permission_denied()
    except ValueError as exc:
        _raise_unprocessable(str(exc))
    return ApiResponse(data=usage)
