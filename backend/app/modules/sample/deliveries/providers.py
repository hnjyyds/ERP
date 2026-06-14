from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.sample.deliveries.repositories import SampleDeliveryRepository
from app.modules.sample.deliveries.services import SampleDeliveryService
from app.modules.sample.records.repositories import SampleRecordRepository


async def get_sample_delivery_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SampleDeliveryService:
    return SampleDeliveryService(
        SampleDeliveryRepository(session),
        SampleRecordRepository(session),
    )
