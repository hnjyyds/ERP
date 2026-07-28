from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.finance.port_data.providers import get_port_data_service
from app.modules.finance.port_data.schemas import (
    CustomsDeclarationRecordListResponse,
    CustomsReceiptAutoMatchResponse,
    PortImportBatchCreate,
    PortImportBatchListResponse,
    PortImportBatchResponse,
)
from app.modules.finance.port_data.services import PortDataService
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.post(
    "/port-import-batches",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PortImportBatchResponse],
)
async def import_port_data(
    payload: PortImportBatchCreate,
    user: CurrentUserDep,
    service: Annotated[PortDataService, Depends(get_port_data_service)],
) -> ApiResponse[PortImportBatchResponse]:
    batch = await service.import_port_data(current_user=user, payload=payload)
    return ApiResponse(data=batch)


@router.get("/port-import-batches", response_model=ApiResponse[PortImportBatchListResponse])
async def list_port_import_batches(
    user: CurrentUserDep,
    service: Annotated[PortDataService, Depends(get_port_data_service)],
    source: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[PortImportBatchListResponse]:
    batches = await service.list_batches(
        current_user=user,
        source=source,
        status=status_filter,
    )
    return ApiResponse(data=batches)


@router.get(
    "/customs-declaration-records",
    response_model=ApiResponse[CustomsDeclarationRecordListResponse],
)
async def list_customs_declaration_records(
    user: CurrentUserDep,
    service: Annotated[PortDataService, Depends(get_port_data_service)],
    declaration_no: Annotated[str | None, Query(max_length=120)] = None,
    customs_receipt_no: Annotated[str | None, Query(max_length=120)] = None,
    trade_type: Annotated[str | None, Query(max_length=20)] = None,
    batch_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[CustomsDeclarationRecordListResponse]:
    records = await service.list_customs_records(
        current_user=user,
        declaration_no=declaration_no,
        customs_receipt_no=customs_receipt_no,
        trade_type=trade_type,
        batch_id=batch_id,
    )
    return ApiResponse(data=records)


@router.post(
    "/customs-declaration-records/auto-match",
    response_model=ApiResponse[CustomsReceiptAutoMatchResponse],
)
async def auto_match_customs_receipts(
    user: CurrentUserDep,
    service: Annotated[PortDataService, Depends(get_port_data_service)],
) -> ApiResponse[CustomsReceiptAutoMatchResponse]:
    result = await service.auto_match_customs_receipts(current_user=user)
    return ApiResponse(data=result)
