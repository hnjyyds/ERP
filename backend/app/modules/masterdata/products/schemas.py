from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductAccessoryCreate(BaseModel):
    """创建商品时一并登记的配件资料。"""

    model_config = ConfigDict(extra="forbid")

    accessory_name: str = Field(
        min_length=1,
        max_length=200,
        description="配件名称。",
        examples=["包装纸箱"],
    )
    unit_consumption: Decimal = Field(
        gt=0,
        description="每生产一个主商品所需的配件数量。",
        examples=[1],
    )
    unit: str = Field(
        min_length=1,
        max_length=40,
        description="配件计量单位。",
        examples=["pcs"],
    )
    default_supplier_name: str | None = Field(
        default=None,
        max_length=200,
        description="默认采购该配件的供应商名称；未知时可不填。",
        examples=["宁波包装厂"],
    )
    purchase_split_rule: str = Field(
        default="by_supplier",
        min_length=1,
        max_length=80,
        description="配件采购拆分规则；默认 by_supplier，表示按供应商拆分。",
        examples=["by_supplier"],
    )


class ProductAccessoryUpdate(BaseModel):
    """更新商品配件所需的完整资料。"""

    model_config = ConfigDict(extra="forbid")

    accessory_name: str = Field(min_length=1, max_length=200, description="配件名称。")
    unit_consumption: Decimal = Field(gt=0, description="每个主商品对应的配件用量。")
    unit: str = Field(min_length=1, max_length=40, description="配件计量单位。")
    default_supplier_name: str | None = Field(
        default=None,
        max_length=200,
        description="默认供应商名称；未知时可不填。",
    )
    purchase_split_rule: str = Field(
        default="by_supplier",
        min_length=1,
        max_length=80,
        description="配件采购拆分规则。",
    )


class ProductCreate(BaseModel):
    """创建 ERP 商品的完整输入资料。"""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(
        min_length=1,
        max_length=80,
        description="ERP 内唯一的商品编码。",
        examples=["BAG-40"],
    )
    cn_name: str = Field(
        min_length=1,
        max_length=200,
        description="商品中文名称。",
        examples=["环保购物袋"],
    )
    en_name: str = Field(
        min_length=1,
        max_length=200,
        description="商品英文名称。",
        examples=["Eco Shopping Bag"],
    )
    specification: str | None = Field(
        default=None,
        max_length=200,
        description="商品规格或尺寸说明。",
        examples=["40 × 35 × 12 cm"],
    )
    model: str | None = Field(
        default=None,
        max_length=120,
        description="商品型号。",
        examples=["EB-40"],
    )
    customs_code: str = Field(
        min_length=1,
        max_length=40,
        description="海关商品编码（HS Code）。",
        examples=["42029200"],
    )
    tax_rate: Decimal = Field(
        ge=0,
        le=1,
        description="增值税率，使用 0 到 1 的小数；0.13 表示 13%。",
        examples=[0.13],
    )
    rebate_rate: Decimal = Field(
        ge=0,
        le=1,
        description="出口退税率，使用 0 到 1 的小数；0.09 表示 9%。",
        examples=[0.09],
    )
    package_info: str = Field(
        min_length=1,
        max_length=2000,
        description="包装方式、装箱数量等包装信息。",
        examples=["10 pcs/carton"],
    )
    unit: str = Field(
        min_length=1,
        max_length=40,
        description="商品默认计量单位。",
        examples=["pcs"],
    )
    image_url: str | None = Field(
        default=None,
        max_length=2000,
        description="商品图片 URL；没有图片时可不填。",
        examples=["https://example.com/products/bag-40.jpg"],
    )
    status: str = Field(
        default="active",
        min_length=1,
        max_length=40,
        description="商品状态；通常为 active（启用）或 inactive（停用）。",
        examples=["active"],
    )
    accessories: list[ProductAccessoryCreate] = Field(
        default_factory=list,
        description="随商品维护的配件清单；没有配件时传空数组。",
    )


