from datetime import date
from decimal import Decimal
from typing import Self

from pydantic import ConfigDict, Field, model_validator

from app.schemas.base import BaseModel

VALID_CONTRACT_STATUSES = ("draft", "submitted", "approved", "rejected")
VALID_CONTRACT_EXPORT_FORMATS = ("pdf", "excel")


class ExportContractLineCreate(BaseModel):
    """出口订单中的一条商品明细。"""

    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(
        default=None,
        max_length=36,
        description="已存在的 ERP 商品 ID；能关联商品时优先填写。",
        examples=["product-001"],
    )
    product_code: str | None = Field(
        default=None,
        max_length=80,
        description="商品编码；用于保留订单创建时的商品快照。",
        examples=["BAG-40"],
    )
    product_name: str = Field(
        min_length=1,
        max_length=240,
        description="订单明细中的商品名称。",
        examples=["Eco Shopping Bag"],
    )
    specification: str | None = Field(
        default=None,
        max_length=240,
        description="商品规格或尺寸说明。",
        examples=["40 × 35 × 12 cm"],
    )
    model: str | None = Field(
        default=None,
        max_length=120,
        description="商品型号。",
        examples=["EB-40"],
    )
    quantity: Decimal = Field(
        gt=0,
        description="合同订购数量，必须大于 0。",
        examples=[100],
    )
    unit: str = Field(
        min_length=1,
        max_length=40,
        description="商品计量单位。",
        examples=["pcs"],
    )
    unit_price: Decimal = Field(
        gt=0,
        description="商品单价，币种由合同 currency 字段确定，且必须大于 0。",
        examples=[2.5],
    )
    purchased_quantity: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        description="已采购数量；新建草稿通常为 0，且不能超过合同数量。",
        examples=[0],
    )
    shipped_quantity: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        description="已出货数量；新建草稿通常为 0，且不能超过合同数量。",
        examples=[0],
    )
    image_url: str | None = Field(
        default=None,
        max_length=1000,
        description="订单商品图片 URL。",
        examples=["https://example.com/products/bag-40.jpg"],
    )
    remark: str | None = Field(
        default=None,
        max_length=2000,
        description="该商品明细的补充说明。",
        examples=["使用可回收材料"],
    )

    @model_validator(mode="after")
    def validate_progress_quantities(self) -> Self:
        if self.purchased_quantity > self.quantity:
            raise ValueError("已采购数量不能超过合同数量")
        if self.shipped_quantity > self.quantity:
            raise ValueError("已出货数量不能超过合同数量")
        return self


class ExportContractCreate(BaseModel):
    """创建或更新出口订单草稿的完整输入资料。"""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(
        min_length=1,
        max_length=80,
        description="ERP 内唯一的出口订单号（出口合同号）。",
        examples=["EC-2026-001"],
    )
    contract_date: date = Field(
        description="合同签订日期，格式为 YYYY-MM-DD。",
        examples=["2026-07-26"],
    )
    customer_id: str | None = Field(
        default=None,
        max_length=36,
        description="已存在的 ERP 客户 ID；能关联客户时优先填写。",
        examples=["customer-001"],
    )
    customer_name: str = Field(
        min_length=1,
        max_length=240,
        description="合同上的客户名称。",
        examples=["Example Handel GmbH"],
    )
    sales_user_id: str | None = Field(
        default=None,
        max_length=36,
        description="负责该订单的业务员用户 ID。",
        examples=["u-001"],
    )
    sales_user_name: str | None = Field(
        default=None,
        max_length=160,
        description="负责该订单的业务员姓名。",
        examples=["演示业务主管"],
    )
    currency: str = Field(
        min_length=1,
        max_length=10,
        description="合同币种，建议使用 ISO 4217 三字母代码。",
        examples=["USD"],
    )
    trade_term: str = Field(
        min_length=1,
        max_length=80,
        description="国际贸易术语（Incoterm）。",
        examples=["FOB"],
    )
    planned_ship_date: date = Field(
        description="计划出货日期，格式为 YYYY-MM-DD。",
        examples=["2026-08-26"],
    )
    payment_terms: str = Field(
        min_length=1,
        max_length=400,
        description="合同约定的付款条件。",
        examples=["30% deposit, 70% before shipment"],
    )
    source_quotation_id: str | None = Field(
        default=None,
        max_length=36,
        description="来源出口报价单 ID；非报价转单时可不填。",
        examples=["quotation-001"],
    )
    source_quotation_no: str | None = Field(
        default=None,
        max_length=80,
        description="来源出口报价单号。",
        examples=["EQ-2026-001"],
    )
    remarks: str | None = Field(
        default=None,
        max_length=4000,
        description="出口订单整体备注。",
        examples=["包装唛头待客户确认"],
    )
    lines: list[ExportContractLineCreate] = Field(
        min_length=1,
        description="出口订单商品明细，至少包含一条。",
    )


class ExportContractApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date


class ExportContractSignatureCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    signed_by: str = Field(min_length=1, max_length=160)
    signed_at: date
    signature_method: str = Field(min_length=1, max_length=80)
    file_no: str | None = Field(default=None, max_length=120)
    remark: str | None = Field(default=None, max_length=2000)


class ExportContractAdvancePaymentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_no: str = Field(min_length=1, max_length=80)
    received_at: date
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    payer_name: str = Field(min_length=1, max_length=240)
    remark: str | None = Field(default=None, max_length=2000)


class ExportContractLineResponse(BaseModel):
    """出口订单商品明细及采购、出货进度。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="订单商品明细 ID。")
    contract_id: str = Field(description="所属出口订单 ID。")
    product_id: str | None = Field(description="关联的 ERP 商品 ID。")
    product_code: str | None = Field(description="订单中的商品编码快照。")
    product_name: str = Field(description="订单中的商品名称。")
    specification: str | None = Field(description="商品规格或尺寸说明。")
    model: str | None = Field(description="商品型号。")
    quantity: str = Field(description="合同订购数量。")
    unit: str = Field(description="商品计量单位。")
    unit_price: str = Field(description="商品单价，币种与合同一致。")
    amount: str = Field(description="该明细的合同金额。")
    purchased_quantity: str = Field(description="已采购数量。")
    unpurchased_quantity: str = Field(description="尚未采购数量。")
    shipped_quantity: str = Field(description="已出货数量。")
    unshipped_quantity: str = Field(description="尚未出货数量。")
    shipped_amount: str = Field(description="已出货商品金额。")
    unshipped_amount: str = Field(description="尚未出货商品金额。")
    image_url: str | None = Field(description="订单商品图片 URL。")
    remark: str | None = Field(description="该商品明细的补充说明。")


class ExportContractSignatureResponse(BaseModel):
    """出口订单签章记录。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="签章记录 ID。")
    contract_id: str = Field(description="所属出口订单 ID。")
    signed_by: str = Field(description="签章人姓名。")
    signed_at: date = Field(description="签章日期。")
    signature_method: str = Field(description="签章方式。")
    file_no: str | None = Field(description="签章文件编号。")
    remark: str | None = Field(description="签章备注。")


