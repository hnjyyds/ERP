from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied
from app.modules.system.files.providers import get_file_service
from app.modules.system.files.schemas import FileUploadRequest, FileUploadResponse
from app.modules.system.files.services import FileService, PermissionDeniedError
from app.modules.system.files.storage import (
    FileTooLargeError,
    InvalidFileError,
    UnsupportedFileError,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/images", response_model=ApiResponse[FileUploadResponse])
async def upload_image(
    payload: FileUploadRequest,
    user: CurrentUserDep,
    service: Annotated[FileService, Depends(get_file_service)],
) -> ApiResponse[FileUploadResponse]:
    try:
        result = service.upload_image(current_user=user, payload=payload)
        return ApiResponse(data=result)
    except PermissionDeniedError:
        raise_permission_denied("缺少上传权限")
    except (FileTooLargeError, UnsupportedFileError, InvalidFileError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None
