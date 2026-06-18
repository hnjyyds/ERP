import base64
import binascii
import csv
from decimal import Decimal, InvalidOperation
from io import StringIO

from app.db.uow import UnitOfWork
from app.modules.masterdata.products.imports import ImportFileError, parse_import_file
from app.modules.masterdata.products.repositories import (
    ProductAccessoryRow,
    ProductCustomerRow,
    ProductRepository,
    ProductRow,
    ProductTransactionRow,
)
from app.modules.masterdata.products.schemas import (
    ProductAccessoryCreate,
    ProductAccessoryResponse,
    ProductAccessoryUpdate,
    ProductCreate,
    ProductCustomerListResponse,
    ProductCustomerResponse,
    ProductExportResponse,
    ProductImportError,
    ProductImportRequest,
    ProductImportResponse,
    ProductListResponse,
    ProductResponse,
    ProductTransactionListResponse,
    ProductTransactionResponse,
    ProductUpdate,
)
from app.modules.system.auth.schemas import CurrentUserResponse

_IMPORT_COLUMNS = (
    "code",
    "cn_name",
    "en_name",
    "specification",
    "model",
    "customs_code",
    "tax_rate",
    "rebate_rate",
    "package_info",
    "unit",
)
_MAX_IMPORT_BYTES = 5 * 1024 * 1024


class PermissionDeniedError(Exception):
    pass


class ProductNotFoundError(Exception):
    pass


class ProductAccessoryNotFoundError(Exception):
    pass


class ProductImportInvalidError(Exception):
    """整份导入文件无法处理（编码、格式、大小或解析错误）。"""


