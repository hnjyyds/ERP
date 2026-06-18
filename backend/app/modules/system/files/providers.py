from app.core.config import get_settings
from app.modules.system.files.services import FileService
from app.modules.system.files.storage import FileStorage


async def get_file_service() -> FileService:
    settings = get_settings()
    storage = FileStorage(
        base_dir=settings.upload_dir,
        url_prefix=settings.upload_url_prefix,
        max_bytes=settings.upload_max_bytes,
    )
    return FileService(storage)
