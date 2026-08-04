from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
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
    ExportContractSubmit,
)
from app.modules.sales.contracts.services import (
    ExportContractService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sales/contracts", tags=["export-contracts"])


@router.get("", response_model=ApiResponse[ExportContractListResponse])
async def list_export_contracts(
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    approval_status: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[ExportContractListResponse]:
    contracts = await service.list_contracts(
        current_user=user,
        q=q,
        approval_status=approval_status,
        customer_id=customer_id,
    )
    return ApiResponse(data=contracts)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ExportContractResponse],
)
async def create_export_contract(
    payload: ExportContractCreate,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    contract = await service.create_contract(current_user=user, payload=payload)
    return ApiResponse(data=contract)


@router.get("/{contract_id}", response_model=ApiResponse[ExportContractResponse])
async def get_export_contract(
    contract_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    contract = await service.get_contract(current_user=user, contract_id=contract_id)
    return ApiResponse(data=contract)


@router.put("/{contract_id}", response_model=ApiResponse[ExportContractResponse])
async def update_export_contract(
    contract_id: str,
    payload: ExportContractCreate,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    contract = await service.update_contract(
        current_user=user,
        contract_id=contract_id,
        payload=payload,
    )
    return ApiResponse(data=contract)


@router.post("/{contract_id}/submit", response_model=ApiResponse[ExportContractResponse])
async def submit_export_contract(
    contract_id: str,
    payload: ExportContractSubmit,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    contract = await service.submit_contract(
        current_user=user,
        contract_id=contract_id,
        payload=payload,
    )
    return ApiResponse(data=contract)


@router.post("/{contract_id}/approve", response_model=ApiResponse[ExportContractResponse])
async def approve_export_contract(
    contract_id: str,
    payload: ExportContractApprove,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    contract = await service.approve_contract(
        current_user=user,
        contract_id=contract_id,
        payload=payload,
    )
    return ApiResponse(data=contract)


@router.post("/{contract_id}/signature", response_model=ApiResponse[ExportContractResponse])
async def register_export_contract_signature(
    contract_id: str,
    payload: ExportContractSignatureCreate,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractResponse]:
    contract = await service.register_signature(
        current_user=user,
        contract_id=contract_id,
        payload=payload,
    )
    return ApiResponse(data=contract)


@router.post(
    "/{contract_id}/advance-payments",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ExportContractAdvancePaymentResponse],
)
async def add_export_contract_advance_payment(
    contract_id: str,
    payload: ExportContractAdvancePaymentCreate,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
) -> ApiResponse[ExportContractAdvancePaymentResponse]:
    payment = await service.add_advance_payment(
        current_user=user,
        contract_id=contract_id,
        payload=payload,
    )
    return ApiResponse(data=payment)


@router.get("/{contract_id}/export", response_model=ApiResponse[ExportContractExportResponse])
async def export_export_contract(
    contract_id: str,
    user: CurrentUserDep,
    service: Annotated[ExportContractService, Depends(get_export_contract_service)],
    export_format: Annotated[str, Query(alias="format", max_length=20)] = "pdf",
) -> ApiResponse[ExportContractExportResponse]:
    export = await service.export_contract(
        current_user=user,
        contract_id=contract_id,
        export_format=export_format,
    )
    return ApiResponse(data=export)
