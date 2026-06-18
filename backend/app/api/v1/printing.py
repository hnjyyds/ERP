from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.modules.system.printing.providers import get_printing_service
from app.modules.system.printing.schemas import DocumentFileResponse, DocumentPrintResponse
from app.modules.system.printing.services import (
    DocumentNotFoundError,
    PermissionDeniedError,
    PrintingService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/printing", tags=["printing"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少打印权限")


@router.get(
    "/export-contracts/{contract_id}",
    response_model=ApiResponse[DocumentPrintResponse],
)
async def print_export_contract(
    contract_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PrintingService, Depends(get_printing_service)],
) -> ApiResponse[DocumentPrintResponse]:
    user = await _current_user(token, auth_service)
    try:
        result = await service.print_export_contract(
            current_user=user,
            contract_id=contract_id,
        )
        return ApiResponse(data=result)
    except PermissionDeniedError:
        _raise_permission_denied()
    except DocumentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单据不存在") from None


@router.get(
    "/sample-requests/{request_id}",
    response_model=ApiResponse[DocumentPrintResponse],
)
async def print_sample_request(
    request_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PrintingService, Depends(get_printing_service)],
) -> ApiResponse[DocumentPrintResponse]:
    user = await _current_user(token, auth_service)
    try:
        result = await service.print_sample_request(
            current_user=user,
            request_id=request_id,
        )
        return ApiResponse(data=result)
    except PermissionDeniedError:
        _raise_permission_denied()
    except DocumentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单据不存在") from None


@router.get(
    "/purchase-contracts/{contract_id}/template",
    response_model=ApiResponse[DocumentFileResponse],
)
async def generate_purchase_contract_template(
    contract_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[PrintingService, Depends(get_printing_service)],
) -> ApiResponse[DocumentFileResponse]:
    user = await _current_user(token, auth_service)
    try:
        result = await service.generate_purchase_contract_template(
            current_user=user,
            contract_id=contract_id,
        )
        return ApiResponse(data=result)
    except PermissionDeniedError:
        _raise_permission_denied()
    except DocumentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单据不存在") from None
