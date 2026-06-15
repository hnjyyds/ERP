from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
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
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sales/quotations", tags=["export-quotations"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少出口报价权限")


def _raise_invalid_quotation() -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="出口报价数据无效",
    )


def _raise_quotation_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="出口报价不存在")


@router.get("", response_model=ApiResponse[ExportQuotationListResponse])
async def list_export_quotations(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationListResponse]:
    user = await _current_user(token, auth_service)
    try:
        quotations = await service.list_quotations(
            current_user=user,
            q=q,
            approval_status=approval_status,
            customer_id=customer_id,
        )
        return ApiResponse(data=quotations)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_quotation()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ExportQuotationResponse],
)
async def create_export_quotation(
    payload: ExportQuotationCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    user = await _current_user(token, auth_service)
    try:
        quotation = await service.create_quotation(current_user=user, payload=payload)
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/history", response_model=ApiResponse[ExportQuotationListResponse])
async def get_export_quotation_history(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationListResponse]:
    user = await _current_user(token, auth_service)
    try:
        history = await service.get_history(
            current_user=user,
            customer_id=customer_id,
            product_id=product_id,
        )
        return ApiResponse(data=history)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get(
    "/purchase-references",
    response_model=ApiResponse[ExportQuotationPurchaseReferenceListResponse],
)
async def get_export_quotation_purchase_references(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportQuotationPurchaseReferenceListResponse]:
    user = await _current_user(token, auth_service)
    try:
        references = await service.get_purchase_references(
            current_user=user,
            product_id=product_id,
        )
        return ApiResponse(data=references)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/{quotation_id}", response_model=ApiResponse[ExportQuotationResponse])
async def get_export_quotation(
    quotation_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    user = await _current_user(token, auth_service)
    try:
        quotation = await service.get_quotation(current_user=user, quotation_id=quotation_id)
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportQuotationNotFoundError:
        _raise_quotation_not_found()


@router.put("/{quotation_id}", response_model=ApiResponse[ExportQuotationResponse])
async def update_export_quotation(
    quotation_id: str,
    payload: ExportQuotationCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    user = await _current_user(token, auth_service)
    try:
        quotation = await service.update_quotation(
            current_user=user,
            quotation_id=quotation_id,
            payload=payload,
        )
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportQuotationNotFoundError:
        _raise_quotation_not_found()
    except ValueError:
        _raise_invalid_quotation()


@router.post("/{quotation_id}/submit", response_model=ApiResponse[ExportQuotationResponse])
async def submit_export_quotation(
    quotation_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    user = await _current_user(token, auth_service)
    try:
        quotation = await service.submit_quotation(
            current_user=user,
            quotation_id=quotation_id,
        )
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportQuotationNotFoundError:
        _raise_quotation_not_found()
    except ValueError:
        _raise_invalid_quotation()


@router.post("/{quotation_id}/approve", response_model=ApiResponse[ExportQuotationResponse])
async def approve_export_quotation(
    quotation_id: str,
    payload: ExportQuotationApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationResponse]:
    user = await _current_user(token, auth_service)
    try:
        quotation = await service.approve_quotation(
            current_user=user,
            quotation_id=quotation_id,
            payload=payload,
        )
        return ApiResponse(data=quotation)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportQuotationNotFoundError:
        _raise_quotation_not_found()
    except ValueError:
        _raise_invalid_quotation()


@router.post(
    "/{quotation_id}/confirm-contract",
    response_model=ApiResponse[ExportQuotationContractResponse],
)
async def confirm_export_quotation_contract(
    quotation_id: str,
    payload: ExportQuotationConfirmContract,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[ExportQuotationContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.confirm_contract(
            current_user=user,
            quotation_id=quotation_id,
            payload=payload,
        )
        return ApiResponse(data=contract)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportQuotationNotFoundError:
        _raise_quotation_not_found()
    except ValueError:
        _raise_invalid_quotation()


@router.get(
    "/{quotation_id}/sample-deliveries",
    response_model=ApiResponse[SampleDeliveryListResponse],
)
async def get_export_quotation_sample_deliveries(
    quotation_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
) -> ApiResponse[SampleDeliveryListResponse]:
    user = await _current_user(token, auth_service)
    try:
        deliveries = await service.get_sample_deliveries(
            current_user=user,
            quotation_id=quotation_id,
        )
        return ApiResponse(data=deliveries)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportQuotationNotFoundError:
        _raise_quotation_not_found()


@router.get("/{quotation_id}/export", response_model=ApiResponse[ExportQuotationExportResponse])
async def export_export_quotation(
    quotation_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportQuotationService, Depends(get_export_quotation_service)],
    export_format: Annotated[str, Query(alias="format", max_length=20)] = "pdf",
) -> ApiResponse[ExportQuotationExportResponse]:
    user = await _current_user(token, auth_service)
    try:
        export = await service.export_quotation(
            current_user=user,
            quotation_id=quotation_id,
            export_format=export_format,
        )
        return ApiResponse(data=export)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportQuotationNotFoundError:
        _raise_quotation_not_found()
    except ValueError:
        _raise_invalid_quotation()
