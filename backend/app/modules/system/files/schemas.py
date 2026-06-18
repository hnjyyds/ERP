from pydantic import BaseModel, ConfigDict, Field


class FileUploadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str = Field(min_length=1, max_length=200)
    # 文件内容 base64 编码，复用前端 FileReader.readAsDataURL 产出（可含 data: 前缀）。
    content_base64: str = Field(min_length=1)


class FileUploadResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str
    filename: str
    content_type: str
    size: int
