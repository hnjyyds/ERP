from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.sales.contracts.providers import get_export_contract_service
from app.modules.sales.contracts.schemas import (
    ExportContractAdvancePaymentCreate,
    ExportContractAdvancePaymentResponse,
    ExportContractApprove,
    ExportContractCreate,
    ExportContractExportResponse,
    ExportContractListResponse,
    ExportContractResponse,
    ExportContractSignatureCreate,
)
from app.modules.sales.contracts.services import (
    ExportContractNotFoundError,
    ExportContractService,
    PermissionDeniedError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sales/contracts", tags=["export-contracts"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少出口合同权限")


def _raise_invalid_contract() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="出口合同数据无效",
    )


def _raise_contract_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="出口合同不存在")


@router.get("", response_model=ApiResponse[ExportContractListResponse])
async def list_export_contracts(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportContractListResponse]:
    user = await _current_user(token, auth_service)
    try:
        contracts = await service.list_contracts(
            current_user=user,
            q=q,
            approval_status=approval_status,
            customer_id=customer_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contracts)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ExportContractResponse],
)
async def create_export_contract(
    payload: ExportContractCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.create_contract(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=contract)


@router.get("/{contract_id}", response_model=ApiResponse[ExportContractResponse])
async def get_export_contract(
    contract_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.get_contract(current_user=user, contract_id=contract_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportContractNotFoundError:
        _raise_contract_not_found()
    return ApiResponse(data=contract)


@router.put("/{contract_id}", response_model=ApiResponse[ExportContractResponse])
async def update_export_contract(
    contract_id: str,
    payload: ExportContractCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.update_contract(
            current_user=user,
            contract_id=contract_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportContractNotFoundError:
        _raise_contract_not_found()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)


@router.post("/{contract_id}/submit", response_model=ApiResponse[ExportContractResponse])
async def submit_export_contract(
    contract_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.submit_contract(
            current_user=user,
            contract_id=contract_id,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportContractNotFoundError:
        _raise_contract_not_found()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)


@router.post("/{contract_id}/approve", response_model=ApiResponse[ExportContractResponse])
async def approve_export_contract(
    contract_id: str,
    payload: ExportContractApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.approve_contract(
            current_user=user,
            contract_id=contract_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportContractNotFoundError:
        _raise_contract_not_found()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)


@router.post("/{contract_id}/signature", response_model=ApiResponse[ExportContractResponse])
async def register_export_contract_signature(
    contract_id: str,
    payload: ExportContractSignatureCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.register_signature(
            current_user=user,
            contract_id=contract_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportContractNotFoundError:
        _raise_contract_not_found()
    return ApiResponse(data=contract)


@router.post(
    "/{contract_id}/advance-payments",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ExportContractAdvancePaymentResponse],
)
async def add_export_contract_advance_payment(
    contract_id: str,
    payload: ExportContractAdvancePaymentCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractAdvancePaymentResponse]:
    user = await _current_user(token, auth_service)
    try:
        payment = await service.add_advance_payment(
            current_user=user,
            contract_id=contract_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportContractNotFoundError:
        _raise_contract_not_found()
    return ApiResponse(data=payment)


@router.get("/{contract_id}/export", response_model=ApiResponse[ExportContractExportResponse])
async def export_export_contract(
    contract_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
    export_format: Annotated[str, Query(alias="format", max_length=20)] = "pdf",
) -> ApiResponse[ExportContractExportResponse]:
    user = await _current_user(token, auth_service)
    try:
        export = await service.export_contract(
            current_user=user,
            contract_id=contract_id,
            export_format=export_format,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ExportContractNotFoundError:
        _raise_contract_not_found()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=export)
