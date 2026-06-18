from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.port_data.repositories import PortDataRepository
from app.modules.finance.port_data.services import PortDataService
from app.modules.finance.tax_refunds.repositories import TaxRefundRepository


def get_port_data_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PortDataService:
    return PortDataService(
        repository=PortDataRepository(session),
        tax_refund_repository=TaxRefundRepository(session),
    )
