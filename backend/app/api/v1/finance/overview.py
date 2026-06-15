from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_bearer_token
from app.api.v1.finance.common import current_user, raise_permission_denied
from app.modules.finance.overview.providers import get_finance_overview_service
from app.modules.finance.overview.schemas import FinanceOverviewResponse
from app.modules.finance.overview.services import FinanceOverviewService
from app.modules.finance.overview.services import (
    PermissionDeniedError as OverviewPermissionDeniedError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService
from app.schemas.responses import ApiResponse

router = APIRouter()

@router.get("/overview", response_model=ApiResponse[FinanceOverviewResponse])
async def get_finance_overview(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FinanceOverviewService, Depends(get_finance_overview_service)],
) -> ApiResponse[FinanceOverviewResponse]:
    user = await current_user(token, auth_service)
    try:
        overview = await service.get_overview(current_user=user)
        return ApiResponse(data=overview)
    except OverviewPermissionDeniedError:
        raise_permission_denied()
