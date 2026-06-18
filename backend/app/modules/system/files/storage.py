"""本地对象存储：把 base64 文件内容落地到磁盘并返回可访问 URL。

生产环境可将 ``upload_dir`` 挂载到对象存储卷或替换为 S3/MinIO 客户端，
对外接口（``save`` 返回 URL）保持不变。
"""

import base64
import binascii
import hashlib
from pathlib import Path
from uuid import uuid4

# 仅允许常见图片类型，按魔数嗅探，避免可执行文件伪装为图片。
_IMAGE_SIGNATURES: tuple[tuple[bytes, str, str], ...] = (
    (b"\xff\xd8\xff", "image/jpeg", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", ".png"),
    (b"GIF87a", "image/gif", ".gif"),
    (b"GIF89a", "image/gif", ".gif"),
    (b"RIFF", "image/webp", ".webp"),  # WEBP 容器，进一步校验见 _sniff。
)


class FileTooLargeError(Exception):
    pass


class UnsupportedFileError(Exception):
    pass


class InvalidFileError(Exception):
    pass


class FileStorage:
    def __init__(self, *, base_dir: str, url_prefix: str, max_bytes: int) -> None:
        self._base_dir = Path(base_dir)
        self._url_prefix = url_prefix.rstrip("/")
        self._max_bytes = max_bytes

    def save_image(self, *, filename: str, content_base64: str) -> tuple[str, str, int]:
        """保存图片，返回 (url, content_type, size)。"""
        content = self._decode(content_base64)
        if len(content) > self._max_bytes:
            raise FileTooLargeError(f"文件超过 {self._max_bytes // (1024 * 1024)}MB 限制")
        content_type, extension = self._sniff(content)
        digest = hashlib.sha256(content).hexdigest()[:16]
        stored_name = f"{uuid4().hex}-{digest}{extension}"
        target_dir = self._base_dir / "images"
        target_dir.mkdir(parents=True, exist_ok=True)
        (target_dir / stored_name).write_bytes(content)
        url = f"{self._url_prefix}/images/{stored_name}"
        return url, content_type, len(content)

    def _decode(self, content_base64: str) -> bytes:
        raw = content_base64
        if "," in raw and raw.lstrip().startswith("data:"):
            raw = raw.split(",", 1)[1]
        try:
            content = base64.b64decode(raw, validate=False)
        except (binascii.Error, ValueError) as exc:
            raise InvalidFileError("文件内容不是有效的 base64 编码") from exc
        if not content:
            raise InvalidFileError("上传文件为空")
        return content

    def _sniff(self, content: bytes) -> tuple[str, str]:
        for signature, content_type, extension in _IMAGE_SIGNATURES:
            if content.startswith(signature):
                if signature == b"RIFF" and content[8:12] != b"WEBP":
                    continue
                return content_type, extension
        raise UnsupportedFileError("仅支持 JPEG / PNG / GIF / WebP 图片")
