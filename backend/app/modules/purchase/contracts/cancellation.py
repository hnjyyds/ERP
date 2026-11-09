"""作废与重开工作流：采购合同。"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Select, delete, select

from app.db.uow import UnitOfWork
from app.modules.purchase.contracts.errors import PurchaseContractNotFoundError
from app.modules.purchase.contracts.rows import PurchaseContractRow
from app.modules.purchase.contracts.schemas import (
    PurchaseContractCancel,
    PurchaseContractReissue,
    PurchaseContractResponse,
)
from app.modules.sales.contracts.cancellation import decrease_line_purchased_quantity
from app.modules.system.audit_logs.recorder import record_audit
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.numbering.generator import create_with_generated_code

if TYPE_CHECKING:
    from app.modules.purchase.contracts.services import PurchaseContractService


async def cancel_purchase_contract(
    service: PurchaseContractService,
    *,
    current_user: CurrentUserResponse,
    contract_id: str,
    payload: PurchaseContractCancel,
) -> PurchaseContractResponse:
    service._require(current_user, "purchase:contract:edit")
    contract = await service._get_accessible_contract(
        current_user=current_user,
        contract_id=contract_id,
    )
    if contract.approval_status == "cancelled":
        raise ValueError("采购合同已作废，不能重复作废")
    if contract.approval_status == "submitted":
        raise ValueError("审批中的采购合同不能作废，请先完成审批")
    if contract.approval_status not in {"draft", "approved", "rejected"}:
        raise ValueError("当前状态的采购合同不能作废")
    if not payload.reason.strip():
        raise ValueError("作废原因不能为空")

    blockers = await _downstream_blockers(service, contract)
    if blockers:
        raise ValueError("采购合同存在下游单据，不能作废：" + "、".join(blockers))

    async with UnitOfWork(service._repository.session):
        if contract.approval_status == "approved":
            await _reverse_export_purchase_progress(service, contract.id)
        await _cleanup_generated_plans(service, contract.id)
        cancelled = await service._repository.cancel_contract(
            contract_id=contract.id,
            cancel_reason=payload.reason.strip(),
            cancelled_by_id=current_user.id,
            cancelled_by_name=current_user.display_name,
            cancelled_at=datetime.now(UTC),
        )
        if cancelled is None:
            raise PurchaseContractNotFoundError
        await record_audit(
            service._repository.session, current_user, "cancel", "purchase_contract",
            cancelled.id, cancelled.code, "作废采购合同",
            {"reason": payload.reason.strip()},
        )
    return await service._response_builder.build(cancelled)


async def reissue_purchase_contract(
    service: PurchaseContractService,
    *,
    current_user: CurrentUserResponse,
    contract_id: str,
    payload: PurchaseContractReissue,
) -> PurchaseContractResponse:
    service._require(current_user, "purchase:contract:edit")
    contract = await service._get_accessible_contract(
        current_user=current_user,
        contract_id=contract_id,
    )
    if contract.approval_status != "cancelled":
        raise ValueError("只有已作废的采购合同可以重开")
    if not payload.reason.strip():
        raise ValueError("重开原因不能为空")
    existing = await service._repository.get_reissued_contract(source_contract_id=contract.id)
    if existing is not None:
        raise ValueError(f"该采购合同已重开为 {existing.code}，不能重复重开")

    lines = await service._repository.list_lines(contract.id)
    source_links = await service._repository.list_source_links(contract.id)

    async def create_reissue_row(code: str) -> PurchaseContractRow:
        async with UnitOfWork(service._repository.session):
            reissued = await service._repository.create_contract(
                code=code,
                contract_date=contract.contract_date,
                supplier_id=contract.supplier_id,
                supplier_name=contract.supplier_name,
                buyer_user_id=contract.buyer_user_id,
                buyer_user_name=contract.buyer_user_name,
                qc_user_id=contract.qc_user_id,
                qc_user_name=contract.qc_user_name,
                currency=contract.currency,
                delivery_date=contract.delivery_date,
                payment_terms=contract.payment_terms,
                source_type=contract.source_type,
                remarks=contract.remarks,
                approval_status="draft",
                owner_user_id=contract.owner_user_id,
                reissued_from_id=contract.id,
                reissued_from_code=contract.code,
                reissue_reason=payload.reason.strip(),
            )
            for line in lines:
                await service._repository.add_line(
                    contract_id=reissued.id,
                    product_id=line.product_id,
                    product_code=line.product_code,
                    product_name=line.product_name,
                    specification=line.specification,
                    model=line.model,
                    quantity=line.quantity,
                    unit=line.unit,
                    unit_price=line.unit_price,
                    amount=line.amount,
                    source_export_contract_id=line.source_export_contract_id,
                    source_export_contract_no=line.source_export_contract_no,
                    source_export_contract_line_id=line.source_export_contract_line_id,
                    remark=line.remark,
                )
            for link in source_links:
                await service._repository.add_source_link(
                    contract_id=reissued.id,
                    export_contract_id=link.export_contract_id,
                    export_contract_no=link.export_contract_no,
                    export_contract_line_id=link.export_contract_line_id,
                    customer_name=link.customer_name,
                    product_id=link.product_id,
                    product_code=link.product_code,
                    demand_quantity=link.demand_quantity,
                    unit=link.unit,
                )
            refreshed = await service._repository.refresh_statistics(reissued.id)
            if refreshed is None:
                raise PurchaseContractNotFoundError
            await record_audit(
                service._repository.session, current_user, "reopen", "purchase_contract",
                refreshed.id, refreshed.code, "重开采购合同",
                {"reissued_from": contract.code, "reason": payload.reason.strip()},
            )
            await service._rebuild_reminders(refreshed)
            return refreshed

    reissued = await create_with_generated_code("purchase.contract", create_reissue_row)
    return await service._response_builder.build(reissued)


async def _downstream_blockers(
    service: PurchaseContractService,
    contract: PurchaseContractRow,
) -> list[str]:
    from app.modules.finance.payments.models import PaymentRequest, SupplierInvoice
    from app.modules.followup.models import PurchaseFollowNode, PurchaseFollowPlan
    from app.modules.purchase.invoice_notices.models import PurchaseInvoiceNoticeLine
    from app.modules.quality.inspections.models import QualityInspection
    from app.modules.sample.records.models import SampleFollowupEvent, SampleRecord
    from app.modules.warehouse.inbound_orders.models import InboundOrder
    from app.modules.warehouse.inbound_plans.models import InboundPlan, InboundPlanLine

    session = service._repository.session
    blockers: list[str] = []

    async def exists(statement: Select[Any]) -> bool:
        return await session.scalar(statement.limit(1)) is not None

    if await exists(
        select(InboundOrder.id).where(InboundOrder.purchase_contract_id == contract.id)
    ):
        blockers.append("已存在入库单")

    plans = list(
        await session.scalars(
            select(InboundPlan).where(InboundPlan.purchase_contract_id == contract.id)
        )
    )
    if any(plan.status != "planned" for plan in plans):
        blockers.append("入库计划已开始执行")
    elif plans:
        plan_ids = [plan.id for plan in plans]
        if await exists(
            select(InboundPlanLine.id).where(
                InboundPlanLine.plan_id.in_(plan_ids),
                InboundPlanLine.received_quantity > 0,
            )
        ):
            blockers.append("入库计划已有收货数量")

    if await exists(
        select(QualityInspection.id).where(QualityInspection.purchase_contract_id == contract.id)
    ):
        blockers.append("已存在质检单")

    if await exists(
        select(PurchaseInvoiceNoticeLine.id).where(
            PurchaseInvoiceNoticeLine.purchase_contract_id == contract.id
        )
    ):
        blockers.append("已存在采购开票通知")

    if await exists(
        select(SupplierInvoice.id).where(SupplierInvoice.purchase_contract_id == contract.id)
    ):
        blockers.append("已存在供应商发票")
    if await exists(
        select(PaymentRequest.id).where(PaymentRequest.purchase_contract_id == contract.id)
    ):
        blockers.append("已存在付款申请")

    if await exists(
        select(SampleRecord.id).where(SampleRecord.purchase_contract_id == contract.id)
    ) or await exists(
        select(SampleFollowupEvent.id).where(
            SampleFollowupEvent.purchase_contract_id == contract.id
        )
    ):
        blockers.append("已存在样品记录")

    plan = await session.scalar(
        select(PurchaseFollowPlan).where(PurchaseFollowPlan.purchase_contract_id == contract.id)
    )
    if plan is not None and await exists(
        select(PurchaseFollowNode.id).where(
            PurchaseFollowNode.follow_plan_id == plan.id,
            PurchaseFollowNode.node_code != "contract_confirmed",
            PurchaseFollowNode.status == "completed",
        )
    ):
        blockers.append("跟单计划已产生执行记录")

    return blockers


async def _reverse_export_purchase_progress(
    service: PurchaseContractService,
    contract_id: str,
) -> None:
    source_links = await service._repository.list_source_links(contract_id)
    affected_contract_ids: list[str] = []
    for link in source_links:
        other_approved = await service._repository.has_other_approved_purchase_for_source_line(
            export_contract_line_id=link.export_contract_line_id,
            current_contract_id=contract_id,
        )
        if other_approved:
            continue
        await decrease_line_purchased_quantity(
            service._export_contract_repository.session,
            line_id=link.export_contract_line_id,
            quantity=link.demand_quantity,
        )
        if link.export_contract_id not in affected_contract_ids:
            affected_contract_ids.append(link.export_contract_id)
    for export_contract_id in affected_contract_ids:
        await service._export_contract_repository.refresh_statistics(export_contract_id)


async def _cleanup_generated_plans(
    service: PurchaseContractService,
    contract_id: str,
) -> None:
    """删除仍在计划阶段、尚未执行的自动跟单/入库计划，避免悬空引用。"""
    from app.modules.followup.models import PurchaseFollowNode, PurchaseFollowPlan
    from app.modules.warehouse.inbound_plans.models import InboundPlan, InboundPlanLine

    session = service._repository.session
    plans = list(
        await session.scalars(
            select(InboundPlan).where(InboundPlan.purchase_contract_id == contract_id)
        )
    )
    for plan in plans:
        await session.execute(delete(InboundPlanLine).where(InboundPlanLine.plan_id == plan.id))
        await session.delete(plan)

    follow_plan = await session.scalar(
        select(PurchaseFollowPlan).where(PurchaseFollowPlan.purchase_contract_id == contract_id)
    )
    if follow_plan is not None:
        await session.execute(
            delete(PurchaseFollowNode).where(PurchaseFollowNode.follow_plan_id == follow_plan.id)
        )
        await session.delete(follow_plan)
    await session.flush()
