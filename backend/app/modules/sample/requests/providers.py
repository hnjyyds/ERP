from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.sample.requests.repositories import SampleRequestRepository
from app.modules.sample.requests.services import SampleRequestService


async def get_sample_request_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SampleRequestService:
    return SampleRequestService(SampleRequestRepository(session))
