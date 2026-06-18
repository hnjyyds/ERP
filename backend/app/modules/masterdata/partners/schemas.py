from pydantic import BaseModel, ConfigDict, Field

VALID_PARTNER_TYPES = ("express", "freight_forwarder", "insurer", "carrier")


class PartnerContactCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=160)
    title: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    is_primary: bool = False


class PartnerContactUpdate(PartnerContactCreate):
    pass


class PartnerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    partner_type: str = Field(min_length=1, max_length=40)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)
    contacts: list[PartnerContactCreate] = Field(default_factory=list)


class PartnerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    partner_type: str = Field(min_length=1, max_length=40)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)


class PartnerContactResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    partner_id: str
    name: str
    title: str | None
    email: str | None
    phone: str | None
    is_primary: bool


class PartnerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    cn_name: str
    en_name: str
    partner_type: str
    country: str
    address: str | None
    website: str | None
    status: str
    owner_user_id: str
    contacts: list[PartnerContactResponse]
    primary_contact: PartnerContactResponse | None


class PartnerListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PartnerResponse]
    total: int


class PartnerFeeRecordResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_type: str
    source_code: str
    occurred_at: str
    amount: str | None
    summary: str


class PartnerFeeRecordListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PartnerFeeRecordResponse]
    total: int
