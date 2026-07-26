from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied
from app.modules.system.printing.providers import get_printing_service
from app.modules.system.printing.schemas import DocumentFileResponse, DocumentPrintResponse
from app.modules.system.printing.services import (
    DocumentNotFoundError,
    PermissionDeniedError,
    PrintingService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/printing", tags=["printing"])


@router.get(
    "/export-contracts/{contract_id}",
    response_model=ApiResponse[DocumentPrintResponse],
)
async def print_export_contract(
    contract_id: str,
    user: CurrentUserDep,
    service: Annotated[PrintingService, Depends(get_printing_service)],
) -> ApiResponse[DocumentPrintResponse]:
    try:
        result = await service.print_export_contract(
            current_user=user,
            contract_id=contract_id,
        )
        return ApiResponse(data=result)
    except PermissionDeniedError:
        raise_permission_denied("缺少打印权限")
    except DocumentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单据不存在") from None


@router.get(
    "/sample-requests/{request_id}",
    response_model=ApiResponse[DocumentPrintResponse],
)
async def print_sample_request(
    request_id: str,
    user: CurrentUserDep,
    service: Annotated[PrintingService, Depends(get_printing_service)],
) -> ApiResponse[DocumentPrintResponse]:
    try:
        result = await service.print_sample_request(
            current_user=user,
            request_id=request_id,
        )
        return ApiResponse(data=result)
    except PermissionDeniedError:
        raise_permission_denied("缺少打印权限")
    except DocumentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单据不存在") from None


@router.get(
    "/purchase-contracts/{contract_id}/template",
    response_model=ApiResponse[DocumentFileResponse],
)
async def generate_purchase_contract_template(
    contract_id: str,
    user: CurrentUserDep,
    service: Annotated[PrintingService, Depends(get_printing_service)],
) -> ApiResponse[DocumentFileResponse]:
    try:
        result = await service.generate_purchase_contract_template(
            current_user=user,
            contract_id=contract_id,
        )
        return ApiResponse(data=result)
    except PermissionDeniedError:
        raise_permission_denied("缺少打印权限")
    except DocumentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单据不存在") from None
