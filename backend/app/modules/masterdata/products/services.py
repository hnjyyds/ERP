import csv
from io import StringIO

from app.db.uow import UnitOfWork
from app.modules.masterdata.products.repositories import (
    ProductAccessoryRow,
    ProductRepository,
    ProductRow,
)
from app.modules.masterdata.products.schemas import (
    ProductAccessoryCreate,
    ProductAccessoryResponse,
    ProductAccessoryUpdate,
    ProductCreate,
    ProductExportResponse,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ProductNotFoundError(Exception):
    pass


class ProductAccessoryNotFoundError(Exception):
    pass


class ProductService:
    def __init__(self, repository: ProductRepository) -> None:
        self._repository = repository

    async def create_product(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: ProductCreate,
    ) -> ProductResponse:
        self._require(current_user, "masterdata:product:edit")
        async with UnitOfWork(self._repository.session):
            product = await self._repository.create_product(
                code=payload.code,
                cn_name=payload.cn_name,
                en_name=payload.en_name,
                specification=payload.specification,
                model=payload.model,
                customs_code=payload.customs_code,
                tax_rate=payload.tax_rate,
                rebate_rate=payload.rebate_rate,
                package_info=payload.package_info,
                unit=payload.unit,
                image_url=payload.image_url,
                status=payload.status,
            )
            accessories = [
                await self._repository.add_accessory(
                    product_id=product.id,
                    accessory_name=item.accessory_name,
                    unit_consumption=item.unit_consumption,
                    unit=item.unit,
                    default_supplier_name=item.default_supplier_name,
                    purchase_split_rule=item.purchase_split_rule,
                )
                for item in payload.accessories
            ]
        return self._product_response(product, accessories)

    async def update_product(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
        payload: ProductUpdate,
    ) -> ProductResponse:
        self._require(current_user, "masterdata:product:edit")
        async with UnitOfWork(self._repository.session):
            product = await self._repository.update_product(
                product_id=product_id,
                code=payload.code,
                cn_name=payload.cn_name,
                en_name=payload.en_name,
                specification=payload.specification,
                model=payload.model,
                customs_code=payload.customs_code,
                tax_rate=payload.tax_rate,
                rebate_rate=payload.rebate_rate,
                package_info=payload.package_info,
                unit=payload.unit,
                image_url=payload.image_url,
                status=payload.status,
            )
            if product is None:
                raise ProductNotFoundError
            accessories = await self._repository.list_accessories(product_id)
        return self._product_response(product, accessories)

    async def deactivate_product(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
    ) -> ProductResponse:
        self._require(current_user, "masterdata:product:edit")
        async with UnitOfWork(self._repository.session):
            product = await self._repository.deactivate_product(product_id)
            if product is None:
                raise ProductNotFoundError
            accessories = await self._repository.list_accessories(product_id)
        return self._product_response(product, accessories)

    async def add_accessory(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
        payload: ProductAccessoryCreate,
    ) -> ProductAccessoryResponse:
        self._require(current_user, "masterdata:product:edit")
        product = await self._repository.get_product(product_id)
        if product is None:
            raise ProductNotFoundError
        async with UnitOfWork(self._repository.session):
            row = await self._repository.add_accessory(
                product_id=product_id,
                accessory_name=payload.accessory_name,
                unit_consumption=payload.unit_consumption,
                unit=payload.unit,
                default_supplier_name=payload.default_supplier_name,
                purchase_split_rule=payload.purchase_split_rule,
            )
        return self._accessory_response(row)

    async def update_accessory(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
        accessory_id: str,
        payload: ProductAccessoryUpdate,
    ) -> ProductAccessoryResponse:
        self._require(current_user, "masterdata:product:edit")
        product = await self._repository.get_product(product_id)
        if product is None:
            raise ProductNotFoundError
        async with UnitOfWork(self._repository.session):
            row = await self._repository.update_accessory(
                product_id=product_id,
                accessory_id=accessory_id,
                accessory_name=payload.accessory_name,
                unit_consumption=payload.unit_consumption,
                unit=payload.unit,
                default_supplier_name=payload.default_supplier_name,
                purchase_split_rule=payload.purchase_split_rule,
            )
            if row is None:
                raise ProductAccessoryNotFoundError
        return self._accessory_response(row)

    async def delete_accessory(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
        accessory_id: str,
    ) -> ProductAccessoryResponse:
        self._require(current_user, "masterdata:product:edit")
        product = await self._repository.get_product(product_id)
        if product is None:
            raise ProductNotFoundError
        async with UnitOfWork(self._repository.session):
            row = await self._repository.delete_accessory(
                product_id=product_id,
                accessory_id=accessory_id,
            )
            if row is None:
                raise ProductAccessoryNotFoundError
        return self._accessory_response(row)

    async def get_product(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
    ) -> ProductResponse:
        self._require(current_user, "masterdata:product:view")
        product = await self._repository.get_product(product_id)
        if product is None:
            raise ProductNotFoundError
        accessories = await self._repository.list_accessories(product_id)
        return self._product_response(product, accessories)

    async def list_products(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
    ) -> ProductListResponse:
        self._require(current_user, "masterdata:product:view")
        products, total = await self._repository.list_products(q=q)
        items = [
            self._product_response(product, await self._repository.list_accessories(product.id))
            for product in products
        ]
        return ProductListResponse(items=items, total=total)

    async def export_products(
        self,
        *,
        current_user: CurrentUserResponse,
    ) -> ProductExportResponse:
        self._require(current_user, "masterdata:product:export")
        products, _ = await self._repository.list_products(limit=10_000)
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ["code", "cn_name", "en_name", "customs_code", "tax_rate", "rebate_rate", "unit"]
        )
        for product in products:
            writer.writerow(
                [
                    product.code,
                    product.cn_name,
                    product.en_name,
                    product.customs_code,
                    product.tax_rate,
                    product.rebate_rate,
                    product.unit,
                ]
            )
        return ProductExportResponse(
            filename="products.csv",
            content_type="text/csv",
            content=output.getvalue(),
        )

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _product_response(
        self,
        product: ProductRow,
        accessories: list[ProductAccessoryRow],
    ) -> ProductResponse:
        return ProductResponse(
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
            accessories=[self._accessory_response(item) for item in accessories],
        )

    def _accessory_response(self, accessory: ProductAccessoryRow) -> ProductAccessoryResponse:
        return ProductAccessoryResponse(
            id=accessory.id,
            product_id=accessory.product_id,
            accessory_name=accessory.accessory_name,
            unit_consumption=accessory.unit_consumption,
            unit=accessory.unit,
            default_supplier_name=accessory.default_supplier_name,
            purchase_split_rule=accessory.purchase_split_rule,
        )
