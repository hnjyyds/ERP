from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CustomerContactCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=160)
    title: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    is_primary: bool = False


class CustomerContactUpdate(CustomerContactCreate):
    pass


class CustomerCreditProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    credit_grade: str = Field(min_length=1, max_length=40)
    credit_limit: Decimal = Field(ge=0)
    currency: str = Field(min_length=1, max_length=10)
    payment_terms: str = Field(min_length=1, max_length=200)
    risk_note: str | None = Field(default=None, max_length=2000)


class CustomerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)
    contacts: list[CustomerContactCreate] = Field(default_factory=list)
    credit_profile: CustomerCreditProfileInput | None = None


class CustomerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)
    credit_profile: CustomerCreditProfileInput | None = None


class CustomerContactResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    customer_id: str
    name: str
    title: str | None
    email: str | None
    phone: str | None
    is_primary: bool


class CustomerCreditProfileResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    credit_grade: str
    credit_limit: str | None
    currency: str
    payment_terms: str
    risk_note: str | None


class CustomerResponse(BaseModel):
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
    contacts: list[CustomerContactResponse]
    primary_contact: CustomerContactResponse | None
    credit_profile: CustomerCreditProfileResponse | None


class CustomerListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CustomerResponse]
    total: int


class CustomerTransactionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_type: str
    source_code: str
    occurred_at: str
    amount: str | None
    summary: str


class CustomerTransactionListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CustomerTransactionResponse]
    total: int
