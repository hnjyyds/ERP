from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.api.v1.finance.common import current_user, raise_permission_denied, raise_unprocessable
from app.modules.finance.reimbursements.providers import get_reimbursement_service
from app.modules.finance.reimbursements.schemas import (
    ReimbursementApprove,
    ReimbursementCreate,
    ReimbursementListResponse,
    ReimbursementPay,
    ReimbursementResponse,
)
from app.modules.finance.reimbursements.services import (
    PermissionDeniedError as ReimbursementPermissionDeniedError,
)
from app.modules.finance.reimbursements.services import (
    ReimbursementNotFoundError,
    ReimbursementService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.post(
    "/reimbursements",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ReimbursementResponse],
)
async def create_reimbursement(
    payload: ReimbursementCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
) -> ApiResponse[ReimbursementResponse]:
    user = await current_user(token, auth_service)
    try:
        reimbursement = await service.create_reimbursement(current_user=user, payload=payload)
        return ApiResponse(data=reimbursement)
    except ReimbursementPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get("/reimbursements", response_model=ApiResponse[ReimbursementListResponse])
async def list_reimbursements(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    category: Annotated[str | None, Query(max_length=40)] = None,
    applicant_user_id: Annotated[str | None, Query(max_length=64)] = None,
) -> ApiResponse[ReimbursementListResponse]:
    user = await current_user(token, auth_service)
    try:
        reimbursements = await service.list_reimbursements(
            current_user=user,
            q=q,
            status=status_filter,
            category=category,
            applicant_user_id=applicant_user_id,
        )
        return ApiResponse(data=reimbursements)
    except ReimbursementPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/reimbursements/{reimbursement_id}/approve",
    response_model=ApiResponse[ReimbursementResponse],
)
async def approve_reimbursement(
    reimbursement_id: str,
    payload: ReimbursementApprove,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
) -> ApiResponse[ReimbursementResponse]:
    user = await current_user(token, auth_service)
    try:
        reimbursement = await service.approve_reimbursement(
            current_user=user,
            reimbursement_id=reimbursement_id,
            payload=payload,
        )
        return ApiResponse(data=reimbursement)
    except ReimbursementPermissionDeniedError:
        raise_permission_denied()
    except ReimbursementNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报销单不存在",
        ) from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/reimbursements/{reimbursement_id}/pay",
    response_model=ApiResponse[ReimbursementResponse],
)
async def pay_reimbursement(
    reimbursement_id: str,
    payload: ReimbursementPay,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
) -> ApiResponse[ReimbursementResponse]:
    user = await current_user(token, auth_service)
    try:
        reimbursement = await service.pay_reimbursement(
            current_user=user,
            reimbursement_id=reimbursement_id,
            payload=payload,
        )
        return ApiResponse(data=reimbursement)
    except ReimbursementPermissionDeniedError:
        raise_permission_denied()
    except ReimbursementNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报销单不存在",
        ) from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))
