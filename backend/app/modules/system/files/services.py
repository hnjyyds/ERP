from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.files.schemas import FileUploadRequest, FileUploadResponse
from app.modules.system.files.storage import FileStorage


class PermissionDeniedError(Exception):
    pass


class FileService:
    def __init__(self, storage: FileStorage) -> None:
        self._storage = storage

    def upload_image(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: FileUploadRequest,
    ) -> FileUploadResponse:
        # 已登录用户即可上传业务图片；落地资源以随机名存储，不暴露原始路径。
        if not current_user.permissions:
            raise PermissionDeniedError
        url, content_type, size = self._storage.save_image(
            filename=payload.filename,
            content_base64=payload.content_base64,
        )
        return FileUploadResponse(
            url=url,
            filename=payload.filename,
            content_type=content_type,
            size=size,
        )
