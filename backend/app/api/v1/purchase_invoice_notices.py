from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
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
    PermissionDeniedError,
    PurchaseInvoiceNoticeNotFoundError,
    PurchaseInvoiceNoticeService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/purchase/invoice-notices", tags=["purchase-invoice-notices"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少开票通知权限")


def _raise_invalid_notice() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="开票通知数据无效",
    )


def _raise_notice_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="开票通知不存在")


@router.get("", response_model=ApiResponse[PurchaseInvoiceNoticeListResponse])
async def list_purchase_invoice_notices(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    customs_declaration_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseInvoiceNoticeListResponse]:
    user = await _current_user(token, auth_service)
    try:
        notices = await service.list_notices(
            current_user=user,
            q=q,
            status=status_filter,
            supplier_id=supplier_id,
            customs_declaration_id=customs_declaration_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_notice()
    return ApiResponse(data=notices)


@router.post(
    "/from-customs-declaration",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseInvoiceNoticeListResponse],
)
async def generate_purchase_invoice_notices_from_customs_declaration(
    payload: PurchaseInvoiceNoticeGenerateFromDeclaration,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeListResponse]:
    user = await _current_user(token, auth_service)
    try:
        notices = await service.generate_from_customs_declaration(
            current_user=user,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_notice()
    return ApiResponse(data=notices)


@router.get(
    "/reminders",
    response_model=ApiResponse[PurchaseInvoiceNoticeReminderListResponse],
)
async def list_purchase_invoice_notice_reminders(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeReminderListResponse]:
    user = await _current_user(token, auth_service)
    try:
        reminders = await service.list_reminders(current_user=user)
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=reminders)


@router.get("/{notice_id}", response_model=ApiResponse[PurchaseInvoiceNoticeResponse])
async def get_purchase_invoice_notice(
    notice_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeResponse]:
    user = await _current_user(token, auth_service)
    try:
        notice = await service.get_notice(current_user=user, notice_id=notice_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseInvoiceNoticeNotFoundError:
        _raise_notice_not_found()
    return ApiResponse(data=notice)


@router.post(
    "/{notice_id}/send",
    response_model=ApiResponse[PurchaseInvoiceNoticeResponse],
)
async def send_purchase_invoice_notice(
    notice_id: str,
    payload: PurchaseInvoiceNoticeSend,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeResponse]:
    user = await _current_user(token, auth_service)
    try:
        notice = await service.send_notice(
            current_user=user,
            notice_id=notice_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseInvoiceNoticeNotFoundError:
        _raise_notice_not_found()
    except ValueError:
        _raise_invalid_notice()
    return ApiResponse(data=notice)


@router.post(
    "/{notice_id}/receive-tax-invoice",
    response_model=ApiResponse[PurchaseInvoiceNoticeResponse],
)
async def receive_purchase_invoice_notice_tax_invoice(
    notice_id: str,
    payload: PurchaseInvoiceNoticeReceiveTaxInvoice,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[
        PurchaseInvoiceNoticeService,
        Depends(get_purchase_invoice_notice_service),
    ],
) -> ApiResponse[PurchaseInvoiceNoticeResponse]:
    user = await _current_user(token, auth_service)
    try:
        notice = await service.receive_tax_invoice(
            current_user=user,
            notice_id=notice_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseInvoiceNoticeNotFoundError:
        _raise_notice_not_found()
    except ValueError:
        _raise_invalid_notice()
    return ApiResponse(data=notice)
