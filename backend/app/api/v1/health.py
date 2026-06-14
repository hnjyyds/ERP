from fastapi import APIRouter

from app.schemas.health import HealthResponse
from app.schemas.responses import ApiResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=ApiResponse[HealthResponse])
async def get_health() -> ApiResponse[HealthResponse]:
    return ApiResponse(data=HealthResponse(status="ok", service="yuanjing-trade-api"))