class ExportContractAdvancePaymentResponse(BaseModel):
    """出口订单预收款记录。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="预收款记录 ID。")
    contract_id: str = Field(description="所属出口订单 ID。")
    payment_no: str = Field(description="预收款单号。")
    received_at: date = Field(description="收款日期。")
    amount: str = Field(description="预收款金额。")
    currency: str = Field(description="预收款币种。")
    payer_name: str = Field(description="付款方名称。")
    remark: str | None = Field(description="预收款备注。")


class ExportContractStatisticsResponse(BaseModel):
    """出口订单数量和金额汇总。"""

    model_config = ConfigDict(extra="forbid")

    total_quantity: str = Field(description="合同商品总数量。")
    total_amount: str = Field(description="合同总金额。")
    shipped_quantity: str = Field(description="已出货总数量。")
    shipped_amount: str = Field(description="已出货总金额。")
    unshipped_quantity: str = Field(description="尚未出货总数量。")
    unshipped_amount: str = Field(description="尚未出货总金额。")
    purchased_quantity: str = Field(description="已采购总数量。")
    unpurchased_quantity: str = Field(description="尚未采购总数量。")
    advance_payment_amount: str = Field(description="累计预收款金额。")


class ExportContractPurchaseStatusResponse(BaseModel):
    """出口订单商品的采购进度汇总。"""

    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(description="关联的 ERP 商品 ID。")
    product_code: str | None = Field(description="商品编码。")
    product_name: str = Field(description="商品名称。")
    total_quantity: str = Field(description="合同订购总数量。")
    purchased_quantity: str = Field(description="已采购数量。")
    unpurchased_quantity: str = Field(description="尚未采购数量。")
    unit: str = Field(description="商品计量单位。")
    status: str = Field(description="采购进度状态。")


class ExportContractShipmentStatusResponse(BaseModel):
    """出口订单商品的出货进度汇总。"""

    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(description="关联的 ERP 商品 ID。")
    product_code: str | None = Field(description="商品编码。")
    product_name: str = Field(description="商品名称。")
    planned_ship_date: date = Field(description="计划出货日期。")
    total_quantity: str = Field(description="合同订购总数量。")
    shipped_quantity: str = Field(description="已出货数量。")
    unshipped_quantity: str = Field(description="尚未出货数量。")
    shipped_amount: str = Field(description="已出货金额。")
    unshipped_amount: str = Field(description="尚未出货金额。")
    unit: str = Field(description="商品计量单位。")
    status: str = Field(description="出货进度状态。")


class ExportContractResponse(BaseModel):
    """ERP 出口订单详情及履约进度。"""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="ERP 出口订单 ID，查询、更新和删除时使用。")
    code: str = Field(description="唯一的出口订单号（出口合同号）。")
    contract_date: date = Field(description="合同签订日期。")
    customer_id: str | None = Field(description="关联的 ERP 客户 ID。")
    customer_name: str = Field(description="合同上的客户名称。")
    sales_user_id: str | None = Field(description="负责该订单的业务员用户 ID。")
    sales_user_name: str | None = Field(description="负责该订单的业务员姓名。")
    currency: str = Field(description="合同币种。")
    trade_term: str = Field(description="国际贸易术语（Incoterm）。")
    planned_ship_date: date = Field(description="计划出货日期。")
    payment_terms: str = Field(description="合同约定的付款条件。")
    source_quotation_id: str | None = Field(description="来源出口报价单 ID。")
    source_quotation_no: str | None = Field(description="来源出口报价单号。")
    remarks: str | None = Field(description="出口订单整体备注。")
    approval_status: str = Field(
        description="审批状态；常见值为 draft、submitted、approved、rejected。"
    )
    submitted_at: date | None = Field(description="提交审批日期。")
    approved_at: date | None = Field(description="审批通过日期。")
    reviewer_name: str | None = Field(description="审批人姓名。")
    signature_status: str = Field(description="客户签章状态。")
    customer_signed_at: date | None = Field(description="客户签章日期。")
    owner_user_id: str = Field(description="订单归属业务员的用户 ID。")
    statistics: ExportContractStatisticsResponse = Field(description="订单履约汇总统计。")
    lines: list[ExportContractLineResponse] = Field(description="出口订单商品明细。")
    signatures: list[ExportContractSignatureResponse] = Field(description="订单签章记录。")
    advance_payments: list[ExportContractAdvancePaymentResponse] = Field(
        description="订单预收款记录。"
    )
    purchase_statuses: list[ExportContractPurchaseStatusResponse] = Field(
        description="按商品汇总的采购进度。"
    )
    shipment_statuses: list[ExportContractShipmentStatusResponse] = Field(
        description="按商品汇总的出货进度。"
    )


class ExportContractListResponse(BaseModel):
    """分页出口订单查询结果。"""

    model_config = ConfigDict(extra="forbid")

    items: list[ExportContractResponse] = Field(description="当前分页返回的出口订单列表。")
    total: int = Field(description="符合查询条件的出口订单总数。")


class ExportContractExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str
