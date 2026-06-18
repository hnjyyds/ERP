from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_bearer_token
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
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


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少上传权限")


@router.post("/images", response_model=ApiResponse[FileUploadResponse])
async def upload_image(
    payload: FileUploadRequest,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[FileService, Depends(get_file_service)],
) -> ApiResponse[FileUploadResponse]:
    user = await _current_user(token, auth_service)
    try:
        result = service.upload_image(current_user=user, payload=payload)
        return ApiResponse(data=result)
    except PermissionDeniedError:
        _raise_permission_denied()
    except (FileTooLargeError, UnsupportedFileError, InvalidFileError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None
