from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied, raise_unprocessable
from app.modules.sample.records.providers import get_sample_record_service
from app.modules.sample.records.schemas import (
    SampleImageCreate,
    SampleImageResponse,
    SampleRecordCreate,
    SampleRecordExportResponse,
    SampleRecordImportRequest,
    SampleRecordImportResponse,
    SampleRecordListResponse,
    SampleRecordResponse,
    SampleStockEventCreate,
    SampleStockEventResponse,
)
from app.modules.sample.records.services import (
    PermissionDeniedError,
    SampleRecordNotFoundError,
    SampleRecordService,
    SampleStockError,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sample/records", tags=["sample-records"])


@router.get("", response_model=ApiResponse[SampleRecordListResponse])
async def list_sample_records(
    user: CurrentUserDep,
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    sample_type: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SampleRecordListResponse]:
    try:
        records = await service.list_records(
            current_user=user,
            q=q,
            sample_type=sample_type,
            customer_id=customer_id,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=records)
    except PermissionDeniedError:
        raise_permission_denied("缺少样品登记权限")
    except ValueError:
        raise_unprocessable("样品登记数据无效")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleRecordResponse],
)
async def create_sample_record(
    payload: SampleRecordCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleRecordResponse]:
    try:
        record = await service.create_record(current_user=user, payload=payload)
        return ApiResponse(data=record)
    except PermissionDeniedError:
        raise_permission_denied("缺少样品登记权限")
    except ValueError:
        raise_unprocessable("样品登记数据无效")


@router.post(
    "/import",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleRecordImportResponse],
)
async def import_sample_records(
    payload: SampleRecordImportRequest,
    user: CurrentUserDep,
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleRecordImportResponse]:
    try:
        result = await service.import_records(current_user=user, payload=payload)
        return ApiResponse(data=result)
    except PermissionDeniedError:
        raise_permission_denied("缺少样品登记权限")
    except ValueError:
        raise_unprocessable("样品登记数据无效")


@router.get("/export", response_model=ApiResponse[SampleRecordExportResponse])
async def export_sample_records(
    user: CurrentUserDep,
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    sample_type: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SampleRecordExportResponse]:
    try:
        result = await service.export_records(
            current_user=user,
            q=q,
            sample_type=sample_type,
            customer_id=customer_id,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=result)
    except PermissionDeniedError:
        raise_permission_denied("缺少样品登记权限")
    except ValueError:
        raise_unprocessable("样品登记数据无效")


@router.get("/{record_id}", response_model=ApiResponse[SampleRecordResponse])
async def get_sample_record(
    record_id: str,
    user: CurrentUserDep,
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleRecordResponse]:
    try:
        record = await service.get_record(current_user=user, record_id=record_id)
        return ApiResponse(data=record)
    except PermissionDeniedError:
        raise_permission_denied("缺少样品登记权限")
    except SampleRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="样品不存在") from None


@router.post(
    "/{record_id}/images",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleImageResponse],
)
async def add_sample_image(
    record_id: str,
    payload: SampleImageCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleImageResponse]:
    try:
        image = await service.add_image(current_user=user, record_id=record_id, payload=payload)
        return ApiResponse(data=image)
    except PermissionDeniedError:
        raise_permission_denied("缺少样品登记权限")
    except SampleRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="样品不存在") from None


@router.post(
    "/{record_id}/stock-events",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleStockEventResponse],
)
async def add_sample_stock_event(
    record_id: str,
    payload: SampleStockEventCreate,
    user: CurrentUserDep,
    service: Annotated[SampleRecordService, Depends(get_sample_record_service)],
) -> ApiResponse[SampleStockEventResponse]:
    try:
        stock_event = await service.add_stock_event(
            current_user=user,
            record_id=record_id,
            payload=payload,
        )
        return ApiResponse(data=stock_event)
    except PermissionDeniedError:
        raise_permission_denied("缺少样品登记权限")
    except SampleRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="样品不存在") from None
    except (SampleStockError, ValueError):
        raise_unprocessable("样品登记数据无效")
