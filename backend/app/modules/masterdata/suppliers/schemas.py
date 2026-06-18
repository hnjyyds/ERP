from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SupplierContactCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=160)
    title: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    is_primary: bool = False


class SupplierContactUpdate(SupplierContactCreate):
    pass


class SupplierCreditProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    credit_grade: str = Field(min_length=1, max_length=40)
    credit_limit: Decimal = Field(ge=0)
    currency: str = Field(min_length=1, max_length=10)
    payment_terms: str = Field(min_length=1, max_length=200)
    risk_note: str | None = Field(default=None, max_length=2000)


class SupplierCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)
    contacts: list[SupplierContactCreate] = Field(default_factory=list)
    credit_profile: SupplierCreditProfileInput | None = None


class SupplierUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)
    credit_profile: SupplierCreditProfileInput | None = None


class SupplierContactResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    supplier_id: str
    name: str
    title: str | None
    email: str | None
    phone: str | None
    is_primary: bool


class SupplierCreditProfileResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    credit_grade: str
    credit_limit: str | None
    currency: str
    payment_terms: str
    risk_note: str | None


class SupplierResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    cn_name: str
    en_name: str
    country: str
    address: str | None
    website: str | None
    status: str
    owner_user_id: str
    contacts: list[SupplierContactResponse]
    primary_contact: SupplierContactResponse | None
    credit_profile: SupplierCreditProfileResponse | None


class SupplierListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SupplierResponse]
    total: int


class SupplierTransactionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_type: str
    source_code: str
    occurred_at: str
    amount: str | None
    summary: str


class SupplierTransactionListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SupplierTransactionResponse]
    total: int
