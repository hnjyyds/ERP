from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.partners.repositories import PartnerRepository
from app.modules.masterdata.partners.services import PartnerService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


async def get_partner_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PartnerService:
    return PartnerService(
        PartnerRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
