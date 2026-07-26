from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
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
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/purchase/inquiries", tags=["purchase-inquiries"])


@router.get("", response_model=ApiResponse[PurchaseInquiryListResponse])
async def list_purchase_inquiries(
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[
        str | None,
        Query(alias="status", max_length=40),
    ] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseInquiryListResponse]:
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
        raise_permission_denied("缺少采购询价权限")
    except ValueError:
        raise_unprocessable("采购询价数据无效")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseInquiryResponse],
)
async def create_purchase_inquiry(
    payload: PurchaseInquiryCreate,
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    try:
        inquiry = await service.create_inquiry(current_user=user, payload=payload)
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购询价权限")


@router.put("/{inquiry_id}", response_model=ApiResponse[PurchaseInquiryResponse])
async def update_purchase_inquiry(
    inquiry_id: str,
    payload: PurchaseInquiryUpdate,
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    try:
        inquiry = await service.update_inquiry(
            current_user=user,
            inquiry_id=inquiry_id,
            payload=payload,
        )
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购询价权限")
    except PurchaseInquiryNotFoundError:
        raise_not_found("采购询价不存在")
    except ValueError:
        raise_unprocessable("采购询价数据无效")


@router.get(
    "/references",
    response_model=ApiResponse[PurchaseInquiryReferenceListResponse],
)
async def get_purchase_inquiry_references(
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[PurchaseInquiryReferenceListResponse]:
    try:
        references = await service.get_purchase_references(
            current_user=user,
            product_id=product_id,
        )
        return ApiResponse(data=references)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购询价权限")


@router.get(
    "/supplier-samples",
    response_model=ApiResponse[SupplierSampleEvidenceListResponse],
)
async def get_purchase_inquiry_supplier_samples(
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
    product_id: Annotated[str | None, Query(max_length=36)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SupplierSampleEvidenceListResponse]:
    try:
        samples = await service.get_supplier_samples(
            current_user=user,
            product_id=product_id,
            supplier_id=supplier_id,
        )
        return ApiResponse(data=samples)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购询价权限")


@router.get("/{inquiry_id}", response_model=ApiResponse[PurchaseInquiryResponse])
async def get_purchase_inquiry(
    inquiry_id: str,
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    try:
        inquiry = await service.get_inquiry(current_user=user, inquiry_id=inquiry_id)
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购询价权限")
    except PurchaseInquiryNotFoundError:
        raise_not_found("采购询价不存在")


@router.post(
    "/{inquiry_id}/quotations",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseInquiryResponse],
)
async def add_purchase_inquiry_supplier_quotation(
    inquiry_id: str,
    payload: SupplierQuotationCreate,
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryResponse]:
    try:
        inquiry = await service.add_supplier_quotation(
            current_user=user,
            inquiry_id=inquiry_id,
            payload=payload,
        )
        return ApiResponse(data=inquiry)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购询价权限")
    except PurchaseInquiryNotFoundError:
        raise_not_found("采购询价不存在")
    except ValueError:
        raise_unprocessable("采购询价数据无效")


@router.post(
    "/{inquiry_id}/send-template",
    response_model=ApiResponse[PurchaseInquiryTemplateResponse],
)
async def send_purchase_inquiry_template(
    inquiry_id: str,
    payload: PurchaseInquiryTemplateSend,
    user: CurrentUserDep,
    service: Annotated[PurchaseInquiryService, Depends(get_purchase_inquiry_service)],
) -> ApiResponse[PurchaseInquiryTemplateResponse]:
    try:
        template = await service.send_template(
            current_user=user,
            inquiry_id=inquiry_id,
            payload=payload,
        )
        return ApiResponse(data=template)
    except PermissionDeniedError:
        raise_permission_denied("缺少采购询价权限")
    except PurchaseInquiryNotFoundError:
        raise_not_found("采购询价不存在")
