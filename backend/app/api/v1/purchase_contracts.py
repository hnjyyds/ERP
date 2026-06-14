from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.purchase.contracts.providers import get_purchase_contract_service
from app.modules.purchase.contracts.schemas import (
    PurchaseContractApprove,
    PurchaseContractCreate,
    PurchaseContractGenerateFromExportContracts,
    PurchaseContractListResponse,
    PurchaseContractReminderListResponse,
    PurchaseContractResponse,
)
from app.modules.purchase.contracts.services import (
    PermissionDeniedError,
    PurchaseContractNotFoundError,
    PurchaseContractService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/purchase/contracts", tags=["purchase-contracts"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少采购合同权限")


def _raise_invalid_contract() -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="采购合同数据无效",
    )


def _raise_contract_not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="采购合同不存在")


@router.get("", response_model=ApiResponse[PurchaseContractListResponse])
async def list_purchase_contracts(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    source_type: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[PurchaseContractListResponse]:
    user = await _current_user(token, auth_service)
    try:
        contracts = await service.list_contracts(
            current_user=user,
            q=q,
            approval_status=approval_status,
            supplier_id=supplier_id,
            source_type=source_type,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contracts)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseContractResponse],
)
async def create_purchase_contract(
    payload: PurchaseContractCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
) -> ApiResponse[PurchaseContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.create_contract(current_user=user, payload=payload)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)


@router.post(
    "/generate-from-export-contracts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PurchaseContractResponse],
)
async def generate_purchase_contract_from_export_contracts(
    payload: PurchaseContractGenerateFromExportContracts,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
) -> ApiResponse[PurchaseContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.generate_from_export_contracts(
            current_user=user,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)


@router.get(
    "/reminders",
    response_model=ApiResponse[PurchaseContractReminderListResponse],
)
async def list_purchase_contract_reminders(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
) -> ApiResponse[PurchaseContractReminderListResponse]:
    user = await _current_user(token, auth_service)
    try:
        reminders = await service.list_reminders(current_user=user)
    except PermissionDeniedError:
        _raise_permission_denied()
    return ApiResponse(data=reminders)


@router.get("/{contract_id}", response_model=ApiResponse[PurchaseContractResponse])
async def get_purchase_contract(
    contract_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
) -> ApiResponse[PurchaseContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.get_contract(current_user=user, contract_id=contract_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseContractNotFoundError:
        _raise_contract_not_found()
    return ApiResponse(data=contract)


@router.put("/{contract_id}", response_model=ApiResponse[PurchaseContractResponse])
async def update_purchase_contract(
    contract_id: str,
    payload: PurchaseContractCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
) -> ApiResponse[PurchaseContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.update_contract(
            current_user=user,
            contract_id=contract_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseContractNotFoundError:
        _raise_contract_not_found()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)


@router.post("/{contract_id}/submit", response_model=ApiResponse[PurchaseContractResponse])
async def submit_purchase_contract(
    contract_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
) -> ApiResponse[PurchaseContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.submit_contract(current_user=user, contract_id=contract_id)
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseContractNotFoundError:
        _raise_contract_not_found()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)


@router.post("/{contract_id}/approve", response_model=ApiResponse[PurchaseContractResponse])
async def approve_purchase_contract(
    contract_id: str,
    payload: PurchaseContractApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PurchaseContractService, Depends(get_purchase_contract_service)],
) -> ApiResponse[PurchaseContractResponse]:
    user = await _current_user(token, auth_service)
    try:
        contract = await service.approve_contract(
            current_user=user,
            contract_id=contract_id,
            payload=payload,
        )
    except PermissionDeniedError:
        _raise_permission_denied()
    except PurchaseContractNotFoundError:
        _raise_contract_not_found()
    except ValueError:
        _raise_invalid_contract()
    return ApiResponse(data=contract)
