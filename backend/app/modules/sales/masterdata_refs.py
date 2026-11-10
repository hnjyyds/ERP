"""销售单据的主数据引用校验。

报价与出口合同共用：表头客户、销售员、明细产品。
编辑旧单时，与单据当前值相同的引用允许保留停用状态。
"""

from app.modules.masterdata.validation import MasterDataValidator

__all__ = ["validate_sales_document_references"]


async def validate_sales_document_references(
    validator: MasterDataValidator,
    payload: object,
    *,
    existing: object | None = None,
    existing_product_ids: set[str] | None = None,
) -> None:
    customer_id = getattr(payload, "customer_id", None)
    await validator.customer(
        customer_id,
        allow_inactive=existing is not None
        and customer_id == getattr(existing, "customer_id", None),
    )

    sales_user_id = getattr(payload, "sales_user_id", None)
    if sales_user_id:
        await validator.user(
            sales_user_id,
            allow_inactive=existing is not None
            and sales_user_id == getattr(existing, "sales_user_id", None),
        )

    keep_ids = existing_product_ids or set()
    for line in getattr(payload, "lines", []) or []:
        product_id = getattr(line, "product_id", None)
        if product_id:
            await validator.product(product_id, allow_inactive=product_id in keep_ids)
