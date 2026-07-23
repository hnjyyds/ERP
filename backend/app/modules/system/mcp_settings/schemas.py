from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class McpResourceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    label: str
    tools: list[str]


class McpSettingsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool
    server_name: str
    transport: Literal["streamable_http"]
    endpoint_path: str
    token_parameter: str
    token_prefix_required: bool
    credential_available: bool
    credential_issued_at: datetime | None
    credential_expires_at: datetime | None
    tool_count: int
    resources: list[McpResourceResponse]
    updated_by: str | None
    updated_at: datetime | None


class McpSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool


class McpCredentialResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    access_token: str
    token_type: Literal["Bearer"]
    expires_at: datetime
