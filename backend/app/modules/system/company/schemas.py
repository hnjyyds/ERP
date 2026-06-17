from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# 轻量邮箱格式校验，避免引入 email-validator 依赖。
_EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class CompanyInfoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    name_en: str | None = None
    letterhead: str | None = None
    address: str | None = None
    address_en: str | None = None
    phone: str | None = None
    fax: str | None = None
    email: str | None = None
    website: str | None = None
    tax_no: str | None = None
    bank_name: str | None = None
    bank_account: str | None = None
    bank_swift: str | None = None
    logo: str | None = None
    updated_at: datetime | None = None


class CompanyInfoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    name_en: str | None = Field(default=None, max_length=200)
    letterhead: str | None = Field(default=None, max_length=4000)
    address: str | None = Field(default=None, max_length=255)
    address_en: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=60)
    fax: str | None = Field(default=None, max_length=60)
    email: str | None = Field(default=None, max_length=120, pattern=_EMAIL_PATTERN)
    website: str | None = Field(default=None, max_length=200)
    tax_no: str | None = Field(default=None, max_length=80)
    bank_name: str | None = Field(default=None, max_length=200)
    bank_account: str | None = Field(default=None, max_length=80)
    bank_swift: str | None = Field(default=None, max_length=40)
    logo: str | None = Field(default=None, max_length=2_000_000)
