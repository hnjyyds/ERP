from pydantic import BaseModel, ConfigDict


class ErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str


class ApiResponse[DataT](BaseModel):
    model_config = ConfigDict(extra="forbid")

    success: bool = True
    data: DataT
    error: ErrorResponse | None = None
