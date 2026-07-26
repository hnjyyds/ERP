from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied, raise_unprocessable
from app.modules.finance.receipts.providers import get_receipt_service
from app.modules.finance.receipts.schemas import (
    BankReceiptCreate,
    BankReceiptListResponse,
    BankReceiptResponse,
    ReceiptAllocationCreate,
    ReceiptClaimCreate,
    ReceivableListResponse,
)
from app.modules.finance.receipts.services import (
    PermissionDeniedError as ReceiptPermissionDeniedError,
)
from app.modules.finance.receipts.services import ReceiptNotFoundError, ReceiptService
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.get("/receipts", response_model=ApiResponse[BankReceiptListResponse])
async def list_bank_receipts(
    user: CurrentUserDep,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[BankReceiptListResponse]:
    try:
        receipts = await service.list_receipts(
            current_user=user,
            q=q,
            status=status_filter,
            customer_id=customer_id,
        )
        return ApiResponse(data=receipts)
    except ReceiptPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/receipts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[BankReceiptResponse],
)
async def create_bank_receipt(
    payload: BankReceiptCreate,
    user: CurrentUserDep,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ApiResponse[BankReceiptResponse]:
    try:
        receipt = await service.create_receipt(current_user=user, payload=payload)
        return ApiResponse(data=receipt)
    except ReceiptPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/receipts/{receipt_id}/claim",
    response_model=ApiResponse[BankReceiptResponse],
)
async def claim_bank_receipt(
    receipt_id: str,
    payload: ReceiptClaimCreate,
    user: CurrentUserDep,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ApiResponse[BankReceiptResponse]:
    try:
        receipt = await service.claim_receipt(
            current_user=user,
            receipt_id=receipt_id,
            payload=payload,
        )
        return ApiResponse(data=receipt)
    except ReceiptPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ReceiptNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="银行水单不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/receipts/{receipt_id}/allocations",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[BankReceiptResponse],
)
async def allocate_bank_receipt(
    receipt_id: str,
    payload: ReceiptAllocationCreate,
    user: CurrentUserDep,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ApiResponse[BankReceiptResponse]:
    try:
        receipt = await service.allocate_receipt(
            current_user=user,
            receipt_id=receipt_id,
            payload=payload,
        )
        return ApiResponse(data=receipt)
    except ReceiptPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except ReceiptNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="银行水单不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get("/receivables", response_model=ApiResponse[ReceivableListResponse])
async def list_receivables(
    user: CurrentUserDep,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    contract_no: Annotated[str | None, Query(max_length=80)] = None,
    invoice_no: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[ReceivableListResponse]:
    try:
        receivables = await service.list_receivables(
            current_user=user,
            q=q,
            customer_id=customer_id,
            sales_user_id=sales_user_id,
            contract_no=contract_no,
            invoice_no=invoice_no,
        )
        return ApiResponse(data=receivables)
    except ReceiptPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
