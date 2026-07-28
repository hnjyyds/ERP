from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.finance.reimbursements.providers import get_reimbursement_service
from app.modules.finance.reimbursements.schemas import (
    ReimbursementApprove,
    ReimbursementCreate,
    ReimbursementListResponse,
    ReimbursementPay,
    ReimbursementResponse,
)
from app.modules.finance.reimbursements.services import (
    ReimbursementService,
)
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.post(
    "/reimbursements",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ReimbursementResponse],
)
async def create_reimbursement(
    payload: ReimbursementCreate,
    user: CurrentUserDep,
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
) -> ApiResponse[ReimbursementResponse]:
    reimbursement = await service.create_reimbursement(current_user=user, payload=payload)
    return ApiResponse(data=reimbursement)


@router.get("/reimbursements", response_model=ApiResponse[ReimbursementListResponse])
async def list_reimbursements(
    user: CurrentUserDep,
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    applicant_user_id: Annotated[str | None, Query(max_length=64)] = None,
) -> ApiResponse[ReimbursementListResponse]:
    reimbursements = await service.list_reimbursements(
        current_user=user,
        q=q,
        status=status_filter,
        category=category,
        applicant_user_id=applicant_user_id,
    )
    return ApiResponse(data=reimbursements)


@router.post(
    "/reimbursements/{reimbursement_id}/approve",
    response_model=ApiResponse[ReimbursementResponse],
)
async def approve_reimbursement(
    reimbursement_id: str,
    payload: ReimbursementApprove,
    user: CurrentUserDep,
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
) -> ApiResponse[ReimbursementResponse]:
    reimbursement = await service.approve_reimbursement(
        current_user=user,
        reimbursement_id=reimbursement_id,
        payload=payload,
    )
    return ApiResponse(data=reimbursement)


@router.post(
    "/reimbursements/{reimbursement_id}/pay",
    response_model=ApiResponse[ReimbursementResponse],
)
async def pay_reimbursement(
    reimbursement_id: str,
    payload: ReimbursementPay,
    user: CurrentUserDep,
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
) -> ApiResponse[ReimbursementResponse]:
    reimbursement = await service.pay_reimbursement(
        current_user=user,
        reimbursement_id=reimbursement_id,
        payload=payload,
    )
    return ApiResponse(data=reimbursement)
