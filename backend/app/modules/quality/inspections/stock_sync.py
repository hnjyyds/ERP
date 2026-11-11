"""QC 判定后的跨模块联动：待检库存流转与跟进节点回写。"""

from app.modules.followup.services import FollowupService
from app.modules.quality.inspections.rows import QualityInspectionRow
from app.modules.warehouse.inventory.services import InventoryService


async def sync_pending_inventory(
    inventory_service: InventoryService,
    inspection: QualityInspectionRow,
) -> None:
    """通过转可用；不合格扣减待检量并写退回流出，其余结果保持待检。"""
    if inspection.status != "completed":
        return
    if inspection.result == "passed":
        passed = True
    elif inspection.result == "failed":
        passed = False
    else:
        return
    await inventory_service.resolve_pending_inspections_for_contract(
        purchase_contract_id=inspection.purchase_contract_id,
        passed=passed,
        inspection_id=inspection.id,
        inspection_code=inspection.code,
        occurred_at=inspection.inspected_at,
    )


async def write_back_followup_if_passed(
    followup_service: FollowupService,
    inspection: QualityInspectionRow,
) -> None:
    if inspection.status != "completed" or inspection.result != "passed":
        return
    await followup_service.complete_node_from_source(
        purchase_contract_id=inspection.purchase_contract_id,
        node_code="quality_inspection",
        source_record_type="quality_inspection",
        source_record_id=inspection.id,
        actual_date=inspection.inspected_at,
        source_summary=f"{inspection.code} QC 查验通过",
    )
