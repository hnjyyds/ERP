"""库存领域服务：其它模块统一通过这里查询库存、写入出入库流水与调整可用数量。"""

from datetime import date
from decimal import Decimal

from app.modules.warehouse.inventory.repositories import (
    InventoryBalanceRow,
    InventoryLedgerRow,
    InventoryRepository,
    ProductLedgerEntryRow,
)


class InventoryService:
    def __init__(self, repository: InventoryRepository) -> None:
        self._repository = repository

    async def list_balances(
        self,
        *,
        q: str | None = None,
        warehouse_id: str | None = None,
        location_id: str | None = None,
        product_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[InventoryBalanceRow], int]:
        return await self._repository.list_balances(
            q=q,
            warehouse_id=warehouse_id,
            location_id=location_id,
            product_id=product_id,
            limit=limit,
            offset=offset,
        )

    async def summarize_balances(
        self,
        *,
        q: str | None = None,
        warehouse_id: str | None = None,
        location_id: str | None = None,
        product_id: str | None = None,
    ) -> tuple[Decimal, Decimal]:
        return await self._repository.sum_balances(
            q=q,
            warehouse_id=warehouse_id,
            location_id=location_id,
            product_id=product_id,
        )

    async def list_ledgers(
        self,
        *,
        q: str | None = None,
        source_id: str | None = None,
        product_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[InventoryLedgerRow], int]:
        return await self._repository.list_ledgers(
            q=q,
            source_id=source_id,
            product_id=product_id,
            limit=limit,
            offset=offset,
        )

    async def list_product_ledger_entries(
        self,
        *,
        product_id: str,
        limit: int = 100,
    ) -> list[ProductLedgerEntryRow]:
        return await self._repository.list_product_ledger_entries(
            product_id=product_id,
            limit=limit,
        )

    async def increase_balance(
        self,
        *,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        available_delta: Decimal | str,
        pending_delta: Decimal | str,
        unit: str,
    ) -> InventoryBalanceRow:
        return await self._repository.increase_balance(
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            available_delta=available_delta,
            pending_delta=pending_delta,
            unit=unit,
        )

    async def decrease_available_balance(
        self,
        *,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        quantity: Decimal | str,
        unit: str,
        allow_negative: bool,
    ) -> InventoryBalanceRow | None:
        return await self._repository.decrease_available_balance(
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            quantity=quantity,
            unit=unit,
            allow_negative=allow_negative,
        )

    async def add_ledger(
        self,
        *,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        direction: str,
        quantity: Decimal | str,
        unit: str,
        stock_status: str,
        source_type: str,
        source_id: str,
        source_code: str,
        occurred_at: date,
        remark: str | None,
    ) -> InventoryLedgerRow:
        return await self._repository.add_ledger(
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            direction=direction,
            quantity=quantity,
            unit=unit,
            stock_status=stock_status,
            source_type=source_type,
            source_id=source_id,
            source_code=source_code,
            occurred_at=occurred_at,
            remark=remark,
        )
