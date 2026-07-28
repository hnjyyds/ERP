from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.modules.finance.receipts.models import ReceiptAllocation
from app.modules.purchase.contracts.models import (
    PurchaseContractLine,
    PurchaseContractSourceLink,
)
from app.modules.sales.quotations.models import ExportQuotation
from app.modules.sales.shipments.models import ShipmentLine


@dataclass(frozen=True)
class ExportContractReferenceState:
    quotation: bool
    receipt_allocation: bool
    purchase_contract: bool
    shipment: bool

    @property
    def has_any(self) -> bool:
        return any(
            (
                self.quotation,
                self.receipt_allocation,
                self.purchase_contract,
                self.shipment,
            )
        )


class ExportContractReferenceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_state(self, contract_id: str) -> ExportContractReferenceState:
        return ExportContractReferenceState(
            quotation=await self._exists(
                select(ExportQuotation.id).where(
                    ExportQuotation.generated_contract_id == contract_id
                )
            ),
            receipt_allocation=await self._exists(
                select(ReceiptAllocation.id).where(ReceiptAllocation.contract_id == contract_id)
            ),
            purchase_contract=await self._has_purchase_contract_reference(contract_id),
            shipment=await self._exists(
                select(ShipmentLine.id).where(ShipmentLine.contract_id == contract_id)
            ),
        )

    async def _has_purchase_contract_reference(self, contract_id: str) -> bool:
        source_link_exists = await self._exists(
            select(PurchaseContractSourceLink.id).where(
                PurchaseContractSourceLink.export_contract_id == contract_id
            )
        )
        if source_link_exists:
            return True
        return await self._exists(
            select(PurchaseContractLine.id).where(
                PurchaseContractLine.source_export_contract_id == contract_id
            )
        )

    async def _exists(self, statement: Select[tuple[str]]) -> bool:
        result = await self._session.scalar(statement.limit(1))
        return result is not None
