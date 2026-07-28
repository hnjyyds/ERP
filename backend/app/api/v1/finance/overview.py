from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.auth_dependencies import CurrentUserDep
from app.modules.finance.overview.providers import get_finance_overview_service
from app.modules.finance.overview.schemas import FinanceOverviewResponse
from app.modules.finance.overview.services import FinanceOverviewService
from app.schemas.responses import ApiResponse

router = APIRouter()


@router.get("/overview", response_model=ApiResponse[FinanceOverviewResponse])
async def get_finance_overview(
    user: CurrentUserDep,
    service: Annotated[FinanceOverviewService, Depends(get_finance_overview_service)],
) -> ApiResponse[FinanceOverviewResponse]:
    overview = await service.get_overview(current_user=user)
    return ApiResponse(data=overview)
