from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.purchase.inquiries.providers import get_purchase_inquiry_service
from app.modules.purchase.inquiries.schemas import (
    PurchaseInquiryCreate,
    PurchaseInquiryListResponse,
    PurchaseInquiryReferenceListResponse,
    PurchaseInquiryResponse,
    PurchaseInquiryTemplateResponse,
    PurchaseInquiryTemplateSend,
    PurchaseInquiryUpdate,
    SupplierQuotationCreate,
    SupplierSampleEvidenceListResponse,
)
from app.modules.purchase.inquiries.services import (
    PermissionDeniedError,
    PurchaseInquiryNotFoundError,
    PurchaseInquiryService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/purchase/inquiries", tags=["purchase-inquiries"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少采购询价权限")


def _raise_invalid_inquiry() -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="采购询价数据无效",
    )


def _raise_inquiry_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="采购询价不存在")


@router.get("", response_model=ApiResponse[PurchaseInquiryListResponse])
async def list_purchase_inquiries(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[
        str | None,
        Query(alias="status", max_length=40),
    ] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseInquiryListResponse]:
    user = await _current_user(token, auth_service)
    try:
        inquiries = await service.list_inquiries(
            current_user=user,
            q=q,
            status=status_filter,
            product_id=product_id,
            supplier_id=supplier_id,
        )
        return ApiResponse(data=inquiries)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_inquiry()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseInquiryResponse],
)
async def create_purchase_inquiry(
    payload: PurchaseInquiryCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    user = await _current_user(token, auth_service)
    try:
        inquiry = await service.create_inquiry(current_user=user, payload=payload)
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.put("/{inquiry_id}", response_model=ApiResponse[PurchaseInquiryResponse])
async def update_purchase_inquiry(
    inquiry_id: str,
    payload: PurchaseInquiryUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    user = await _current_user(token, auth_service)
    try:
        inquiry = await service.update_inquiry(
            current_user=user,
            inquiry_id=inquiry_id,
            payload=payload,
        )
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseInquiryNotFoundError:
        _raise_inquiry_not_found()
    except ValueError:
        _raise_invalid_inquiry()


@router.get(
    "/references",
    response_model=ApiResponse[PurchaseInquiryReferenceListResponse],
)
async def get_purchase_inquiry_references(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseInquiryReferenceListResponse]:
    user = await _current_user(token, auth_service)
    try:
        references = await service.get_purchase_references(
            current_user=user,
            product_id=product_id,
        )
        return ApiResponse(data=references)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get(
    "/supplier-samples",
    response_model=ApiResponse[SupplierSampleEvidenceListResponse],
)
async def get_purchase_inquiry_supplier_samples(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
    product_id: Annotated[str | None, Query(max_length=36)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SupplierSampleEvidenceListResponse]:
    user = await _current_user(token, auth_service)
    try:
        samples = await service.get_supplier_samples(
            current_user=user,
            product_id=product_id,
            supplier_id=supplier_id,
        )
        return ApiResponse(data=samples)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/{inquiry_id}", response_model=ApiResponse[PurchaseInquiryResponse])
async def get_purchase_inquiry(
    inquiry_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    user = await _current_user(token, auth_service)
    try:
        inquiry = await service.get_inquiry(current_user=user, inquiry_id=inquiry_id)
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseInquiryNotFoundError:
        _raise_inquiry_not_found()


@router.post(
    "/{inquiry_id}/quotations",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseInquiryResponse],
)
async def add_purchase_inquiry_supplier_quotation(
    inquiry_id: str,
    payload: SupplierQuotationCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    user = await _current_user(token, auth_service)
    try:
        inquiry = await service.add_supplier_quotation(
            current_user=user,
            inquiry_id=inquiry_id,
            payload=payload,
        )
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseInquiryNotFoundError:
        _raise_inquiry_not_found()
    except ValueError:
        _raise_invalid_inquiry()


@router.post(
    "/{inquiry_id}/send-template",
    response_model=ApiResponse[PurchaseInquiryTemplateResponse],
)
async def send_purchase_inquiry_template(
    inquiry_id: str,
    payload: PurchaseInquiryTemplateSend,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryTemplateResponse]:
    user = await _current_user(token, auth_service)
    try:
        template = await service.send_template(
            current_user=user,
            inquiry_id=inquiry_id,
            payload=payload,
        )
        return ApiResponse(data=template)
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseInquiryNotFoundError:
        _raise_inquiry_not_found()
