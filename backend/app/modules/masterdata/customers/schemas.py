from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CustomerContactCreate(BaseModel):
    """创建客户时一并登记的联系人资料。"""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=160,
        description="联系人姓名。",
        examples=["Anna Müller"],
    )
    title: str | None = Field(
        default=None,
        max_length=160,
        description="联系人职务或称谓。",
        examples=["Purchasing Manager"],
    )
    email: str | None = Field(
        default=None,
        max_length=200,
        description="联系人电子邮箱。",
        examples=["anna@example.de"],
    )
    phone: str | None = Field(
        default=None,
        max_length=80,
        description="联系人电话，建议包含国家或地区区号。",
        examples=["+49 30 123456"],
    )
    is_primary: bool = Field(
        default=False,
        description="是否为客户的主要联系人。",
        examples=[True],
    )


class CustomerContactUpdate(CustomerContactCreate):
    pass


class CustomerCreditProfileInput(BaseModel):
    """客户信用额度和结算条件。"""

    model_config = ConfigDict(extra="forbid")

    credit_grade: str = Field(
        min_length=1,
        max_length=40,
        description="内部信用等级。",
        examples=["A"],
    )
    credit_limit: Decimal = Field(
        ge=0,
        description="允许客户赊销的最高金额，币种由 currency 指定。",
        examples=[50000],
    )
    currency: str = Field(
        min_length=1,
        max_length=10,
        description="信用额度币种，建议使用 ISO 4217 三字母代码。",
        examples=["USD"],
    )
    payment_terms: str = Field(
        min_length=1,
        max_length=200,
        description="约定的付款条件。",
        examples=["30% deposit, 70% before shipment"],
    )
    risk_note: str | None = Field(
        default=None,
        max_length=2000,
        description="客户信用风险备注。",
        examples=["首次合作，出货前收齐尾款"],
    )


class CustomerCreate(BaseModel):
    """创建 ERP 客户的完整输入资料。"""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(
        min_length=1,
        max_length=80,
        description="ERP 内唯一的客户编码。",
        examples=["C-DE-001"],
    )
    cn_name: str = Field(
        min_length=1,
        max_length=200,
        description="客户中文名称。",
        examples=["德国示例贸易有限公司"],
    )
    en_name: str = Field(
        min_length=1,
        max_length=200,
        description="客户英文或当地语言名称。",
        examples=["Example Handel GmbH"],
    )
    country: str = Field(
        min_length=1,
        max_length=120,
        description="客户所在国家或地区；建议使用两位 ISO 国家代码。",
        examples=["DE"],
    )
    address: str | None = Field(
        default=None,
        max_length=2000,
        description="客户联系或注册地址。",
        examples=["Musterstraße 1, Berlin"],
    )
    website: str | None = Field(
        default=None,
        max_length=2000,
        description="客户官方网站 URL。",
        examples=["https://example.de"],
    )
    status: str = Field(
        default="active",
        min_length=1,
        max_length=40,
        description="客户状态；通常为 active（启用）或 inactive（停用）。",
        examples=["active"],
    )
    contacts: list[CustomerContactCreate] = Field(
        default_factory=list,
        description="客户联系人清单；没有联系人时传空数组。",
    )
    credit_profile: CustomerCreditProfileInput | None = Field(
        default=None,
        description="客户信用资料；暂未评定信用时可不填。",
    )


class CustomerUpdate(BaseModel):
    """更新 ERP 客户的主体和信用资料。"""

    model_config = ConfigDict(extra="forbid")

    cn_name: str = Field(min_length=1, max_length=200, description="客户中文名称。")
    en_name: str = Field(
        min_length=1,
        max_length=200,
        description="客户英文或当地语言名称。",
    )
    country: str = Field(
        min_length=1,
        max_length=120,
        description="客户所在国家或地区。",
    )
    address: str | None = Field(
        default=None,
        max_length=2000,
        description="客户联系或注册地址。",
    )
    website: str | None = Field(
        default=None,
        max_length=2000,
        description="客户官方网站 URL。",
    )
    status: str = Field(
        default="active",
        min_length=1,
        max_length=40,
        description="客户状态；通常为 active 或 inactive。",
    )
    credit_profile: CustomerCreditProfileInput | None = Field(
        default=None,
        description="客户信用资料；传 null 表示不维护信用资料。",
    )


class CustomerContactResponse(BaseModel):
    """客户联系人详情。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="联系人记录 ID。")
    customer_id: str = Field(description="所属客户 ID。")
    name: str = Field(description="联系人姓名。")
    title: str | None = Field(description="联系人职务或称谓。")
    email: str | None = Field(description="联系人电子邮箱。")
    phone: str | None = Field(description="联系人电话。")
    is_primary: bool = Field(description="是否为客户的主要联系人。")


class CustomerCreditProfileResponse(BaseModel):
    """客户信用资料详情。"""

    model_config = ConfigDict(extra="forbid")

    credit_grade: str = Field(description="内部信用等级。")
    credit_limit: str | None = Field(description="客户信用额度。")
    currency: str = Field(description="信用额度币种。")
    payment_terms: str = Field(description="约定的付款条件。")
    risk_note: str | None = Field(description="客户信用风险备注。")


class CustomerResponse(BaseModel):
    """ERP 客户详情。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="ERP 客户 ID，查询、更新和停用时使用。")
    code: str = Field(description="ERP 内唯一的客户编码。")
    cn_name: str = Field(description="客户中文名称。")
    en_name: str = Field(description="客户英文或当地语言名称。")
    country: str = Field(description="客户所在国家或地区。")
    address: str | None = Field(description="客户联系或注册地址。")
    website: str | None = Field(description="客户官方网站 URL。")
    status: str = Field(description="客户状态。")
    owner_user_id: str = Field(description="客户归属业务员的用户 ID。")
    contacts: list[CustomerContactResponse] = Field(description="客户联系人清单。")
    primary_contact: CustomerContactResponse | None = Field(
        description="主要联系人；没有主要联系人时为 null。"
    )
    credit_profile: CustomerCreditProfileResponse | None = Field(
        description="客户信用资料；未维护时为 null。"
    )


class CustomerListResponse(BaseModel):
    """分页客户查询结果。"""

    model_config = ConfigDict(extra="forbid")

    items: list[CustomerResponse] = Field(description="当前分页返回的客户列表。")
    total: int = Field(description="符合查询条件的客户总数。")


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