class _ImportRowError(Exception):
    """单行数据校验失败，记入失败报告并跳过。"""


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

    async def import_products(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: ProductImportRequest,
    ) -> ProductImportResponse:
        self._require(current_user, "masterdata:product:edit")
        content = self._decode_import_content(payload.content_base64)
        try:
            records = parse_import_file(filename=payload.filename, content=content)
        except ImportFileError as exc:
            raise ProductImportInvalidError(str(exc)) from exc

        created = 0
        updated = 0
        errors: list[ProductImportError] = []
        for offset, record in enumerate(records):
            line = offset + 2  # 表头占第 1 行，数据从第 2 行开始。
            code = (record.get("code") or "").strip()
            try:
                product_create = self._build_import_payload(record)
            except _ImportRowError as exc:
                errors.append(
                    ProductImportError(row=line, code=code or None, message=str(exc))
                )
                continue
            async with UnitOfWork(self._repository.session):
                existing = await self._repository.get_product_by_code(product_create.code)
                if existing is None:
                    await self._repository.create_product(
                        code=product_create.code,
                        cn_name=product_create.cn_name,
                        en_name=product_create.en_name,
                        specification=product_create.specification,
                        model=product_create.model,
                        customs_code=product_create.customs_code,
                        tax_rate=product_create.tax_rate,
                        rebate_rate=product_create.rebate_rate,
                        package_info=product_create.package_info,
                        unit=product_create.unit,
                        image_url=None,
                        status="active",
                    )
                    created += 1
                else:
                    await self._repository.update_product(
                        product_id=existing.id,
                        code=product_create.code,
                        cn_name=product_create.cn_name,
                        en_name=product_create.en_name,
                        specification=product_create.specification,
                        model=product_create.model,
                        customs_code=product_create.customs_code,
                        tax_rate=product_create.tax_rate,
                        rebate_rate=product_create.rebate_rate,
                        package_info=product_create.package_info,
                        unit=product_create.unit,
                        image_url=existing.image_url,
                        status=existing.status,
                    )
                    updated += 1
        return ProductImportResponse(
            created=created,
            updated=updated,
            failed=len(errors),
            errors=errors,
        )

    async def list_product_customers(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
    ) -> ProductCustomerListResponse:
        self._require(current_user, "masterdata:product:view")
        product = await self._repository.get_product(product_id)
        if product is None:
            raise ProductNotFoundError
        rows = await self._repository.list_product_customers(product_id)
        items = [self._customer_response(row) for row in rows]
        return ProductCustomerListResponse(items=items, total=len(items))

    async def list_transactions(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str,
    ) -> ProductTransactionListResponse:
        self._require(current_user, "masterdata:product:view")
        product = await self._repository.get_product(product_id)
        if product is None:
            raise ProductNotFoundError
        rows = await self._repository.list_transactions(product_id=product_id)
        items = [self._transaction_response(row) for row in rows]
        return ProductTransactionListResponse(items=items, total=len(items))

    def _decode_import_content(self, content_base64: str) -> bytes:
        raw = content_base64
        if "," in raw and raw.lstrip().startswith("data:"):
            raw = raw.split(",", 1)[1]
        try:
            content = base64.b64decode(raw, validate=False)
        except (binascii.Error, ValueError) as exc:
            raise ProductImportInvalidError("文件内容不是有效的 base64 编码") from exc
        if not content:
            raise ProductImportInvalidError("导入文件为空")
        if len(content) > _MAX_IMPORT_BYTES:
            raise ProductImportInvalidError("导入文件超过 5MB 限制")
        return content

    def _build_import_payload(self, record: dict[str, str]) -> ProductCreate:
        missing = [
            column
            for column in ("code", "cn_name", "en_name", "customs_code", "unit", "package_info")
            if not (record.get(column) or "").strip()
        ]
        if missing:
            raise _ImportRowError(f"缺少必填字段：{'、'.join(missing)}")
        tax_rate = self._parse_rate(record.get("tax_rate"), "tax_rate")
        rebate_rate = self._parse_rate(record.get("rebate_rate"), "rebate_rate")
        try:
            return ProductCreate(
                code=(record.get("code") or "").strip(),
                cn_name=(record.get("cn_name") or "").strip(),
                en_name=(record.get("en_name") or "").strip(),
                specification=(record.get("specification") or "").strip() or None,
                model=(record.get("model") or "").strip() or None,
                customs_code=(record.get("customs_code") or "").strip(),
                tax_rate=tax_rate,
                rebate_rate=rebate_rate,
                package_info=(record.get("package_info") or "").strip(),
                unit=(record.get("unit") or "").strip(),
            )
        except ValueError as exc:
            raise _ImportRowError(f"字段校验失败：{exc}") from exc

    def _parse_rate(self, value: str | None, field: str) -> Decimal:
        text = (value or "").strip()
        if not text:
            raise _ImportRowError(f"缺少必填字段：{field}")
        if text.endswith("%"):
            text = text[:-1].strip()
            divisor = Decimal("100")
        else:
            divisor = Decimal("1")
        try:
            parsed = Decimal(text) / divisor
        except (InvalidOperation, ValueError) as exc:
            raise _ImportRowError(f"{field} 不是有效数字") from exc
        if parsed < 0 or parsed > 1:
            raise _ImportRowError(f"{field} 必须在 0 到 1（或 0%-100%）之间")
        return parsed

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

    def _customer_response(self, row: ProductCustomerRow) -> ProductCustomerResponse:
        return ProductCustomerResponse(
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            contract_count=row.contract_count,
            total_quantity=row.total_quantity,
            total_amount=row.total_amount,
            last_contract_date=row.last_contract_date,
        )

    def _transaction_response(self, row: ProductTransactionRow) -> ProductTransactionResponse:
        return ProductTransactionResponse(
            source_type=row.source_type,
            source_code=row.source_code,
            occurred_at=row.occurred_at,
            counterparty_name=row.counterparty_name,
            quantity=str(row.quantity) if row.quantity is not None else None,
            unit=row.unit,
            amount=str(row.amount) if row.amount is not None else None,
            summary=row.summary,
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
