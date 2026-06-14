from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.settlements.repositories import FinancialSettlementRepository
from app.modules.finance.settlements.services import FinancialSettlementService


def get_financial_settlement_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FinancialSettlementService:
    return FinancialSettlementService(FinancialSettlementRepository(session))
