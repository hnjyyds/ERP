from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.company.models import COMPANY_INFO_ID, CompanyInfo


async def seed_company_default(session: AsyncSession) -> None:
    existing = await session.scalar(
        select(CompanyInfo.id).where(CompanyInfo.id == COMPANY_INFO_ID)
    )
    if existing is not None:
        return
    session.add(CompanyInfo(id=COMPANY_INFO_ID, name="远景外贸"))
    await session.commit()
