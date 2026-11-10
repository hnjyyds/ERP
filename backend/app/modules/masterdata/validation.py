"""主数据引用统一校验。

所有业务写服务在写入前通过本模块校验客户端提交的主数据引用：
- 引用不存在 → ``MasterDataReferenceError``（HTTP 422）
- 引用已停用 → ``MasterDataInactiveError``（HTTP 409）

编辑旧单或服务端从上游单据派生引用时，可传 ``allow_inactive=True``，
只校验存在性，保留旧引用。
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.customers.models import Customer
from app.modules.masterdata.document_parties.models import DocumentParty
from app.modules.masterdata.partners.models import Partner
from app.modules.masterdata.products.models import Product
from app.modules.masterdata.suppliers.models import Supplier
from app.modules.system.auth.repositories import AuthRepository

CUSTOMER_NOT_FOUND = "客户不存在"
CUSTOMER_INACTIVE = "客户已停用"
SUPPLIER_NOT_FOUND = "供应商不存在"
SUPPLIER_INACTIVE = "供应商已停用"
PRODUCT_NOT_FOUND = "商品不存在"
PRODUCT_INACTIVE = "商品已停用"
PARTNER_NOT_FOUND = "合作伙伴不存在"
PARTNER_INACTIVE = "合作伙伴已停用"
DOCUMENT_PARTY_NOT_FOUND = "单证主体不存在"
DOCUMENT_PARTY_INACTIVE = "单证主体已停用"
USER_NOT_FOUND = "所选员工不存在或已停用"
PARTNER_TYPE_MISMATCH = "合作伙伴类型不一致"
PARTNER_NAME_MISMATCH = "合作伙伴名称不一致"

ACTIVE_STATUS = "active"


class MasterDataReferenceError(Exception):
    """引用的主数据不存在或不匹配。"""


class MasterDataInactiveError(Exception):
    """引用的主数据已停用。"""


class MasterDataValidator:
    """按主数据类型校验存在性与启用状态。"""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._auth_repository = AuthRepository(session)

    async def product(self, product_id: str | None, *, allow_inactive: bool = False) -> None:
        await self._require(
            Product, product_id, PRODUCT_NOT_FOUND, PRODUCT_INACTIVE, allow_inactive
        )

    async def customer(self, customer_id: str | None, *, allow_inactive: bool = False) -> None:
        await self._require(
            Customer, customer_id, CUSTOMER_NOT_FOUND, CUSTOMER_INACTIVE, allow_inactive
        )

    async def supplier(self, supplier_id: str | None, *, allow_inactive: bool = False) -> None:
        await self._require(
            Supplier, supplier_id, SUPPLIER_NOT_FOUND, SUPPLIER_INACTIVE, allow_inactive
        )

    async def partner(
        self,
        partner_id: str | None,
        *,
        allow_inactive: bool = False,
        expected_type: str | None = None,
        expected_name: str | None = None,
    ) -> None:
        if not partner_id:
            return
        partner = await self._session.scalar(
            select(Partner).where(Partner.id == partner_id)
        )
        if partner is None:
            raise MasterDataReferenceError(PARTNER_NOT_FOUND)
        if expected_type is not None and partner.partner_type != expected_type:
            raise MasterDataReferenceError(PARTNER_TYPE_MISMATCH)
        if expected_name is not None and partner.cn_name != expected_name:
            raise MasterDataReferenceError(PARTNER_NAME_MISMATCH)
        if partner.status != ACTIVE_STATUS and not allow_inactive:
            raise MasterDataInactiveError(PARTNER_INACTIVE)

    async def document_party(
        self,
        party_id: str | None,
        *,
        allow_inactive: bool = False,
    ) -> None:
        await self._require(
            DocumentParty,
            party_id,
            DOCUMENT_PARTY_NOT_FOUND,
            DOCUMENT_PARTY_INACTIVE,
            allow_inactive,
        )

    async def user(self, user_id: str | None, *, allow_inactive: bool = False) -> None:
        """校验员工存在且启用；``get_user_identity_by_id`` 已过滤停用账号。"""
        del allow_inactive
        if not user_id:
            return
        user = await self._auth_repository.get_user_identity_by_id(user_id)
        if user is None:
            raise MasterDataReferenceError(USER_NOT_FOUND)

    async def _require(
        self,
        model: type[Product] | type[Customer] | type[Supplier] | type[DocumentParty],
        record_id: str | None,
        not_found_message: str,
        inactive_message: str,
        allow_inactive: bool,
    ) -> None:
        if not record_id:
            return
        status = await self._session.scalar(
            select(model.status).where(model.id == record_id)
        )
        if status is None:
            raise MasterDataReferenceError(not_found_message)
        if status != ACTIVE_STATUS and not allow_inactive:
            raise MasterDataInactiveError(inactive_message)
