"""采购单据的主数据引用校验。

询价、采购合同共用：供应商与明细产品。
编辑旧单时，与单据当前值相同的引用允许保留停用状态。
"""

from app.modules.masterdata.validation import MasterDataValidator

__all__ = ["validate_purchase_document_references"]


async def validate_purchase_document_references(
    validator: MasterDataValidator,
    payload: object,
    *,
    existing_supplier_id: str | None = None,
    existing_product_ids: set[str] | None = None,
) -> None:
    supplier_id = getattr(payload, "supplier_id", None)
    if supplier_id:
        await validator.supplier(
            supplier_id,
            allow_inactive=existing_supplier_id is not None
            and supplier_id == existing_supplier_id,
        )

    keep_ids = existing_product_ids or set()
    for line in getattr(payload, "lines", []) or []:
        product_id = getattr(line, "product_id", None)
        if product_id:
            await validator.product(product_id, allow_inactive=product_id in keep_ids)
