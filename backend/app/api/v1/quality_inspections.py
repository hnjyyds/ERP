from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
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
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/quality/inspections", tags=["quality-inspections"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少 QC 查验权限")


def _raise_invalid_inspection() -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="QC 查验数据无效",
    )


def _raise_inspection_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QC 查验不存在")


def _raise_purchase_contract_not_found() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="采购合同不存在")


@router.get("", response_model=ApiResponse[QualityInspectionListResponse])
async def list_quality_inspections(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    result: Annotated[str | None, Query(max_length=40)] = None,
    supplier_id: Annotated[str | None, Query(max_length=36)] = None,
    purchase_contract_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[QualityInspectionListResponse]:
    user = await _current_user(token, auth_service)
    try:
        inspections = await service.list_inspections(
            current_user=user,
            q=q,
            result=result,
            supplier_id=supplier_id,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=inspections)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_inspection()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[QualityInspectionResponse],
)
async def create_quality_inspection(
    payload: QualityInspectionCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
) -> ApiResponse[QualityInspectionResponse]:
    user = await _current_user(token, auth_service)
    try:
        inspection = await service.create_inspection(current_user=user, payload=payload)
        return ApiResponse(data=inspection)
    except PermissionDeniedError:
        _raise_permission_denied()
    except QualityInspectionPurchaseContractNotFoundError:
        _raise_purchase_contract_not_found()
    except ValueError:
        _raise_invalid_inspection()


@router.get(
    "/inbound-eligibility",
    response_model=ApiResponse[QualityInspectionInboundEligibilityResponse],
)
async def get_quality_inbound_eligibility(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
    purchase_contract_id: Annotated[str, Query(max_length=36)],
) -> ApiResponse[QualityInspectionInboundEligibilityResponse]:
    user = await _current_user(token, auth_service)
    try:
        eligibility = await service.get_inbound_eligibility(
            current_user=user,
            purchase_contract_id=purchase_contract_id,
        )
        return ApiResponse(data=eligibility)
    except PermissionDeniedError:
        _raise_permission_denied()
    except QualityInspectionPurchaseContractNotFoundError:
        _raise_purchase_contract_not_found()


@router.get("/{inspection_id}", response_model=ApiResponse[QualityInspectionResponse])
async def get_quality_inspection(
    inspection_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
) -> ApiResponse[QualityInspectionResponse]:
    user = await _current_user(token, auth_service)
    try:
        inspection = await service.get_inspection(current_user=user, inspection_id=inspection_id)
        return ApiResponse(data=inspection)
    except PermissionDeniedError:
        _raise_permission_denied()
    except QualityInspectionNotFoundError:
        _raise_inspection_not_found()


@router.put("/{inspection_id}", response_model=ApiResponse[QualityInspectionResponse])
async def update_quality_inspection(
    inspection_id: str,
    payload: QualityInspectionCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[QualityInspectionService, Depends(get_quality_inspection_service)],
) -> ApiResponse[QualityInspectionResponse]:
    user = await _current_user(token, auth_service)
    try:
        inspection = await service.update_inspection(
            current_user=user,
            inspection_id=inspection_id,
            payload=payload,
        )
        return ApiResponse(data=inspection)
    except PermissionDeniedError:
        _raise_permission_denied()
    except QualityInspectionNotFoundError:
        _raise_inspection_not_found()
    except ValueError:
        _raise_invalid_inspection()