class ProductUpdate(BaseModel):
    """更新 ERP 商品的完整输入资料。"""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80, description="ERP 内唯一的商品编码。")
    cn_name: str = Field(min_length=1, max_length=200, description="商品中文名称。")
    en_name: str = Field(min_length=1, max_length=200, description="商品英文名称。")
    specification: str | None = Field(
        default=None,
        max_length=200,
        description="商品规格或尺寸说明。",
    )
    model: str | None = Field(default=None, max_length=120, description="商品型号。")
    customs_code: str = Field(
        min_length=1,
        max_length=40,
        description="海关商品编码（HS Code）。",
    )
    tax_rate: Decimal = Field(
        ge=0,
        le=1,
        description="增值税率，使用 0 到 1 的小数。",
    )
    rebate_rate: Decimal = Field(
        ge=0,
        le=1,
        description="出口退税率，使用 0 到 1 的小数。",
    )
    package_info: str = Field(
        min_length=1,
        max_length=2000,
        description="包装方式、装箱数量等包装信息。",
    )
    unit: str = Field(min_length=1, max_length=40, description="商品默认计量单位。")
    image_url: str | None = Field(
        default=None,
        max_length=2000,
        description="商品图片 URL；没有图片时可不填。",
    )
    status: str = Field(
        default="active",
        min_length=1,
        max_length=40,
        description="商品状态；通常为 active 或 inactive。",
    )


class ProductAccessoryResponse(BaseModel):
    """商品配件详情。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="配件记录 ID。")
    product_id: str = Field(description="所属商品 ID。")
    accessory_name: str = Field(description="配件名称。")
    unit_consumption: Decimal = Field(description="每个主商品对应的配件用量。")
    unit: str = Field(description="配件计量单位。")
    default_supplier_name: str | None = Field(description="默认供应商名称。")
    purchase_split_rule: str = Field(description="配件采购拆分规则。")


class ProductResponse(BaseModel):
    """ERP 商品详情。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="ERP 商品 ID，查询、更新和停用时使用。")
    code: str = Field(description="ERP 内唯一的商品编码。")
    cn_name: str = Field(description="商品中文名称。")
    en_name: str = Field(description="商品英文名称。")
    specification: str | None = Field(description="商品规格或尺寸说明。")
    model: str | None = Field(description="商品型号。")
    customs_code: str = Field(description="海关商品编码（HS Code）。")
    tax_rate: Decimal = Field(description="增值税率，使用 0 到 1 的小数。")
    rebate_rate: Decimal = Field(description="出口退税率，使用 0 到 1 的小数。")
    package_info: str = Field(description="包装方式、装箱数量等包装信息。")
    unit: str = Field(description="商品默认计量单位。")
    image_url: str | None = Field(description="商品图片 URL。")
    status: str = Field(description="商品状态。")
    accessories: list[ProductAccessoryResponse] = Field(description="商品配件清单。")


class ProductListResponse(BaseModel):
    """分页商品查询结果。"""

    model_config = ConfigDict(extra="forbid")

    items: list[ProductResponse] = Field(description="当前分页返回的商品列表。")
    total: int = Field(description="符合查询条件的商品总数。")


class ProductExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str


class ProductImportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str = Field(min_length=1, max_length=200)
    # 文件内容 base64 编码，复用前端 FileReader.readAsDataURL 的产出（可含 data: 前缀）。
    content_base64: str = Field(min_length=1)


class ProductImportError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    row: int
    code: str | None
    message: str


class ProductImportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    created: int
    updated: int
    failed: int
    errors: list[ProductImportError]


class ProductCustomerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_id: str | None
    customer_name: str
    contract_count: int
    total_quantity: Decimal
    total_amount: Decimal
    last_contract_date: str | None


class ProductCustomerListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ProductCustomerResponse]
    total: int


class ProductTransactionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_type: str
    source_code: str
    occurred_at: str
    counterparty_name: str | None
    quantity: str | None
    unit: str | None
    amount: str | None
    summary: str


class ProductTransactionListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ProductTransactionResponse]
    total: int
