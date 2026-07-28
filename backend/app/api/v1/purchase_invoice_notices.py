from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.purchase.invoice_notices.providers import (
    get_purchase_invoice_notice_service,
)
from app.modules.purchase.invoice_notices.schemas import (
    PurchaseInvoiceNoticeGenerateFromDeclaration,
    PurchaseInvoiceNoticeListResponse,
    PurchaseInvoiceNoticeReceiveTaxInvoice,
    PurchaseInvoiceNoticeReminderListResponse,
    PurchaseInvoiceNoticeResponse,
    PurchaseInvoiceNoticeSend,
)
from app.modules.purchase.invoice_notices.services import (
    PurchaseInvoiceNoticeService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/purchase/invoice-notices", tags=["purchase-invoice-notices"])


@router.get("", response_model=ApiResponse[PurchaseInvoiceNoticeListResponse])
async def list_purchase_invoice_notices(
    user: CurrentUserDep,
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    customs_declaration_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseInvoiceNoticeListResponse]:
    notices = await service.list_notices(
        current_user=user,
        q=q,
        status=status_filter,
        supplier_id=supplier_id,
        customs_declaration_id=customs_declaration_id,
    )
    return ApiResponse(data=notices)


@router.post(
    "/from-customs-declaration",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseInvoiceNoticeListResponse],
)
async def generate_purchase_invoice_notices_from_customs_declaration(
    payload: PurchaseInvoiceNoticeGenerateFromDeclaration,
    user: CurrentUserDep,
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeListResponse]:
    notices = await service.generate_from_customs_declaration(
        current_user=user,
        payload=payload,
    )
    return ApiResponse(data=notices)


@router.get(
    "/reminders",
    response_model=ApiResponse[PurchaseInvoiceNoticeReminderListResponse],
)
async def list_purchase_invoice_notice_reminders(
    user: CurrentUserDep,
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeReminderListResponse]:
    reminders = await service.list_reminders(current_user=user)
    return ApiResponse(data=reminders)


@router.get("/{notice_id}", response_model=ApiResponse[PurchaseInvoiceNoticeResponse])
async def get_purchase_invoice_notice(
    notice_id: str,
    user: CurrentUserDep,
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeResponse]:
    notice = await service.get_notice(current_user=user, notice_id=notice_id)
    return ApiResponse(data=notice)


@router.post(
    "/{notice_id}/send",
    response_model=ApiResponse[PurchaseInvoiceNoticeResponse],
)
async def send_purchase_invoice_notice(
    notice_id: str,
    payload: PurchaseInvoiceNoticeSend,
    user: CurrentUserDep,
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeResponse]:
    notice = await service.send_notice(
        current_user=user,
        notice_id=notice_id,
        payload=payload,
    )
    return ApiResponse(data=notice)


@router.post(
    "/{notice_id}/receive-tax-invoice",
    response_model=ApiResponse[PurchaseInvoiceNoticeResponse],
)
async def receive_purchase_invoice_notice_tax_invoice(
    notice_id: str,
    payload: PurchaseInvoiceNoticeReceiveTaxInvoice,
    user: CurrentUserDep,
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeResponse]:
    notice = await service.receive_tax_invoice(
        current_user=user,
        notice_id=notice_id,
        payload=payload,
    )
    return ApiResponse(data=notice)
