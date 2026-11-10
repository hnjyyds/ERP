from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.masterdata.customers.models import Customer
from app.modules.masterdata.partners.models import Partner
from app.modules.masterdata.products.models import Product
from app.modules.masterdata.suppliers.models import Supplier
from app.modules.masterdata.validation import (
    MasterDataInactiveError,
    MasterDataReferenceError,
    MasterDataValidator,
)


def _product(code: str, status: str = "active") -> Product:
    return Product(
        code=code,
        cn_name="环保袋",
        en_name="Eco Bag",
        customs_code="4202220000",
        tax_rate=Decimal("0.13"),
        rebate_rate=Decimal("0.13"),
        package_info="100pcs/carton",
        unit="pcs",
        status=status,
    )


def _customer(code: str, status: str = "active") -> Customer:
    return Customer(
        code=code,
        cn_name="客户甲",
        en_name="Customer A",
        country="US",
        status=status,
        owner_user_id="u-001",
    )


def _supplier(code: str, status: str = "active") -> Supplier:
    return Supplier(
        code=code,
        cn_name="工厂甲",
        en_name="Factory A",
        country="CN",
        status=status,
        owner_user_id="u-001",
    )


def _partner(code: str, partner_type: str, status: str = "active") -> Partner:
    return Partner(
        code=code,
        cn_name="合作方甲",
        en_name="Partner A",
        partner_type=partner_type,
        country="CN",
        status=status,
        owner_user_id="u-001",
    )


@pytest.mark.asyncio
async def test_active_master_data_passes(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        product = _product("MD-OK-1")
        customer = _customer("MD-OK-2")
        supplier = _supplier("MD-OK-3")
        session.add_all([product, customer, supplier])
        await session.flush()

        validator = MasterDataValidator(session)
        await validator.product(product.id)
        await validator.customer(customer.id)
        await validator.supplier(supplier.id)


@pytest.mark.asyncio
async def test_missing_master_data_is_rejected(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        validator = MasterDataValidator(session)
        with pytest.raises(MasterDataReferenceError):
            await validator.product("missing-product")


@pytest.mark.asyncio
async def test_inactive_master_data_is_rejected(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        customer = _customer("MD-INACTIVE", status="inactive")
        session.add(customer)
        await session.flush()

        validator = MasterDataValidator(session)
        with pytest.raises(MasterDataInactiveError):
            await validator.customer(customer.id)


@pytest.mark.asyncio
async def test_allow_inactive_keeps_existing_reference(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        product = _product("MD-OLD", status="inactive")
        session.add(product)
        await session.flush()

        validator = MasterDataValidator(session)
        await validator.product(product.id, allow_inactive=True)


@pytest.mark.asyncio
async def test_empty_reference_is_skipped(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        validator = MasterDataValidator(session)
        await validator.customer(None)
        await validator.supplier("")


@pytest.mark.asyncio
async def test_partner_type_and_name_mismatch_is_rejected(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        partner = _partner("MD-PARTNER", partner_type="freight")
        session.add(partner)
        await session.flush()

        validator = MasterDataValidator(session)
        with pytest.raises(MasterDataReferenceError):
            await validator.partner(partner.id, expected_type="customs")
        with pytest.raises(MasterDataReferenceError):
            await validator.partner(partner.id, expected_name="另一个名称")
        await validator.partner(partner.id, expected_type="freight", expected_name="合作方甲")
