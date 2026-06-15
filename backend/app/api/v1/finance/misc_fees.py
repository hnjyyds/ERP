from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.api.v1.finance.common import current_user, raise_permission_denied, raise_unprocessable
from app.modules.finance.misc_fees.providers import get_misc_fee_service
from app.modules.finance.misc_fees.schemas import (
    MiscFeeAllocationCreate,
    MiscFeeAllocationListResponse,
    MiscFeeAllocationResponse,
    MiscFeeItemCreate,
    MiscFeeItemListResponse,
    MiscFeeItemResponse,
)
from app.modules.finance.misc_fees.services import MiscFeeNotFoundError, MiscFeeService
from app.modules.finance.misc_fees.services import (
    PermissionDeniedError as MiscFeePermissionDeniedError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService
from app.schemas.responses import ApiResponse

router = APIRouter()

@router.post(
    "/misc-fee-items",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[MiscFeeItemResponse],
)
async def create_misc_fee_item(
    payload: MiscFeeItemCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
) -> ApiResponse[MiscFeeItemResponse]:
    user = await current_user(token, auth_service)
    try:
        item = await service.create_item(current_user=user, payload=payload)
        return ApiResponse(data=item)
    except MiscFeePermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get("/misc-fee-items", response_model=ApiResponse[MiscFeeItemListResponse])
async def list_misc_fee_items(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[MiscFeeItemListResponse]:
    user = await current_user(token, auth_service)
    try:
        items = await service.list_items(
            current_user=user,
            q=q,
            category=category,
            status=status_filter,
        )
        return ApiResponse(data=items)
    except MiscFeePermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/misc-fee-allocations",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[MiscFeeAllocationResponse],
)
async def create_misc_fee_allocation(
    payload: MiscFeeAllocationCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
) -> ApiResponse[MiscFeeAllocationResponse]:
    user = await current_user(token, auth_service)
    try:
        allocation = await service.create_allocation(current_user=user, payload=payload)
        return ApiResponse(data=allocation)
    except MiscFeePermissionDeniedError:
        raise_permission_denied()
    except MiscFeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="杂费项目不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/misc-fee-allocations",
    response_model=ApiResponse[MiscFeeAllocationListResponse],
)
async def list_misc_fee_allocations(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    item_id: Annotated[str | None, Query(max_length=36)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[MiscFeeAllocationListResponse]:
    user = await current_user(token, auth_service)
    try:
        allocations = await service.list_allocations(
            current_user=user,
            q=q,
            item_id=item_id,
            category=category,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            status=status_filter,
        )
        return ApiResponse(data=allocations)
    except MiscFeePermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/misc-fee-allocations/summary",
    response_model=ApiResponse[MiscFeeAllocationListResponse],
)
async def list_misc_fee_allocation_summary(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[MiscFeeService, Depends(get_misc_fee_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    item_id: Annotated[str | None, Query(max_length=36)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    sales_user_id: Annotated[str | None, Query(max_length=64)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
) -> ApiResponse[MiscFeeAllocationListResponse]:
    user = await current_user(token, auth_service)
    try:
        summary = await service.list_allocation_summary(
            current_user=user,
            q=q,
            item_id=item_id,
            category=category,
            shipment_no=shipment_no,
            sales_user_id=sales_user_id,
            status=status_filter,
        )
        return ApiResponse(data=summary)
    except MiscFeePermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))
