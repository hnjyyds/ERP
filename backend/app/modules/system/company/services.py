from datetime import UTC, datetime

from app.db.uow import UnitOfWork
from app.modules.system.auth.permissions import SUPER_ADMIN_PERMISSION
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.company.repositories import CompanyInfoRow, CompanyRepository
from app.modules.system.company.schemas import CompanyInfoResponse, CompanyInfoUpdate

# 写入字段集合（不含 name，name 单独处理以保证必填语义）。
_UPDATABLE_FIELDS = (
    "name_en",
    "letterhead",
    "address",
    "address_en",
    "phone",
    "fax",
    "email",
    "website",
    "tax_no",
    "bank_name",
    "bank_account",
    "bank_swift",
    "logo",
)


class CompanyPermissionDeniedError(Exception):
    pass


class CompanyService:
    def __init__(self, repository: CompanyRepository) -> None:
        self._repository = repository

    async def get_company_info(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> CompanyInfoResponse:
        # 任意登录用户可读：单证抬头、银行信息等需被业务模块引用。
        del current_user
        row = await self._repository.get_company_info()
        if row is None:
            return CompanyInfoResponse(name="")
        return self._response(row)

    async def update_company_info(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: CompanyInfoUpdate,
    ) -> CompanyInfoResponse:
        self._require_super_admin(current_user)

        existing = await self._repository.get_company_info()
        provided = payload.model_dump(exclude_unset=True)

        fields: dict[str, str | None] = {}
        if "name" in provided:
            fields["name"] = (provided["name"] or "").strip()
        elif existing is not None:
            fields["name"] = existing.name
        else:
            fields["name"] = ""

        for key in _UPDATABLE_FIELDS:
            if key in provided:
                value = provided[key]
                fields[key] = value.strip() if isinstance(value, str) else value

        async with UnitOfWork(self._repository.session):
            updated = await self._repository.upsert_company_info(
                fields=fields,
                updated_at=datetime.now(UTC),
            )

        return self._response(updated)

    def _require_super_admin(self, current_user: CurrentUserResponse) -> None:
        if SUPER_ADMIN_PERMISSION not in current_user.permissions:
            raise CompanyPermissionDeniedError

    def _response(self, row: CompanyInfoRow) -> CompanyInfoResponse:
        return CompanyInfoResponse(
            name=row.name,
            name_en=row.name_en,
            letterhead=row.letterhead,
            address=row.address,
            address_en=row.address_en,
            phone=row.phone,
            fax=row.fax,
            email=row.email,
            website=row.website,
            tax_no=row.tax_no,
            bank_name=row.bank_name,
            bank_account=row.bank_account,
            bank_swift=row.bank_swift,
            logo=row.logo,
            updated_at=row.updated_at,
        )
