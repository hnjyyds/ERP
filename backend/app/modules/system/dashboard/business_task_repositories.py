"""Dashboard read models for actionable records owned by other business modules."""

from dataclasses import dataclass
from datetime import date, datetime

from sqlalchemy import literal, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.finance.fee_payments.models import FeePaymentRequest
from app.modules.finance.payments.models import PaymentRequest
from app.modules.finance.reimbursements.models import Reimbursement
from app.modules.followup.models import PurchaseFollowNode, PurchaseFollowPlan
from app.modules.purchase.contracts.models import PurchaseContract
from app.modules.quality.inspections.models import QualityInspection
from app.modules.sales.contracts.models import ExportContract
from app.modules.sales.quotations.models import ExportQuotation
from app.modules.sales.shipments.models import ShipmentPlan
from app.modules.sample.deliveries.models import SampleDelivery
from app.modules.warehouse.inbound_orders.models import InboundOrder
from app.modules.warehouse.outbound_orders.models import OutboundOrder


@dataclass(frozen=True)
class QualityTodoRow:
    id: str
    code: str
    purchase_contract_no: str
    supplier_name: str
    inspector_id: str
    inspector_name: str
    creator_user_id: str
    scheduled_at: datetime | None
    status: str
    issue_summary: str | None


@dataclass(frozen=True)
class FollowupTodoRow:
    id: str
    follow_plan_id: str
    purchase_contract_no: str
    supplier_name: str
    owner_user_id: str
    node_name: str
    planned_date: date
    status: str


@dataclass(frozen=True)
class InboundApprovalTodoRow:
    id: str
    code: str
    purchase_contract_no: str
    supplier_name: str
    warehouse_name: str
    reviewer_id: str
    reviewer_name: str | None
    creator_user_id: str
    submitted_at: date | None


@dataclass(frozen=True)
class ApprovalTodoRow:
    id: str
    source_id: str
    code: str
    reviewer_id: str
    reviewer_name: str | None
    creator_user_id: str | None
    content_primary: str
    content_secondary: str | None
    source_type: str


