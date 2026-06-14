from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.receipts.repositories import ReceiptRepository
from app.modules.finance.receipts.services import ReceiptService
from app.modules.sales.contracts.repositories import ExportContractRepository


def get_receipt_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ReceiptService:
    return ReceiptService(
        ReceiptRepository(session),
        ExportContractRepository(session),
    )
