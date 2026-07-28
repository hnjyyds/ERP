from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.auth_dependencies import CurrentUserDep
from app.modules.system.files.providers import get_file_service
from app.modules.system.files.schemas import FileUploadRequest, FileUploadResponse
from app.modules.system.files.services import FileService
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/images", response_model=ApiResponse[FileUploadResponse])
async def upload_image(
    payload: FileUploadRequest,
    user: CurrentUserDep,
    service: Annotated[FileService, Depends(get_file_service)],
) -> ApiResponse[FileUploadResponse]:
    result = await service.upload_image(current_user=user, payload=payload)
    return ApiResponse(data=result)
