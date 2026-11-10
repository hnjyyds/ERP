"""采购合同生成流程的中间数据结构。"""

from dataclasses import dataclass
from decimal import Decimal

from app.modules.sales.contracts.repositories import ExportContractLineRow, ExportContractRow


@dataclass(frozen=True)
class GeneratedLine:
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal
    unit: str
    unit_price: Decimal
    source_export_contract_id: str | None
    source_export_contract_no: str | None
    source_export_contract_line_id: str | None
    remark: str | None


@dataclass(frozen=True)
class SourceContractLine:
    contract: ExportContractRow
    line: ExportContractLineRow
    resolved_product_id: str
