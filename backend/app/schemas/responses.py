from pydantic import BaseModel, ConfigDict

from app.core.status_codes import AppStatusCode, get_status_definition

_SUCCESS_STATUS = get_status_definition(AppStatusCode.SUCCESS)


class ErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str


class ApiResponse[DataT](BaseModel):
    model_config = ConfigDict(extra="forbid")

    success: bool = True
    code: str = _SUCCESS_STATUS.code.value
    message: str = _SUCCESS_STATUS.default_message
    data: DataT | None = None
    error: ErrorResponse | None = None
