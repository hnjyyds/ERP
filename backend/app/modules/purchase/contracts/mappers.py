from decimal import Decimal

from app.modules.purchase.contracts.models import (
    PurchaseContract,
    PurchaseContractLine,
    PurchaseContractReminder,
    PurchaseContractSourceLink,
)
from app.modules.purchase.contracts.rows import (
    PurchaseContractLineRow,
    PurchaseContractReminderRow,
    PurchaseContractRow,
    PurchaseContractSourceLinkRow,
)


def format_money(value: Decimal) -> str:
    return f"{value:.2f}"


def format_quantity(value: Decimal) -> str:
    return f"{value:.4f}".rstrip("0").rstrip(".")


def map_purchase_contract(contract: PurchaseContract) -> PurchaseContractRow:
    unreceived_quantity = contract.total_quantity - contract.received_quantity
    unpaid_amount = contract.total_amount - contract.paid_amount
    return PurchaseContractRow(
        id=contract.id,
        code=contract.code,
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
        approval_status=contract.approval_status,
        submitted_at=contract.submitted_at,
        approved_at=contract.approved_at,
        rejected_at=contract.rejected_at,
        rejection_reason=contract.rejection_reason,
        reviewer_id=contract.reviewer_id,
        reviewer_name=contract.reviewer_name,
        total_quantity=format_quantity(contract.total_quantity),
        total_amount=format_money(contract.total_amount),
        received_quantity=format_quantity(contract.received_quantity),
        unreceived_quantity=format_quantity(unreceived_quantity),
        paid_amount=format_money(contract.paid_amount),
        unpaid_amount=format_money(unpaid_amount),
        cancelled_at=contract.cancelled_at,
        cancelled_by_id=contract.cancelled_by_id,
        cancelled_by_name=contract.cancelled_by_name,
        cancel_reason=contract.cancel_reason,
        reissued_from_id=contract.reissued_from_id,
        reissued_from_code=contract.reissued_from_code,
        reissue_reason=contract.reissue_reason,
        owner_user_id=contract.owner_user_id,
        created_at=contract.created_at,
    )


def map_purchase_contract_line(line: PurchaseContractLine) -> PurchaseContractLineRow:
    unreceived_quantity = line.quantity - line.received_quantity
    return PurchaseContractLineRow(
        id=line.id,
        contract_id=line.contract_id,
        product_id=line.product_id,
        product_code=line.product_code,
        product_name=line.product_name,
        specification=line.specification,
        model=line.model,
        quantity=line.quantity,
        unit=line.unit,
        unit_price=line.unit_price,
        amount=format_money(line.amount),
        received_quantity=line.received_quantity,
        unreceived_quantity=format_quantity(unreceived_quantity),
        source_export_contract_id=line.source_export_contract_id,
        source_export_contract_no=line.source_export_contract_no,
        source_export_contract_line_id=line.source_export_contract_line_id,
        remark=line.remark,
        created_at=line.created_at,
    )


def map_purchase_source_link(
    link: PurchaseContractSourceLink,
) -> PurchaseContractSourceLinkRow:
    return PurchaseContractSourceLinkRow(
        id=link.id,
        contract_id=link.contract_id,
        export_contract_id=link.export_contract_id,
        export_contract_no=link.export_contract_no,
        export_contract_line_id=link.export_contract_line_id,
        customer_name=link.customer_name,
        product_id=link.product_id,
        product_code=link.product_code,
        demand_quantity=format_quantity(link.demand_quantity),
        unit=link.unit,
        created_at=link.created_at,
    )


def map_purchase_reminder(
    reminder: PurchaseContractReminder,
) -> PurchaseContractReminderRow:
    return PurchaseContractReminderRow(
        id=reminder.id,
        contract_id=reminder.contract_id,
        reminder_type=reminder.reminder_type,
        title=reminder.title,
        due_date=reminder.due_date,
        amount=format_money(reminder.amount) if reminder.amount is not None else None,
        currency=reminder.currency,
        status=reminder.status,
        created_at=reminder.created_at,
    )
