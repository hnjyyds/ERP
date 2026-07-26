from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
from app.modules.sales.quotations.providers import get_export_quotation_service
from app.modules.sales.quotations.schemas import (
    ExportQuotationApprove,
    ExportQuotationConfirmContract,
    ExportQuotationContractResponse,
    ExportQuotationCreate,
    ExportQuotationExportResponse,
    ExportQuotationListResponse,
    ExportQuotationPurchaseReferenceListResponse,
    ExportQuotationResponse,
)
from app.modules.sales.quotations.services import (
    ExportQuotationNotFoundError,
    ExportQuotationService,
    PermissionDeniedError,
)
from app.modules.sample.deliveries.schemas import SampleDeliveryListResponse
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sales/quotations", tags=["export-quotations"])


@router.get("", response_model=ApiResponse[ExportQuotationListResponse])
async def list_export_quotations(
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationListResponse]:
    try:
        quotations = await service.list_quotations(
            current_user=user,
            q=q,
            approval_status=approval_status,
            customer_id=customer_id,
        )
        return ApiResponse(data=quotations)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ValueError:
        raise_unprocessable("出口报价数据无效")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ExportQuotationResponse],
)
async def create_export_quotation(
    payload: ExportQuotationCreate,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    try:
        quotation = await service.create_quotation(current_user=user, payload=payload)
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")


@router.get("/history", response_model=ApiResponse[ExportQuotationListResponse])
async def get_export_quotation_history(
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationListResponse]:
    try:
        history = await service.get_history(
            current_user=user,
            customer_id=customer_id,
            product_id=product_id,
        )
        return ApiResponse(data=history)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")


@router.get(
    "/purchase-references",
    response_model=ApiResponse[ExportQuotationPurchaseReferenceListResponse],
)
async def get_export_quotation_purchase_references(
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationPurchaseReferenceListResponse]:
    try:
        references = await service.get_purchase_references(
            current_user=user,
            product_id=product_id,
        )
        return ApiResponse(data=references)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")


@router.get("/{quotation_id}", response_model=ApiResponse[ExportQuotationResponse])
async def get_export_quotation(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    try:
        quotation = await service.get_quotation(current_user=user, quotation_id=quotation_id)
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ExportQuotationNotFoundError:
        raise_not_found("出口报价不存在")


@router.put("/{quotation_id}", response_model=ApiResponse[ExportQuotationResponse])
async def update_export_quotation(
    quotation_id: str,
    payload: ExportQuotationCreate,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    try:
        quotation = await service.update_quotation(
            current_user=user,
            quotation_id=quotation_id,
            payload=payload,
        )
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ExportQuotationNotFoundError:
        raise_not_found("出口报价不存在")
    except ValueError:
        raise_unprocessable("出口报价数据无效")


@router.post("/{quotation_id}/submit", response_model=ApiResponse[ExportQuotationResponse])
async def submit_export_quotation(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    try:
        quotation = await service.submit_quotation(
            current_user=user,
            quotation_id=quotation_id,
        )
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ExportQuotationNotFoundError:
        raise_not_found("出口报价不存在")
    except ValueError:
        raise_unprocessable("出口报价数据无效")


@router.post("/{quotation_id}/approve", response_model=ApiResponse[ExportQuotationResponse])
async def approve_export_quotation(
    quotation_id: str,
    payload: ExportQuotationApprove,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    try:
        quotation = await service.approve_quotation(
            current_user=user,
            quotation_id=quotation_id,
            payload=payload,
        )
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ExportQuotationNotFoundError:
        raise_not_found("出口报价不存在")
    except ValueError:
        raise_unprocessable("出口报价数据无效")


@router.post(
    "/{quotation_id}/confirm-contract",
    response_model=ApiResponse[ExportQuotationContractResponse],
)
async def confirm_export_quotation_contract(
    quotation_id: str,
    payload: ExportQuotationConfirmContract,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationContractResponse]:
    try:
        contract = await service.confirm_contract(
            current_user=user,
            quotation_id=quotation_id,
            payload=payload,
        )
        return ApiResponse(data=contract)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ExportQuotationNotFoundError:
        raise_not_found("出口报价不存在")
    except ValueError:
        raise_unprocessable("出口报价数据无效")


@router.get(
    "/{quotation_id}/sample-deliveries",
    response_model=ApiResponse[SampleDeliveryListResponse],
)
async def get_export_quotation_sample_deliveries(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[SampleDeliveryListResponse]:
    try:
        deliveries = await service.get_sample_deliveries(
            current_user=user,
            quotation_id=quotation_id,
        )
        return ApiResponse(data=deliveries)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ExportQuotationNotFoundError:
        raise_not_found("出口报价不存在")


@router.get("/{quotation_id}/export", response_model=ApiResponse[ExportQuotationExportResponse])
async def export_export_quotation(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    export_format: Annotated[str, Query(alias="format", max_length=20)] = "pdf",
) -> ApiResponse[ExportQuotationExportResponse]:
    try:
        export = await service.export_quotation(
            current_user=user,
            quotation_id=quotation_id,
            export_format=export_format,
        )
        return ApiResponse(data=export)
    except PermissionDeniedError:
        raise_permission_denied("缺少出口报价权限")
    except ExportQuotationNotFoundError:
        raise_not_found("出口报价不存在")
    except ValueError:
        raise_unprocessable("出口报价数据无效")
