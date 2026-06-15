from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.api.v1.finance.common import current_user, raise_permission_denied, raise_unprocessable
from app.modules.finance.settlements.providers import get_financial_settlement_service
from app.modules.finance.settlements.schemas import (
    FinancialSettlementCreate,
    FinancialSettlementListResponse,
    FinancialSettlementResponse,
    ManualProfitCostCreate,
    ProfitCalculationListResponse,
)
from app.modules.finance.settlements.services import (
    FinancialSettlementNotFoundError,
    FinancialSettlementService,
)
from app.modules.finance.settlements.services import (
    PermissionDeniedError as SettlementPermissionDeniedError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService
from app.schemas.responses import ApiResponse

router = APIRouter()

@router.post(
    "/settlements",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FinancialSettlementResponse],
)
async def create_financial_settlement(
    payload: FinancialSettlementCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
) -> ApiResponse[FinancialSettlementResponse]:
    user = await current_user(token, auth_service)
    try:
        settlement = await service.create_settlement(current_user=user, payload=payload)
        return ApiResponse(data=settlement)
    except SettlementPermissionDeniedError:
        raise_permission_denied()
    except FinancialSettlementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="财务结算不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/settlements",
    response_model=ApiResponse[FinancialSettlementListResponse],
)
async def list_financial_settlements(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FinancialSettlementListResponse]:
    user = await current_user(token, auth_service)
    try:
        settlements = await service.list_settlements(
            current_user=user,
            q=q,
            status=status_filter,
            shipment_no=shipment_no,
        )
        return ApiResponse(data=settlements)
    except SettlementPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/settlements/{settlement_id}/manual-costs",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FinancialSettlementResponse],
)
async def add_manual_profit_cost(
    settlement_id: str,
    payload: ManualProfitCostCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
) -> ApiResponse[FinancialSettlementResponse]:
    user = await current_user(token, auth_service)
    try:
        settlement = await service.add_manual_cost(
            current_user=user,
            settlement_id=settlement_id,
            payload=payload,
        )
        return ApiResponse(data=settlement)
    except SettlementPermissionDeniedError:
        raise_permission_denied()
    except FinancialSettlementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="财务结算不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/profit-calculations",
    response_model=ApiResponse[ProfitCalculationListResponse],
)
async def list_profit_calculations(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[ProfitCalculationListResponse]:
    user = await current_user(token, auth_service)
    try:
        calculations = await service.list_profit_calculations(
            current_user=user,
            q=q,
            shipment_no=shipment_no,
        )
        return ApiResponse(data=calculations)
    except SettlementPermissionDeniedError:
        raise_permission_denied()
