from pydantic import BaseModel, ConfigDict, Field

VALID_DOCUMENT_PARTY_TYPES = (
    "consignee",
    "notify_party",
    "issuing_bank",
    "bill_notify_party",
)


class DocumentPartyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    party_type: str = Field(min_length=1, max_length=40)
    display_name: str = Field(min_length=1, max_length=240)
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str | None = Field(default=None, max_length=240)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    contact_person: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    bank_name: str | None = Field(default=None, max_length=240)
    swift_code: str | None = Field(default=None, max_length=80)
    account_no: str | None = Field(default=None, max_length=120)
    tax_id: str | None = Field(default=None, max_length=120)
    remarks: str | None = Field(default=None, max_length=2000)
    is_default: bool = False
    status: str = Field(default="active", min_length=1, max_length=40)


class DocumentPartyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    party_type: str = Field(min_length=1, max_length=40)
    display_name: str = Field(min_length=1, max_length=240)
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str | None = Field(default=None, max_length=240)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    contact_person: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    bank_name: str | None = Field(default=None, max_length=240)
    swift_code: str | None = Field(default=None, max_length=80)
    account_no: str | None = Field(default=None, max_length=120)
    tax_id: str | None = Field(default=None, max_length=120)
    remarks: str | None = Field(default=None, max_length=2000)
    is_default: bool = False
    status: str = Field(default="active", min_length=1, max_length=40)


class DocumentPartyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    party_type: str
    display_name: str
    customer_id: str | None
    customer_name: str | None
    country: str
    address: str | None
    contact_person: str | None
    email: str | None
    phone: str | None
    bank_name: str | None
    swift_code: str | None
    account_no: str | None
    tax_id: str | None
    remarks: str | None
    is_default: bool
    status: str
    owner_user_id: str


class DocumentPartyListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[DocumentPartyResponse]
    total: int
