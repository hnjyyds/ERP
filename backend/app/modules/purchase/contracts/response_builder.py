"""Purchase-contract response assembly with batched child loading."""

from decimal import Decimal

from app.modules.purchase.contracts.repositories import (
    PurchaseContractDetails,
    PurchaseContractLineRow,
    PurchaseContractReminderRow,
    PurchaseContractRepository,
    PurchaseContractRow,
    PurchaseContractSourceLinkRow,
)
from app.modules.purchase.contracts.schemas import (
    PurchaseContractLineResponse,
    PurchaseContractReminderResponse,
    PurchaseContractResponse,
    PurchaseContractSourceLinkResponse,
    PurchaseContractStatisticsResponse,
)


class PurchaseContractResponseBuilder:
    """Map repository rows to API schemas without per-contract queries."""

    def __init__(self, repository: PurchaseContractRepository) -> None:
        self._repository = repository

    async def build(self, contract: PurchaseContractRow) -> PurchaseContractResponse:
        details = await self._repository.list_details([contract.id])
        return self._response(contract, details[contract.id])

    async def build_many(
        self,
        contracts: list[PurchaseContractRow],
    ) -> list[PurchaseContractResponse]:
        details = await self._repository.list_details([contract.id for contract in contracts])
        return [self._response(contract, details[contract.id]) for contract in contracts]

    def reminder_response(
        self,
        reminder: PurchaseContractReminderRow,
    ) -> PurchaseContractReminderResponse:
        return PurchaseContractReminderResponse(
            id=reminder.id,
            contract_id=reminder.contract_id,
            reminder_type=reminder.reminder_type,
            title=reminder.title,
            due_date=reminder.due_date,
            amount=reminder.amount,
            currency=reminder.currency,
            status=reminder.status,
        )

    def _response(
        self,
        contract: PurchaseContractRow,
        details: PurchaseContractDetails,
    ) -> PurchaseContractResponse:
        return PurchaseContractResponse(
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
            reviewer_id=contract.reviewer_id,
            reviewer_name=contract.reviewer_name,
            owner_user_id=contract.owner_user_id,
            statistics=self._statistics_response(contract),
            lines=[self._line_response(line) for line in details.lines],
            source_links=[self._source_link_response(link) for link in details.source_links],
            reminders=[self.reminder_response(reminder) for reminder in details.reminders],
        )

    def _statistics_response(
        self,
        contract: PurchaseContractRow,
    ) -> PurchaseContractStatisticsResponse:
        return PurchaseContractStatisticsResponse(
            total_quantity=contract.total_quantity,
            total_amount=contract.total_amount,
            received_quantity=contract.received_quantity,
            unreceived_quantity=contract.unreceived_quantity,
            paid_amount=contract.paid_amount,
            unpaid_amount=contract.unpaid_amount,
        )

    def _line_response(
        self,
        line: PurchaseContractLineRow,
    ) -> PurchaseContractLineResponse:
        return PurchaseContractLineResponse(
            id=line.id,
            contract_id=line.contract_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            unit_price=self._quantity(line.unit_price),
            amount=line.amount,
            received_quantity=self._quantity(line.received_quantity),
            unreceived_quantity=line.unreceived_quantity,
            source_export_contract_id=line.source_export_contract_id,
            source_export_contract_no=line.source_export_contract_no,
            source_export_contract_line_id=line.source_export_contract_line_id,
            remark=line.remark,
        )

    def _source_link_response(
        self,
        link: PurchaseContractSourceLinkRow,
    ) -> PurchaseContractSourceLinkResponse:
        return PurchaseContractSourceLinkResponse(
            id=link.id,
            contract_id=link.contract_id,
            export_contract_id=link.export_contract_id,
            export_contract_no=link.export_contract_no,
            export_contract_line_id=link.export_contract_line_id,
            customer_name=link.customer_name,
            product_id=link.product_id,
            product_code=link.product_code,
            demand_quantity=link.demand_quantity,
            unit=link.unit,
        )

    @staticmethod
    def _quantity(value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
