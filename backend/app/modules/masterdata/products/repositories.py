from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.products.models import Product, ProductAccessory


@dataclass(frozen=True)
class ProductRow:
    id: str
    code: str
    cn_name: str
    en_name: str
    specification: str | None
    model: str | None
    customs_code: str
    tax_rate: Decimal
    rebate_rate: Decimal
    package_info: str
    unit: str
    image_url: str | None
    status: str
    created_at: datetime


@dataclass(frozen=True)
class ProductAccessoryRow:
    id: str
    product_id: str
    accessory_name: str
    unit_consumption: Decimal
    unit: str
    default_supplier_name: str | None
    purchase_split_rule: str
    created_at: datetime


class ProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_product(
        self,
        *,
        code: str,
        cn_name: str,
        en_name: str,
        specification: str | None = None,
        model: str | None = None,
        customs_code: str,
        tax_rate: Decimal | str,
        rebate_rate: Decimal | str,
        package_info: str,
        unit: str,
        image_url: str | None,
        status: str = "active",
    ) -> ProductRow:
        product = Product(
            code=code,
            cn_name=cn_name,
            en_name=en_name,
            specification=specification,
            model=model,
            customs_code=customs_code,
            tax_rate=Decimal(str(tax_rate)),
            rebate_rate=Decimal(str(rebate_rate)),
            package_info=package_info,
            unit=unit,
            image_url=image_url,
            status=status,
        )
        self.session.add(product)
        await self.session.flush()
        return self._map_product(product)

    async def update_product(
        self,
        *,
        product_id: str,
        code: str,
        cn_name: str,
        en_name: str,
        specification: str | None,
        model: str | None,
        customs_code: str,
        tax_rate: Decimal | str,
        rebate_rate: Decimal | str,
        package_info: str,
        unit: str,
        image_url: str | None,
        status: str,
    ) -> ProductRow | None:
        product = await self.session.scalar(select(Product).where(Product.id == product_id))
        if product is None:
            return None
        product.code = code
        product.cn_name = cn_name
        product.en_name = en_name
        product.specification = specification
        product.model = model
        product.customs_code = customs_code
        product.tax_rate = Decimal(str(tax_rate))
        product.rebate_rate = Decimal(str(rebate_rate))
        product.package_info = package_info
        product.unit = unit
        product.image_url = image_url
        product.status = status
        await self.session.flush()
        return self._map_product(product)

    async def deactivate_product(self, product_id: str) -> ProductRow | None:
        product = await self.session.scalar(select(Product).where(Product.id == product_id))
        if product is None:
            return None
        product.status = "inactive"
        await self.session.flush()
        return self._map_product(product)

    async def add_accessory(
        self,
        *,
        product_id: str,
        accessory_name: str,
        unit_consumption: Decimal | str,
        unit: str,
        default_supplier_name: str | None,
        purchase_split_rule: str,
    ) -> ProductAccessoryRow:
        accessory = ProductAccessory(
            product_id=product_id,
            accessory_name=accessory_name,
            unit_consumption=Decimal(str(unit_consumption)),
            unit=unit,
            default_supplier_name=default_supplier_name,
            purchase_split_rule=purchase_split_rule,
        )
        self.session.add(accessory)
        await self.session.flush()
        return self._map_accessory(accessory)

    async def update_accessory(
        self,
        *,
        product_id: str,
        accessory_id: str,
        accessory_name: str,
        unit_consumption: Decimal | str,
        unit: str,
        default_supplier_name: str | None,
        purchase_split_rule: str,
    ) -> ProductAccessoryRow | None:
        accessory = await self.session.scalar(
            select(ProductAccessory).where(
                ProductAccessory.id == accessory_id,
                ProductAccessory.product_id == product_id,
            )
        )
        if accessory is None:
            return None
        accessory.accessory_name = accessory_name
        accessory.unit_consumption = Decimal(str(unit_consumption))
        accessory.unit = unit
        accessory.default_supplier_name = default_supplier_name
        accessory.purchase_split_rule = purchase_split_rule
        await self.session.flush()
        return self._map_accessory(accessory)

    async def delete_accessory(
        self,
        *,
        product_id: str,
        accessory_id: str,
    ) -> ProductAccessoryRow | None:
        accessory = await self.session.scalar(
            select(ProductAccessory).where(
                ProductAccessory.id == accessory_id,
                ProductAccessory.product_id == product_id,
            )
        )
        if accessory is None:
            return None
        row = self._map_accessory(accessory)
        await self.session.delete(accessory)
        await self.session.flush()
        return row

    async def get_product(self, product_id: str) -> ProductRow | None:
        product = await self.session.scalar(select(Product).where(Product.id == product_id))
        if product is None:
            return None
        return self._map_product(product)

    async def list_accessories(self, product_id: str) -> list[ProductAccessoryRow]:
        rows = await self.session.scalars(
            select(ProductAccessory)
            .where(ProductAccessory.product_id == product_id)
            .order_by(ProductAccessory.created_at.asc(), ProductAccessory.id.asc())
        )
        return [self._map_accessory(row) for row in rows]

    async def list_products(
        self,
        *,
        q: str | None = None,
        include_inactive: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ProductRow], int]:
        statement = select(Product)
        count_statement = select(func.count()).select_from(Product)
        if not include_inactive:
            statement = statement.where(Product.status == "active")
            count_statement = count_statement.where(Product.status == "active")
        if q:
            pattern = f"%{q}%"
            condition = or_(
                Product.code.ilike(pattern),
                Product.cn_name.ilike(pattern),
                Product.en_name.ilike(pattern),
                Product.customs_code.ilike(pattern),
            )
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)

        statement = (
            statement.order_by(Product.created_at.desc(), Product.code.asc())
            .limit(limit)
            .offset(offset)
        )
        rows = await self._scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_product(row) for row in rows], int(total or 0)

    async def _scalars(self, statement: Select[tuple[Product]]) -> list[Product]:
        result = await self.session.scalars(statement)
        return list(result)

    def _map_product(self, product: Product) -> ProductRow:
        return ProductRow(
            id=product.id,
            code=product.code,
            cn_name=product.cn_name,
            en_name=product.en_name,
            specification=product.specification,
            model=product.model,
            customs_code=product.customs_code,
            tax_rate=product.tax_rate,
            rebate_rate=product.rebate_rate,
            package_info=product.package_info,
            unit=product.unit,
            image_url=product.image_url,
            status=product.status,
            created_at=product.created_at,
        )

    def _map_accessory(self, accessory: ProductAccessory) -> ProductAccessoryRow:
        return ProductAccessoryRow(
            id=accessory.id,
            product_id=accessory.product_id,
            accessory_name=accessory.accessory_name,
            unit_consumption=accessory.unit_consumption,
            unit=accessory.unit,
            default_supplier_name=accessory.default_supplier_name,
            purchase_split_rule=accessory.purchase_split_rule,
            created_at=accessory.created_at,
        )
