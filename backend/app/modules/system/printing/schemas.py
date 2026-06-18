from pydantic import BaseModel, ConfigDict


class DocumentPrintResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_type: str
    document_code: str
    content_type: str
    # 可打印的 HTML 文档；前端用新窗口打开后调用浏览器打印为 PDF。
    html: str


class DocumentFileResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_type: str
    document_code: str
    filename: str
    content_type: str
    content_base64: str
