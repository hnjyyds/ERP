from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.sample.deliveries.providers import get_sample_delivery_service
from app.modules.sample.deliveries.schemas import (
    SampleDeliveryApprove,
    SampleDeliveryCreate,
    SampleDeliveryExportResponse,
    SampleDeliveryFeeStatisticsResponse,
    SampleDeliveryListResponse,
    SampleDeliveryResponse,
    SampleDeliveryStatisticsResponse,
    SampleDeliveryTrackingUpdate,
)
from app.modules.sample.deliveries.services import (
    SampleDeliveryService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/sample/deliveries", tags=["sample-deliveries"])


@router.get("", response_model=ApiResponse[SampleDeliveryListResponse])
async def list_sample_deliveries(
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    express_company: Annotated[str | None, Query(max_length=120)] = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> ApiResponse[SampleDeliveryListResponse]:
    deliveries = await service.list_deliveries(
        current_user=user,
        q=q,
        status=status_filter,
        customer_id=customer_id,
        express_company=express_company,
        date_from=date_from,
        date_to=date_to,
    )
    return ApiResponse(data=deliveries)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[SampleDeliveryResponse],
)
async def create_sample_delivery(
    payload: SampleDeliveryCreate,
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    delivery = await service.create_delivery(current_user=user, payload=payload)
    return ApiResponse(data=delivery)


@router.put("/{delivery_id}", response_model=ApiResponse[SampleDeliveryResponse])
async def update_sample_delivery(
    delivery_id: str,
    payload: SampleDeliveryCreate,
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    delivery = await service.update_delivery(
        current_user=user,
        delivery_id=delivery_id,
        payload=payload,
    )
    return ApiResponse(data=delivery)


@router.get("/fee-statistics", response_model=ApiResponse[SampleDeliveryFeeStatisticsResponse])
async def get_sample_delivery_fee_statistics(
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    date_from: date | None = None,
    date_to: date | None = None,
    express_company: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[SampleDeliveryFeeStatisticsResponse]:
    statistics = await service.get_fee_statistics(
        current_user=user,
        customer_id=customer_id,
        date_from=date_from,
        date_to=date_to,
        express_company=express_company,
    )
    return ApiResponse(data=statistics)


@router.get("/statistics", response_model=ApiResponse[SampleDeliveryStatisticsResponse])
async def get_sample_delivery_statistics(
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    date_from: date | None = None,
    date_to: date | None = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    express_company: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[SampleDeliveryStatisticsResponse]:
    statistics = await service.get_statistics(
        current_user=user,
        date_from=date_from,
        date_to=date_to,
        customer_id=customer_id,
        express_company=express_company,
    )
    return ApiResponse(data=statistics)


@router.get("/export", response_model=ApiResponse[SampleDeliveryExportResponse])
async def export_sample_deliveries(
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    date_from: date | None = None,
    date_to: date | None = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    express_company: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[SampleDeliveryExportResponse]:
    exported = await service.export_deliveries(
        current_user=user,
        date_from=date_from,
        date_to=date_to,
        customer_id=customer_id,
        express_company=express_company,
    )
    return ApiResponse(data=exported)


@router.get(
    "/history/sample/{sample_record_id}",
    response_model=ApiResponse[SampleDeliveryListResponse],
)
async def get_sample_delivery_history(
    sample_record_id: str,
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryListResponse]:
    history = await service.get_sample_history(
        current_user=user,
        sample_record_id=sample_record_id,
    )
    return ApiResponse(data=history)


@router.get("/quote-history", response_model=ApiResponse[SampleDeliveryListResponse])
async def get_sample_delivery_quote_history(
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
    product_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[SampleDeliveryListResponse]:
    history = await service.get_quote_history(
        current_user=user,
        customer_id=customer_id,
        product_id=product_id,
    )
    return ApiResponse(data=history)


@router.get("/{delivery_id}", response_model=ApiResponse[SampleDeliveryResponse])
async def get_sample_delivery(
    delivery_id: str,
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    delivery = await service.get_delivery(current_user=user, delivery_id=delivery_id)
    return ApiResponse(data=delivery)


@router.post("/{delivery_id}/submit", response_model=ApiResponse[SampleDeliveryResponse])
async def submit_sample_delivery(
    delivery_id: str,
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    delivery = await service.submit_delivery(current_user=user, delivery_id=delivery_id)
    return ApiResponse(data=delivery)


@router.post("/{delivery_id}/approve", response_model=ApiResponse[SampleDeliveryResponse])
async def approve_sample_delivery(
    delivery_id: str,
    payload: SampleDeliveryApprove,
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    delivery = await service.approve_delivery(
        current_user=user,
        delivery_id=delivery_id,
        payload=payload,
    )
    return ApiResponse(data=delivery)


@router.post("/{delivery_id}/tracking", response_model=ApiResponse[SampleDeliveryResponse])
async def update_sample_delivery_tracking(
    delivery_id: str,
    payload: SampleDeliveryTrackingUpdate,
    user: CurrentUserDep,
    service: Annotated[SampleDeliveryService, Depends(get_sample_delivery_service)],
) -> ApiResponse[SampleDeliveryResponse]:
    delivery = await service.update_tracking(
        current_user=user,
        delivery_id=delivery_id,
        payload=payload,
    )
    return ApiResponse(data=delivery)
