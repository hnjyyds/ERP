"""作废与重开工作流：出口合同。"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.uow import UnitOfWork
from app.modules.sales.contracts.errors import ExportContractNotFoundError
from app.modules.sales.contracts.models import ExportContract, ExportContractLine
from app.modules.sales.contracts.rows import ExportContractRow
from app.modules.sales.contracts.schemas import (
    ExportContractCancel,
    ExportContractReissue,
    ExportContractResponse,
)
from app.modules.system.audit_logs.recorder import record_audit
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.numbering.generator import create_with_generated_code

if TYPE_CHECKING:
    from app.modules.sales.contracts.services import ExportContractService


async def cancel_export_contract(
    service: ExportContractService,
    *,
    current_user: CurrentUserResponse,
    contract_id: str,
    payload: ExportContractCancel,
) -> ExportContractResponse:
    service._require(current_user, "sales:contract:edit")
    contract = await service._get_accessible_contract(
        current_user=current_user,
        contract_id=contract_id,
    )
    if contract.approval_status == "cancelled":
        raise ValueError("出口合同已作废，不能重复作废")
    if contract.approval_status == "submitted":
        raise ValueError("审批中的出口合同不能作废，请先完成审批")
    if contract.approval_status not in {"draft", "approved", "rejected"}:
        raise ValueError("当前状态的出口合同不能作废")
    if not payload.reason.strip():
        raise ValueError("作废原因不能为空")

    blockers: list[str] = []
    references = await service._reference_repository.get_state(contract.id)
    if references.shipment:
        blockers.append("已存在出货单")
    if references.purchase_contract:
        blockers.append("已生成采购合同")
    if references.receipt_allocation:
        blockers.append("已存在收款分配")
    if await service._repository.list_advance_payments(contract.id):
        blockers.append("已登记预收款")
    if blockers:
        raise ValueError("出口合同存在下游单据，不能作废：" + "、".join(blockers))

    async with UnitOfWork(service._repository.session):
        model = await service._repository.session.scalar(
            select(ExportContract).where(ExportContract.id == contract.id)
        )
        if model is None:
            raise ExportContractNotFoundError
        model.approval_status = "cancelled"
        model.cancel_reason = payload.reason.strip()
        model.cancelled_by_id = current_user.id
        model.cancelled_by_name = current_user.display_name
        model.cancelled_at = datetime.now(UTC)
        await service._repository.session.flush()
        cancelled = await service._repository.get_contract(contract.id)
        if cancelled is None:
            raise ExportContractNotFoundError
        await record_audit(
            service._repository.session, current_user, "cancel", "export_contract",
            cancelled.id, cancelled.code, "作废出口合同",
            {"reason": payload.reason.strip()},
        )
    return await service._contract_response(cancelled)


async def reissue_export_contract(
    service: ExportContractService,
    *,
    current_user: CurrentUserResponse,
    contract_id: str,
    payload: ExportContractReissue,
) -> ExportContractResponse:
    service._require(current_user, "sales:contract:edit")
    contract = await service._get_accessible_contract(
        current_user=current_user,
        contract_id=contract_id,
    )
    if contract.approval_status != "cancelled":
        raise ValueError("只有已作废的出口合同可以重开")
    if not payload.reason.strip():
        raise ValueError("重开原因不能为空")

    existing_code = await service._repository.session.scalar(
        select(ExportContract.code)
        .where(ExportContract.reissued_from_id == contract.id)
        .order_by(ExportContract.created_at.asc())
        .limit(1)
    )
    if existing_code is not None:
        raise ValueError(f"该出口合同已重开为 {existing_code}，不能重复重开")

    lines = await service._repository.list_lines(contract.id)

    async def create_reissue_row(code: str) -> ExportContractRow:
        async with UnitOfWork(service._repository.session):
            reissued = await service._repository.create_contract(
                code=code,
                contract_date=contract.contract_date,
                customer_id=contract.customer_id,
                customer_name=contract.customer_name,
                sales_user_id=contract.sales_user_id,
                sales_user_name=contract.sales_user_name,
                currency=contract.currency,
                trade_term=contract.trade_term,
                planned_ship_date=contract.planned_ship_date,
                payment_terms=contract.payment_terms,
                source_quotation_id=contract.source_quotation_id,
                source_quotation_no=contract.source_quotation_no,
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
                    barcode=line.barcode,
                    specification=line.specification,
                    model=line.model,
                    quantity=line.quantity,
                    unit=line.unit,
                    unit_price=line.unit_price,
                    amount=Decimal(line.amount),
                    purchased_quantity=Decimal("0"),
                    shipped_quantity=Decimal("0"),
                    image_url=line.image_url,
                    remark=line.remark,
                )
            refreshed = await service._repository.refresh_statistics(reissued.id)
            if refreshed is None:
                raise ExportContractNotFoundError
            await record_audit(
                service._repository.session, current_user, "reopen", "export_contract",
                refreshed.id, refreshed.code, "重开出口合同",
                {"reissued_from": contract.code, "reason": payload.reason.strip()},
            )
            return refreshed

    reissued = await create_with_generated_code("sales.contract", create_reissue_row)
    return await service._contract_response(reissued)


async def decrease_line_purchased_quantity(
    session: AsyncSession,
    *,
    line_id: str,
    quantity: Decimal | str,
) -> None:
    """回滚采购合同审批时写入出口合同行的已采购数量。"""
    line = await session.scalar(
        select(ExportContractLine).where(ExportContractLine.id == line_id)
    )
    if line is None:
        return
    line.purchased_quantity = max(Decimal("0"), line.purchased_quantity - Decimal(str(quantity)))
    await session.flush()
