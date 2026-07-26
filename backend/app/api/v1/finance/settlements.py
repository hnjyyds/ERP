from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied, raise_unprocessable
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
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.post(
    "/settlements",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FinancialSettlementResponse],
)
async def create_financial_settlement(
    payload: FinancialSettlementCreate,
    user: CurrentUserDep,
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
) -> ApiResponse[FinancialSettlementResponse]:
    try:
        settlement = await service.create_settlement(current_user=user, payload=payload)
        return ApiResponse(data=settlement)
    except SettlementPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except FinancialSettlementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="财务结算不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/settlements",
    response_model=ApiResponse[FinancialSettlementListResponse],
)
async def list_financial_settlements(
    user: CurrentUserDep,
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[FinancialSettlementListResponse]:
    try:
        settlements = await service.list_settlements(
            current_user=user,
            q=q,
            status=status_filter,
            shipment_no=shipment_no,
        )
        return ApiResponse(data=settlements)
    except SettlementPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
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
    user: CurrentUserDep,
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
) -> ApiResponse[FinancialSettlementResponse]:
    try:
        settlement = await service.add_manual_cost(
            current_user=user,
            settlement_id=settlement_id,
            payload=payload,
        )
        return ApiResponse(data=settlement)
    except SettlementPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
    except FinancialSettlementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="财务结算不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/profit-calculations",
    response_model=ApiResponse[ProfitCalculationListResponse],
)
async def list_profit_calculations(
    user: CurrentUserDep,
    service: Annotated[FinancialSettlementService, Depends(get_financial_settlement_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[ProfitCalculationListResponse]:
    try:
        calculations = await service.list_profit_calculations(
            current_user=user,
            q=q,
            shipment_no=shipment_no,
        )
        return ApiResponse(data=calculations)
    except SettlementPermissionDeniedError:
        raise_permission_denied("缺少财务管理权限")
