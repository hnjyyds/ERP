"""业务通知写入入口：与业务变更、审计日志同事务提交。

审批四件事的接收人：
- 提交 / 撤回：通知审批人；
- 通过 / 驳回：通知提交人。
``source_type + source_id + event + owner_user_id`` 唯一，重试不会产生重复消息。
"""

from datetime import UTC, datetime
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.messages import translate
from app.modules.system.dashboard.models import Notification

# resource_type -> (实体 i18n key, 列表页路径, 列表页是否消费 q 关键字)
_RESOURCE_CONFIG: dict[str, tuple[str, str, bool]] = {
    "export_quotation": ("entity.sales.quotations", "/sales/quotations", True),
    "export_contract": ("entity.sales.contracts", "/sales/contracts", True),
    "purchase_contract": ("entity.purchase.contracts", "/purchase/contracts", True),
    "sample_delivery": ("entity.sample.deliveries", "/sample/deliveries", True),
    "shipment": ("entity.sales.shipments", "/sales/shipments", True),
    "inbound_order": ("entity.warehouse.inbound_orders", "/warehouse/inbound-orders", True),
    "outbound_order": ("entity.warehouse.outbound_orders", "/warehouse/outbound-orders", True),
    "payment_request": ("entity.finance.payments", "/finance/payments", False),
    "fee_payment_request": ("entity.finance.fee_payments", "/finance/fees", False),
    "reimbursement": ("entity.finance.reimbursements", "/finance/reimbursements", False),
}

_EVENT_BY_ACTION = {
    "submit": "approval.submitted",
    "approve": "approval.approved",
    "reject": "approval.rejected",
    "withdraw": "approval.withdrawn",
}

_SEVERITY_BY_ACTION = {
    "submit": "info",
    "approve": "success",
    "reject": "warning",
    "withdraw": "info",
}

_REVIEWER_ACTIONS = {"submit", "withdraw"}


def _target_path(base_path: str, *, searchable: bool, resource_no: str) -> str:
    if not searchable:
        return base_path
    return f"{base_path}?q={quote(resource_no)}"


def _document_no(row: object) -> str | None:
    for attr in ("code", "request_no", "reimbursement_no"):
        value = getattr(row, attr, None)
        if value:
            return str(value)
    return None


def _owner_id(row: object) -> str | None:
    for attr in ("owner_user_id", "requester_user_id", "applicant_user_id"):
        value = getattr(row, attr, None)
        if value:
            return str(value)
    return None


async def notify(
    repository: object,
    actor: object,
    row: object,
    action: str,
    resource_type: str,
    *,
    reason: str | None = None,
) -> None:
    """按单据行写入审批通知，供各业务服务在审计埋点旁直接调用。"""
    session = getattr(repository, "session", repository)
    await notify_approval(
        session,
        action=action,
        resource_type=resource_type,
        resource_id=getattr(row, "id", None),
        resource_no=_document_no(row),
        actor_id=getattr(actor, "id", ""),
        actor_name=getattr(actor, "display_name", ""),
        owner_user_id=_owner_id(row),
        reviewer_user_id=getattr(row, "reviewer_id", None),
        reason=reason,
    )


async def notify_approval(
    session: AsyncSession,
    *,
    action: str,
    resource_type: str,
    resource_id: str | None,
    resource_no: str | None,
    actor_id: str,
    actor_name: str,
    owner_user_id: str | None,
    reviewer_user_id: str | None,
    reason: str | None = None,
) -> None:
    """审批状态变化时写入站内通知；不满足条件时静默跳过。"""
    event = _EVENT_BY_ACTION.get(action)
    config = _RESOURCE_CONFIG.get(resource_type)
    if event is None or config is None or resource_id is None or not resource_no:
        return
    recipient_id = reviewer_user_id if action in _REVIEWER_ACTIONS else owner_user_id
    if not recipient_id or recipient_id == actor_id:
        return

    entity_key, base_path, searchable = config
    exists = await session.scalar(
        select(Notification.id)
        .where(
            Notification.source_type == resource_type,
            Notification.source_id == resource_id,
            Notification.event == event,
            Notification.owner_user_id == recipient_id,
        )
        .limit(1)
    )
    if exists is not None:
        return

    message_key = event
    params: dict[str, object] = {
        "actor": actor_name,
        "entity": translate(entity_key),
        "no": resource_no,
    }
    rejection_reason = (reason or "").strip()
    if action == "reject" and rejection_reason:
        message_key = "approval.rejected_with_reason"
        params["reason"] = rejection_reason

    session.add(
        Notification(
            owner_user_id=recipient_id,
            title=translate("notification.approval.title"),
            message=translate(f"notification.{message_key}", **params),
            severity=_SEVERITY_BY_ACTION[action],
            source_type=resource_type,
            source_id=resource_id,
            event=event,
            target_path=_target_path(base_path, searchable=searchable, resource_no=resource_no),
            is_read=False,
            created_at=datetime.now(UTC),
        )
    )
    await session.flush()
