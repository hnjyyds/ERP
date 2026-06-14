from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.records.services import SampleRecordService


async def get_sample_record_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SampleRecordService:
    return SampleRecordService(SampleRecordRepository(session))
