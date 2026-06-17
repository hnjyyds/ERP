from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.company.models import COMPANY_INFO_ID, CompanyInfo


@dataclass(frozen=True)
class CompanyInfoRow:
    name: str
    name_en: str | None
    letterhead: str | None
    address: str | None
    address_en: str | None
    phone: str | None
    fax: str | None
    email: str | None
    website: str | None
    tax_no: str | None
    bank_name: str | None
    bank_account: str | None
    bank_swift: str | None
    logo: str | None
    updated_at: datetime | None


class CompanyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_company_info(self) -> CompanyInfoRow | None:
        record = await self.session.scalar(
            select(CompanyInfo).where(CompanyInfo.id == COMPANY_INFO_ID)
        )
        if record is None:
            return None
        return self._to_row(record)

    async def upsert_company_info(
        self,
        *,
        fields: dict[str, str | None],
        updated_at: datetime,
    ) -> CompanyInfoRow:
        record = await self.session.scalar(
            select(CompanyInfo).where(CompanyInfo.id == COMPANY_INFO_ID)
        )
        if record is None:
            record = CompanyInfo(id=COMPANY_INFO_ID, name=fields.get("name") or "")
            self.session.add(record)
        for key, value in fields.items():
            setattr(record, key, value)
        record.updated_at = updated_at
        await self.session.flush()
        return self._to_row(record)

    def _to_row(self, record: CompanyInfo) -> CompanyInfoRow:
        return CompanyInfoRow(
            name=record.name,
            name_en=record.name_en,
            letterhead=record.letterhead,
            address=record.address,
            address_en=record.address_en,
            phone=record.phone,
            fax=record.fax,
            email=record.email,
            website=record.website,
            tax_no=record.tax_no,
            bank_name=record.bank_name,
            bank_account=record.bank_account,
            bank_swift=record.bank_swift,
            logo=record.logo,
            updated_at=record.updated_at,
        )