class DashboardBusinessTaskRepository:
    """Build typed dashboard projections without duplicating business records."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_active_quality_todos(self, user_id: str) -> list[QualityTodoRow]:
        statement = (
            select(QualityInspection)
            .where(
                QualityInspection.inspector_id == user_id,
                QualityInspection.status.in_(("pending", "in_progress")),
            )
            .order_by(
                QualityInspection.scheduled_at.asc().nulls_last(),
                QualityInspection.code.asc(),
            )
        )
        rows = await self.session.scalars(statement)
        return [
            QualityTodoRow(
                id=item.id,
                code=item.code,
                purchase_contract_no=item.purchase_contract_no,
                supplier_name=item.supplier_name,
                inspector_id=item.inspector_id or user_id,
                inspector_name=item.inspector_name,
                creator_user_id=item.owner_user_id,
                scheduled_at=item.scheduled_at,
                status=item.status,
                issue_summary=item.issue_summary,
            )
            for item in rows
        ]

    async def list_active_followup_todos(self, user_id: str) -> list[FollowupTodoRow]:
        statement = (
            select(PurchaseFollowNode, PurchaseFollowPlan)
            .join(
                PurchaseFollowPlan,
                PurchaseFollowNode.follow_plan_id == PurchaseFollowPlan.id,
            )
            .where(
                PurchaseFollowPlan.owner_user_id == user_id,
                PurchaseFollowNode.actual_date.is_(None),
                PurchaseFollowNode.status.in_(("pending", "in_progress", "overdue")),
            )
            .order_by(
                PurchaseFollowNode.planned_date.asc(),
                PurchaseFollowPlan.purchase_contract_no.asc(),
                PurchaseFollowNode.sequence_no.asc(),
            )
        )
        rows = (await self.session.execute(statement)).all()
        return [
            FollowupTodoRow(
                id=node.id,
                follow_plan_id=plan.id,
                purchase_contract_no=plan.purchase_contract_no,
                supplier_name=plan.supplier_name,
                owner_user_id=plan.owner_user_id,
                node_name=node.node_name,
                planned_date=node.planned_date,
                status=node.status,
            )
            for node, plan in rows
        ]

    async def list_inbound_approval_todos(
        self,
        user_id: str,
    ) -> list[InboundApprovalTodoRow]:
        statement = (
            select(InboundOrder)
            .where(
                InboundOrder.reviewer_id == user_id,
                InboundOrder.status == "submitted",
            )
            .order_by(
                InboundOrder.submitted_at.asc().nulls_last(),
                InboundOrder.code.asc(),
            )
        )
        rows = await self.session.scalars(statement)
        return [
            InboundApprovalTodoRow(
                id=item.id,
                code=item.code,
                purchase_contract_no=item.purchase_contract_no,
                supplier_name=item.supplier_name,
                warehouse_name=item.warehouse_name,
                reviewer_id=item.reviewer_id or user_id,
                reviewer_name=item.reviewer_name,
                creator_user_id=item.owner_user_id,
                submitted_at=item.submitted_at,
            )
            for item in rows
        ]

    async def list_approval_todos(self, user_id: str) -> list[ApprovalTodoRow]:
        """Return pending approvals explicitly assigned across business modules."""

        statements = [
            self._approval_select(
                model=SampleDelivery,
                source_type="sample_delivery_approval",
                code=SampleDelivery.code,
                creator_user_id=SampleDelivery.owner_user_id,
                content_primary=SampleDelivery.customer_name,
                content_secondary=SampleDelivery.express_company,
                status_column=SampleDelivery.status,
                user_id=user_id,
            ),
            self._approval_select(
                model=ExportQuotation,
                source_type="sales_quotation_approval",
                code=ExportQuotation.code,
                creator_user_id=ExportQuotation.owner_user_id,
                content_primary=ExportQuotation.customer_name,
                content_secondary=ExportQuotation.trade_term,
                status_column=ExportQuotation.approval_status,
                user_id=user_id,
            ),
            self._approval_select(
                model=ExportContract,
                source_type="sales_contract_approval",
                code=ExportContract.code,
                creator_user_id=ExportContract.owner_user_id,
                content_primary=ExportContract.customer_name,
                content_secondary=ExportContract.trade_term,
                status_column=ExportContract.approval_status,
                user_id=user_id,
            ),
            self._approval_select(
                model=PurchaseContract,
                source_type="purchase_contract_approval",
                code=PurchaseContract.code,
                creator_user_id=PurchaseContract.owner_user_id,
                content_primary=PurchaseContract.supplier_name,
                content_secondary=PurchaseContract.source_type,
                status_column=PurchaseContract.approval_status,
                user_id=user_id,
            ),
            self._approval_select(
                model=ShipmentPlan,
                source_type="sales_shipment_approval",
                code=ShipmentPlan.code,
                creator_user_id=ShipmentPlan.owner_user_id,
                content_primary=ShipmentPlan.customer_name,
                content_secondary=ShipmentPlan.shipping_method,
                status_column=ShipmentPlan.approval_status,
                user_id=user_id,
            ),
            self._approval_select(
                model=OutboundOrder,
                source_type="warehouse_outbound_approval",
                code=OutboundOrder.code,
                creator_user_id=OutboundOrder.owner_user_id,
                content_primary=OutboundOrder.source_code,
                content_secondary=OutboundOrder.customer_name,
                status_column=OutboundOrder.status,
                user_id=user_id,
            ),
            self._approval_select(
                model=PaymentRequest,
                source_type="finance_payment_approval",
                source_id=PaymentRequest.supplier_invoice_id,
                code=PaymentRequest.request_no,
                creator_user_id=PaymentRequest.requester_user_id,
                content_primary=PaymentRequest.supplier_name,
                content_secondary=PaymentRequest.supplier_invoice_no,
                status_column=PaymentRequest.status,
                user_id=user_id,
            ),
            self._approval_select(
                model=FeePaymentRequest,
                source_type="finance_fee_payment_approval",
                source_id=FeePaymentRequest.partner_fee_invoice_id,
                code=FeePaymentRequest.request_no,
                creator_user_id=FeePaymentRequest.requester_user_id,
                content_primary=FeePaymentRequest.partner_name,
                content_secondary=FeePaymentRequest.partner_fee_invoice_no,
                status_column=FeePaymentRequest.status,
                user_id=user_id,
            ),
            self._approval_select(
                model=Reimbursement,
                source_type="finance_reimbursement_approval",
                code=Reimbursement.reimbursement_no,
                creator_user_id=Reimbursement.created_by_user_id,
                content_primary=Reimbursement.applicant_user_name,
                content_secondary=Reimbursement.department,
                status_column=Reimbursement.status,
                user_id=user_id,
            ),
        ]
        rows = (await self.session.execute(union_all(*statements).order_by("code"))).all()
        return [
            ApprovalTodoRow(
                id=row.id,
                source_id=row.source_id,
                code=row.code,
                reviewer_id=row.reviewer_id,
                reviewer_name=row.reviewer_name,
                creator_user_id=row.creator_user_id,
                content_primary=row.content_primary,
                content_secondary=row.content_secondary,
                source_type=row.source_type,
            )
            for row in rows
        ]

    @staticmethod
    def _approval_select(
        *,
        model: type,
        source_type: str,
        source_id: object | None = None,
        code: object,
        creator_user_id: object,
        content_primary: object,
        content_secondary: object,
        status_column: object,
        user_id: str,
    ) -> object:
        return select(
            model.id.label("id"),
            (source_id if source_id is not None else model.id).label("source_id"),
            code.label("code"),
            model.reviewer_id.label("reviewer_id"),
            model.reviewer_name.label("reviewer_name"),
            creator_user_id.label("creator_user_id"),
            content_primary.label("content_primary"),
            content_secondary.label("content_secondary"),
            literal(source_type).label("source_type"),
        ).where(model.reviewer_id == user_id, status_column == "submitted")
