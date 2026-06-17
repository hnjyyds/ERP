from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.system.company.repositories import CompanyRepository
from app.modules.system.company.services import CompanyService


async def get_company_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CompanyService:
    return CompanyService(repository=CompanyRepository(session))
