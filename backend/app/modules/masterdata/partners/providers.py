from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.partners.repositories import PartnerRepository
from app.modules.masterdata.partners.services import PartnerService


async def get_partner_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PartnerService:
    return PartnerService(PartnerRepository(session))
