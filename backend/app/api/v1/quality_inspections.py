from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_not_found, raise_permission_denied, raise_unprocessable
from app.modules.quality.inspections.providers import get_quality_inspection_service
from app.modules.quality.inspections.schemas import (
    QualityInspectionCreate,
    QualityInspectionInboundEligibilityResponse,
    QualityInspectionListResponse,
    QualityInspectionResponse,
)
from app.modules.quality.inspections.services import (
    PermissionDeniedError,
    QualityInspectionNotFoundError,
    QualityInspectionPurchaseContractNotFoundError,
    QualityInspectionService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/quality/inspections", tags=["quality-inspections"])


@router.get("", response_model=ApiResponse[QualityInspectionListResponse])
async def list_quality_inspections(
    user: CurrentUserDep,
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status: Annotated[str | None, Query(max_length=40)] = None,
    result: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
    assignee_user_id: Annotated[str | None, Query(max_length=36)] = None,
    inspector_user_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[QualityInspectionListResponse]:
    try:
        inspections = await service.list_inspections(
            current_user=user,
            q=q,
            status=status,
            result=result,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
            assignee_user_id=assignee_user_id,
            inspector_user_id=inspector_user_id,
        )
        return ApiResponse(data=inspections)
    except PermissionDeniedError:
        raise_permission_denied("缺少 QC 查验权限")
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[QualityInspectionResponse],
)
async def create_quality_inspection(
    payload: QualityInspectionCreate,
    user: CurrentUserDep,
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
) -> ApiResponse[QualityInspectionResponse]:
    try:
        inspection = await service.create_inspection(current_user=user, payload=payload)
        return ApiResponse(data=inspection)
    except PermissionDeniedError:
        raise_permission_denied("缺少 QC 查验权限")
    except QualityInspectionPurchaseContractNotFoundError:
        raise_not_found("采购合同不存在")
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/inbound-eligibility",
    response_model=ApiResponse[QualityInspectionInboundEligibilityResponse],
)
async def get_quality_inbound_eligibility(
    user: CurrentUserDep,
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
    purchase_contract_id: Annotated[str, Query(max_length=36)],
) -> ApiResponse[QualityInspectionInboundEligibilityResponse]:
    try:
        eligibility = await service.get_inbound_eligibility(
            current_user=user,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=eligibility)
    except PermissionDeniedError:
        raise_permission_denied("缺少 QC 查验权限")
    except QualityInspectionPurchaseContractNotFoundError:
        raise_not_found("采购合同不存在")


@router.get("/{inspection_id}", response_model=ApiResponse[QualityInspectionResponse])
async def get_quality_inspection(
    inspection_id: str,
    user: CurrentUserDep,
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
) -> ApiResponse[QualityInspectionResponse]:
    try:
        inspection = await service.get_inspection(current_user=user, inspection_id=inspection_id)
        return ApiResponse(data=inspection)
    except PermissionDeniedError:
        raise_permission_denied("缺少 QC 查验权限")
    except QualityInspectionNotFoundError:
        raise_not_found("QC 查验不存在")


@router.put("/{inspection_id}", response_model=ApiResponse[QualityInspectionResponse])
async def update_quality_inspection(
    inspection_id: str,
    payload: QualityInspectionCreate,
    user: CurrentUserDep,
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
) -> ApiResponse[QualityInspectionResponse]:
    try:
        inspection = await service.update_inspection(
            current_user=user,
            inspection_id=inspection_id,
            payload=payload,
        )
        return ApiResponse(data=inspection)
    except PermissionDeniedError:
        raise_permission_denied("缺少 QC 查验权限")
    except QualityInspectionNotFoundError:
        raise_not_found("QC 查验不存在")
    except ValueError as exc:
        raise_unprocessable(str(exc))
