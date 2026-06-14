from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.modules.purchase.contracts.models import PurchaseContract
from app.modules.sales.contracts.models import ExportContract


@dataclass(frozen=True)
class ApprovalDocumentRow:
    document_type: str
    document_type_label: str
    document_id: str
    document_no: str
    counterparty_name: str
    applicant_user_id: str | None
    applicant_user_name: str | None
    business_date: date
    submitted_at: date | None
    approved_at: date | None
    status: str
    amount: str
    currency: str
    source_path: str


class ApprovalQueryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_documents(
        self,
        *,
        document_type: str | None,
        status: str | None,
        applicant_user_id: str | None,
        date_from: date | None,
        date_to: date | None,
    ) -> list[ApprovalDocumentRow]:
        rows: list[ApprovalDocumentRow] = []
        if document_type in (None, "export_contract"):
            rows.extend(
                await self._list_export_contracts(
                    status=status,
                    applicant_user_id=applicant_user_id,
                )
            )
        if document_type in (None, "purchase_contract"):
            rows.extend(
                await self._list_purchase_contracts(
                    status=status,
                    applicant_user_id=applicant_user_id,
                )
            )
        filtered = [
            row
            for row in rows
            if self._matches_action_date(row=row, date_from=date_from, date_to=date_to)
        ]
        return sorted(
            filtered,
            key=lambda row: (
                row.approved_at or row.submitted_at or row.business_date,
                row.document_type,
                row.document_no,
            ),
            reverse=True,
        )

    async def _list_export_contracts(
        self,
        *,
        status: str | None,
        applicant_user_id: str | None,
    ) -> list[ApprovalDocumentRow]:
        statement = select(ExportContract)
        for condition in self._export_contract_conditions(
            status=status,
            applicant_user_id=applicant_user_id,
        ):
            statement = statement.where(condition)
        statement = statement.order_by(
            ExportContract.submitted_at.desc(),
            ExportContract.code.asc(),
        )
        contracts = await self._export_contract_scalars(statement)
        return [self._map_export_contract(contract) for contract in contracts]

    async def _list_purchase_contracts(
        self,
        *,
        status: str | None,
        applicant_user_id: str | None,
    ) -> list[ApprovalDocumentRow]:
        statement = select(PurchaseContract)
        for condition in self._purchase_contract_conditions(
            status=status,
            applicant_user_id=applicant_user_id,
        ):
            statement = statement.where(condition)
        statement = statement.order_by(
            PurchaseContract.submitted_at.desc(),
            PurchaseContract.code.asc(),
        )
        contracts = await self._purchase_contract_scalars(statement)
        return [self._map_purchase_contract(contract) for contract in contracts]

    def _export_contract_conditions(
        self,
        *,
        status: str | None,
        applicant_user_id: str | None,
    ) -> list[ColumnElement[bool]]:
        statuses = [status] if status else ["submitted", "approved"]
        conditions: list[ColumnElement[bool]] = [ExportContract.approval_status.in_(statuses)]
        if applicant_user_id:
            conditions.append(ExportContract.sales_user_id == applicant_user_id)
        return conditions

    def _purchase_contract_conditions(
        self,
        *,
        status: str | None,
        applicant_user_id: str | None,
    ) -> list[ColumnElement[bool]]:
        statuses = [status] if status else ["submitted", "approved"]
        conditions: list[ColumnElement[bool]] = [PurchaseContract.approval_status.in_(statuses)]
        if applicant_user_id:
            conditions.append(PurchaseContract.buyer_user_id == applicant_user_id)
        return conditions

    async def _export_contract_scalars(
        self,
        statement: Select[tuple[ExportContract]],
    ) -> list[ExportContract]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _purchase_contract_scalars(
        self,
        statement: Select[tuple[PurchaseContract]],
    ) -> list[PurchaseContract]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _matches_action_date(
        self,
        *,
        row: ApprovalDocumentRow,
        date_from: date | None,
        date_to: date | None,
    ) -> bool:
        action_date = row.approved_at if row.status == "approved" else row.submitted_at
        action_date = action_date or row.business_date
        if date_from is not None and action_date < date_from:
            return False
        if date_to is not None and action_date > date_to:
            return False
        return True

    def _map_export_contract(self, contract: ExportContract) -> ApprovalDocumentRow:
        return ApprovalDocumentRow(
            document_type="export_contract",
            document_type_label="出口合同",
            document_id=contract.id,
            document_no=contract.code,
            counterparty_name=contract.customer_name,
            applicant_user_id=contract.sales_user_id or contract.owner_user_id,
            applicant_user_name=contract.sales_user_name,
            business_date=contract.contract_date,
            submitted_at=contract.submitted_at,
            approved_at=contract.approved_at,
            status=contract.approval_status,
            amount=self._money(contract.total_amount),
            currency=contract.currency,
            source_path=f"/sales/contracts/{contract.id}",
        )

    def _map_purchase_contract(self, contract: PurchaseContract) -> ApprovalDocumentRow:
        return ApprovalDocumentRow(
            document_type="purchase_contract",
            document_type_label="采购合同",
            document_id=contract.id,
            document_no=contract.code,
            counterparty_name=contract.supplier_name,
            applicant_user_id=contract.buyer_user_id or contract.owner_user_id,
            applicant_user_name=contract.buyer_user_name,
            business_date=contract.contract_date,
            submitted_at=contract.submitted_at,
            approved_at=contract.approved_at,
            status=contract.approval_status,
            amount=self._money(contract.total_amount),
            currency=contract.currency,
            source_path=f"/purchase/contracts/{contract.id}",
        )

    def _money(self, value: Decimal | int | str) -> str:
        return f"{Decimal(str(value or 0)):.2f}"
