from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.sample.records.services import SampleRecordService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


async def get_sample_record_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SampleRecordService:
    return SampleRecordService(
        SampleRecordRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
