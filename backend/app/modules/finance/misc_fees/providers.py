from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.finance.misc_fees.repositories import MiscFeeRepository
from app.modules.finance.misc_fees.services import MiscFeeService
from app.modules.sales.shipments.repositories import ShipmentPlanRepository


def get_misc_fee_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MiscFeeService:
    return MiscFeeService(
        MiscFeeRepository(session),
        ShipmentPlanRepository(session),
    )
