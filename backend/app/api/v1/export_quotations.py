from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.permission_dependencies import require_permissions
from app.modules.sales.quotations.providers import get_export_quotation_service
from app.modules.sales.quotations.sample_link_schemas import (
    QuotationSampleRequestListResponse,
)
from app.modules.sales.quotations.schemas import (
    ExportQuotationApprove,
    ExportQuotationConfirmContract,
    ExportQuotationContractResponse,
    ExportQuotationCreate,
    ExportQuotationExportResponse,
    ExportQuotationListResponse,
    ExportQuotationPurchaseReferenceListResponse,
    ExportQuotationReject,
    ExportQuotationResponse,
    ExportQuotationSubmit,
    ExportQuotationWithdraw,
)
from app.modules.sales.quotations.services import (
    ExportQuotationService,
)
from app.modules.sales.quotations.services import (
    PermissionDeniedError as QuotationPermissionDeniedError,
)
from app.modules.sample.deliveries.schemas import SampleDeliveryListResponse
from app.modules.sample.requests.providers import get_sample_request_service
from app.modules.sample.requests.schemas import SampleRequestCreate, SampleRequestResponse
from app.modules.sample.requests.services import SampleRequestService
from app.modules.system.auth.permissions import SALES_QUOTATION_EXPORT_PERMISSION
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sales/quotations", tags=["export-quotations"])

_QUOTATION_EXPORT = Depends(
    require_permissions(
        SALES_QUOTATION_EXPORT_PERMISSION,
        error=QuotationPermissionDeniedError,
    )
)


@router.get("", response_model=ApiResponse[ExportQuotationListResponse])
async def list_export_quotations(
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationListResponse]:
    quotations = await service.list_quotations(
        current_user=user,
        q=q,
        approval_status=approval_status,
        customer_id=customer_id,
    )
    return ApiResponse(data=quotations)


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
    quotation = await service.create_quotation(current_user=user, payload=payload)
    return ApiResponse(data=quotation)


@router.get("/history", response_model=ApiResponse[ExportQuotationListResponse])
async def get_export_quotation_history(
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationListResponse]:
    history = await service.get_history(
        current_user=user,
        customer_id=customer_id,
        product_id=product_id,
    )
    return ApiResponse(data=history)


@router.get(
    "/purchase-references",
    response_model=ApiResponse[ExportQuotationPurchaseReferenceListResponse],
)
async def get_export_quotation_purchase_references(
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationPurchaseReferenceListResponse]:
    references = await service.get_purchase_references(
        current_user=user,
        product_id=product_id,
    )
    return ApiResponse(data=references)


@router.get("/{quotation_id}", response_model=ApiResponse[ExportQuotationResponse])
async def get_export_quotation(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    quotation = await service.get_quotation(current_user=user, quotation_id=quotation_id)
    return ApiResponse(data=quotation)


@router.put("/{quotation_id}", response_model=ApiResponse[ExportQuotationResponse])
async def update_export_quotation(
    quotation_id: str,
    payload: ExportQuotationCreate,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    quotation = await service.update_quotation(
        current_user=user,
        quotation_id=quotation_id,
        payload=payload,
    )
    return ApiResponse(data=quotation)


@router.post("/{quotation_id}/submit", response_model=ApiResponse[ExportQuotationResponse])
async def submit_export_quotation(
    quotation_id: str,
    payload: ExportQuotationSubmit,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    quotation = await service.submit_quotation(
        current_user=user,
        quotation_id=quotation_id,
        payload=payload,
    )
    return ApiResponse(data=quotation)


@router.post("/{quotation_id}/approve", response_model=ApiResponse[ExportQuotationResponse])
async def approve_export_quotation(
    quotation_id: str,
    payload: ExportQuotationApprove,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    quotation = await service.approve_quotation(
        current_user=user,
        quotation_id=quotation_id,
        payload=payload,
    )
    return ApiResponse(data=quotation)


@router.post("/{quotation_id}/reject", response_model=ApiResponse[ExportQuotationResponse])
async def reject_export_quotation(
    quotation_id: str,
    payload: ExportQuotationReject,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    quotation = await service.reject_quotation(
        current_user=user,
        quotation_id=quotation_id,
        payload=payload,
    )
    return ApiResponse(data=quotation)


@router.post("/{quotation_id}/withdraw", response_model=ApiResponse[ExportQuotationResponse])
async def withdraw_export_quotation(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    quotation = await service.withdraw_quotation(
        current_user=user,
        quotation_id=quotation_id,
        payload=ExportQuotationWithdraw(),
    )
    return ApiResponse(data=quotation)


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
    contract = await service.confirm_contract(
        current_user=user,
        quotation_id=quotation_id,
        payload=payload,
    )
    return ApiResponse(data=contract)


@router.get(
    "/{quotation_id}/sample-deliveries",
    response_model=ApiResponse[SampleDeliveryListResponse],
)
async def get_export_quotation_sample_deliveries(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[SampleDeliveryListResponse]:
    deliveries = await service.get_sample_deliveries(
        current_user=user,
        quotation_id=quotation_id,
    )
    return ApiResponse(data=deliveries)


@router.get(
    "/{quotation_id}/sample-requests",
    response_model=ApiResponse[QuotationSampleRequestListResponse],
)
async def get_export_quotation_sample_requests(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[QuotationSampleRequestListResponse]:
    requests = await service.get_sample_requests(
        current_user=user,
        quotation_id=quotation_id,
    )
    return ApiResponse(data=requests)


@router.post(
    "/{quotation_id}/sample-requests",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleRequestResponse],
)
async def create_sample_request_from_quotation(
    quotation_id: str,
    payload: SampleRequestCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRequestService, Depends(get_sample_request_service)],
) -> ApiResponse[SampleRequestResponse]:
    sample_request = await service.create_request_from_quotation(
        current_user=user,
        quotation_id=quotation_id,
        payload=payload,
    )
    return ApiResponse(data=sample_request)


@router.get(
    "/{quotation_id}/export",
    response_model=ApiResponse[ExportQuotationExportResponse],
    dependencies=[_QUOTATION_EXPORT],
)
async def export_export_quotation(
    quotation_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    export_format: Annotated[str, Query(alias="format", max_length=20)] = "pdf",
) -> ApiResponse[ExportQuotationExportResponse]:
    export = await service.export_quotation(
        current_user=user,
        quotation_id=quotation_id,
        export_format=export_format,
    )
    return ApiResponse(data=export)
