from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.masterdata.products.models import Product, ProductAccessory
from app.modules.purchase.contracts.models import PurchaseContract, PurchaseContractLine
from app.modules.purchase.inquiries.models import PurchaseInquiry, PurchaseInquiryLine
from app.modules.sales.contracts.models import ExportContract, ExportContractLine
from app.modules.sales.quotations.models import ExportQuotation, ExportQuotationLine
from app.modules.sales.shipments.models import ShipmentLine, ShipmentPlan
from app.modules.warehouse.inbound_orders.models import InventoryLedger


@dataclass(frozen=True)
class ProductTransactionRow:
    source_type: str
    source_code: str
    occurred_at: str
    counterparty_name: str | None
    quantity: Decimal | None
    unit: str | None
    amount: Decimal | None
    summary: str


@dataclass(frozen=True)
class ProductCustomerRow:
    customer_id: str | None
    customer_name: str
    contract_count: int
    total_quantity: Decimal
    total_amount: Decimal
    last_contract_date: str | None


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

    async def get_product_by_code(self, code: str) -> ProductRow | None:
        product = await self.session.scalar(select(Product).where(Product.code == code))
        if product is None:
            return None
        return self._map_product(product)

    async def list_product_customers(self, product_id: str) -> list[ProductCustomerRow]:
        """按商品反查相关国外客户及交易（来源：出口合同行聚合到客户）。"""
        statement = (
            select(
                ExportContract.customer_id,
                ExportContract.customer_name,
                func.count(func.distinct(ExportContract.id)),
                func.coalesce(func.sum(ExportContractLine.quantity), 0),
                func.coalesce(func.sum(ExportContractLine.amount), 0),
                func.max(ExportContract.contract_date),
            )
            .join(ExportContractLine, ExportContractLine.contract_id == ExportContract.id)
            .where(ExportContractLine.product_id == product_id)
            .group_by(ExportContract.customer_id, ExportContract.customer_name)
            .order_by(func.max(ExportContract.contract_date).desc())
        )
        result = await self.session.execute(statement)
        rows: list[ProductCustomerRow] = []
        for customer_id, customer_name, count, quantity, amount, last_date in result.all():
            rows.append(
                ProductCustomerRow(
                    customer_id=customer_id,
                    customer_name=customer_name,
                    contract_count=int(count or 0),
                    total_quantity=Decimal(str(quantity or 0)),
                    total_amount=Decimal(str(amount or 0)),
                    last_contract_date=last_date.isoformat() if last_date else None,
                )
        )
        return rows

    async def list_transactions(
        self,
        *,
        product_id: str,
        limit: int = 100,
    ) -> list[ProductTransactionRow]:
        """商品业务记录：按商品行聚合销售、采购与出货业务，按发生日期倒序。"""
        rows: list[ProductTransactionRow] = []

        quotations = await self.session.execute(
            select(
                ExportQuotation.code,
                ExportQuotation.quote_date,
                ExportQuotation.customer_name,
                func.coalesce(func.sum(ExportQuotationLine.quantity), 0),
                ExportQuotationLine.unit,
                func.coalesce(func.sum(ExportQuotationLine.amount), 0),
                ExportQuotation.currency,
            )
            .join(ExportQuotationLine, ExportQuotationLine.quotation_id == ExportQuotation.id)
            .where(ExportQuotationLine.product_id == product_id)
            .group_by(
                ExportQuotation.code,
                ExportQuotation.quote_date,
                ExportQuotation.customer_name,
                ExportQuotationLine.unit,
                ExportQuotation.currency,
            )
            .order_by(ExportQuotation.quote_date.desc())
            .limit(limit)
        )
        for code, quote_date, customer_name, quantity, unit, amount, currency in quotations.all():
            rows.append(
                ProductTransactionRow(
                    source_type="export_quotation",
                    source_code=code,
                    occurred_at=quote_date.isoformat() if quote_date else "",
                    counterparty_name=customer_name,
                    quantity=Decimal(str(quantity or 0)),
                    unit=unit,
                    amount=Decimal(str(amount or 0)),
                    summary=f"出口报价 {code} · {customer_name}（{currency}）",
                )
            )

        contracts = await self.session.execute(
            select(
                ExportContract.code,
                ExportContract.contract_date,
                ExportContract.customer_name,
                func.coalesce(func.sum(ExportContractLine.quantity), 0),
                ExportContractLine.unit,
                func.coalesce(func.sum(ExportContractLine.amount), 0),
                ExportContract.currency,
            )
            .join(ExportContractLine, ExportContractLine.contract_id == ExportContract.id)
            .where(ExportContractLine.product_id == product_id)
            .group_by(
                ExportContract.code,
                ExportContract.contract_date,
                ExportContract.customer_name,
                ExportContractLine.unit,
                ExportContract.currency,
            )
            .order_by(ExportContract.contract_date.desc())
            .limit(limit)
        )
        for code, contract_date, customer_name, quantity, unit, amount, currency in contracts.all():
            rows.append(
                ProductTransactionRow(
                    source_type="export_contract",
                    source_code=code,
                    occurred_at=contract_date.isoformat() if contract_date else "",
                    counterparty_name=customer_name,
                    quantity=Decimal(str(quantity or 0)),
                    unit=unit,
                    amount=Decimal(str(amount or 0)),
                    summary=f"出口合同 {code} · {customer_name}（{currency}）",
                )
            )

        shipments = await self.session.execute(
            select(
                ShipmentPlan.code,
                ShipmentPlan.shipment_date,
                ShipmentPlan.customer_name,
                func.coalesce(func.sum(ShipmentLine.quantity), 0),
                ShipmentLine.unit,
                func.coalesce(func.sum(ShipmentLine.amount), 0),
                ShipmentPlan.currency,
            )
            .join(ShipmentLine, ShipmentLine.shipment_id == ShipmentPlan.id)
            .where(ShipmentLine.product_id == product_id)
            .group_by(
                ShipmentPlan.code,
                ShipmentPlan.shipment_date,
                ShipmentPlan.customer_name,
                ShipmentLine.unit,
                ShipmentPlan.currency,
            )
            .order_by(ShipmentPlan.shipment_date.desc())
            .limit(limit)
        )
        for code, shipment_date, customer_name, quantity, unit, amount, currency in shipments.all():
            rows.append(
                ProductTransactionRow(
                    source_type="shipment",
                    source_code=code,
                    occurred_at=shipment_date.isoformat() if shipment_date else "",
                    counterparty_name=customer_name,
                    quantity=Decimal(str(quantity or 0)),
                    unit=unit,
                    amount=Decimal(str(amount or 0)),
                    summary=f"出货明细 {code} · {customer_name}（{currency}）",
                )
            )

        inquiries = await self.session.execute(
            select(
                PurchaseInquiry.code,
                PurchaseInquiry.inquiry_date,
                PurchaseInquiry.buyer_user_name,
                func.coalesce(func.sum(PurchaseInquiryLine.quantity), 0),
                PurchaseInquiryLine.unit,
            )
            .join(PurchaseInquiryLine, PurchaseInquiryLine.inquiry_id == PurchaseInquiry.id)
            .where(PurchaseInquiryLine.product_id == product_id)
            .group_by(
                PurchaseInquiry.code,
                PurchaseInquiry.inquiry_date,
                PurchaseInquiry.buyer_user_name,
                PurchaseInquiryLine.unit,
            )
            .order_by(PurchaseInquiry.inquiry_date.desc())
            .limit(limit)
        )
        for code, inquiry_date, buyer_name, quantity, unit in inquiries.all():
            rows.append(
                ProductTransactionRow(
                    source_type="purchase_inquiry",
                    source_code=code,
                    occurred_at=inquiry_date.isoformat() if inquiry_date else "",
                    counterparty_name=buyer_name,
                    quantity=Decimal(str(quantity or 0)),
                    unit=unit,
                    amount=None,
                    summary=f"采购询价 {code}",
                )
            )

        purchase_contracts = await self.session.execute(
            select(
                PurchaseContract.code,
                PurchaseContract.contract_date,
                PurchaseContract.supplier_name,
                func.coalesce(func.sum(PurchaseContractLine.quantity), 0),
                PurchaseContractLine.unit,
                func.coalesce(func.sum(PurchaseContractLine.amount), 0),
                PurchaseContract.currency,
            )
            .join(PurchaseContractLine, PurchaseContractLine.contract_id == PurchaseContract.id)
            .where(PurchaseContractLine.product_id == product_id)
            .group_by(
                PurchaseContract.code,
                PurchaseContract.contract_date,
                PurchaseContract.supplier_name,
                PurchaseContractLine.unit,
                PurchaseContract.currency,
            )
            .order_by(PurchaseContract.contract_date.desc())
            .limit(limit)
        )
        for (
            code,
            contract_date,
            supplier_name,
            quantity,
            unit,
            amount,
            currency,
        ) in purchase_contracts.all():
            rows.append(
                ProductTransactionRow(
                    source_type="purchase_contract",
                    source_code=code,
                    occurred_at=contract_date.isoformat() if contract_date else "",
                    counterparty_name=supplier_name,
                    quantity=Decimal(str(quantity or 0)),
                    unit=unit,
                    amount=Decimal(str(amount or 0)),
                    summary=f"采购合同 {code} · {supplier_name}（{currency}）",
                )
            )

        ledgers = await self.session.execute(
            select(
                InventoryLedger.source_code,
                InventoryLedger.occurred_at,
                InventoryLedger.direction,
                InventoryLedger.quantity,
                InventoryLedger.unit,
                InventoryLedger.warehouse_name,
                InventoryLedger.location_name,
            )
            .where(InventoryLedger.product_id == product_id)
            .order_by(InventoryLedger.occurred_at.desc(), InventoryLedger.created_at.desc())
            .limit(limit)
        )
        for (
            source_code,
            occurred_at,
            direction,
            quantity,
            unit,
            warehouse_name,
            location_name,
        ) in ledgers.all():
            direction_label = "入库" if direction == "in" else "出库"
            rows.append(
                ProductTransactionRow(
                    source_type="inventory_ledger",
                    source_code=source_code,
                    occurred_at=occurred_at.isoformat() if occurred_at else "",
                    counterparty_name=f"{warehouse_name}/{location_name}",
                    quantity=Decimal(str(quantity or 0)),
                    unit=unit,
                    amount=None,
                    summary=f"库存流水 {source_code} · {direction_label}",
                )
            )

        rows.sort(key=lambda row: row.occurred_at, reverse=True)
        return rows[:limit]

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
