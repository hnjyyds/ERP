from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductAccessoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accessory_name: str = Field(min_length=1, max_length=200)
    unit_consumption: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    default_supplier_name: str | None = Field(default=None, max_length=200)
    purchase_split_rule: str = Field(default="by_supplier", min_length=1, max_length=80)


class ProductAccessoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accessory_name: str = Field(min_length=1, max_length=200)
    unit_consumption: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    default_supplier_name: str | None = Field(default=None, max_length=200)
    purchase_split_rule: str = Field(default="by_supplier", min_length=1, max_length=80)


class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    specification: str | None = Field(default=None, max_length=200)
    model: str | None = Field(default=None, max_length=120)
    customs_code: str = Field(min_length=1, max_length=40)
    tax_rate: Decimal = Field(ge=0, le=1)
    rebate_rate: Decimal = Field(ge=0, le=1)
    package_info: str = Field(min_length=1, max_length=2000)
    unit: str = Field(min_length=1, max_length=40)
    image_url: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)
    accessories: list[ProductAccessoryCreate] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    cn_name: str = Field(min_length=1, max_length=200)
    en_name: str = Field(min_length=1, max_length=200)
    specification: str | None = Field(default=None, max_length=200)
    model: str | None = Field(default=None, max_length=120)
    customs_code: str = Field(min_length=1, max_length=40)
    tax_rate: Decimal = Field(ge=0, le=1)
    rebate_rate: Decimal = Field(ge=0, le=1)
    package_info: str = Field(min_length=1, max_length=2000)
    unit: str = Field(min_length=1, max_length=40)
    image_url: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="active", min_length=1, max_length=40)


class ProductAccessoryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    product_id: str
    accessory_name: str
    unit_consumption: Decimal
    unit: str
    default_supplier_name: str | None
    purchase_split_rule: str


class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    cn_name: str
    en_name: str
    specification: str | None
    model: str | None
    customs_code: str
    tax_rate: Decimal
    rebate_rate: Decimal
    package_info: str
    unit: str
    image_url: str | None
    status: str
    accessories: list[ProductAccessoryResponse]


class ProductListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ProductResponse]
    total: int


class ProductExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str
