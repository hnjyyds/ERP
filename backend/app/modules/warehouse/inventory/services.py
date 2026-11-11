"""库存领域服务：其它模块统一通过这里查询库存、写入出入库流水与调整可用数量。"""

from datetime import UTC, date, datetime
from decimal import Decimal

from app.modules.warehouse.inventory.repositories import (
    InventoryBalanceRow,
    InventoryLedgerRow,
    InventoryRepository,
    PendingInspectionRow,
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

    async def register_pending_inspection(
        self,
        *,
        inbound_order_id: str,
        inbound_order_code: str,
        inbound_order_line_id: str,
        purchase_contract_id: str,
        purchase_contract_line_id: str | None,
        warehouse_id: str,
        warehouse_name: str,
        location_id: str,
        location_name: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        quantity: Decimal | str,
        unit: str,
    ) -> PendingInspectionRow:
        return await self._repository.add_pending_inspection(
            inbound_order_id=inbound_order_id,
            inbound_order_code=inbound_order_code,
            inbound_order_line_id=inbound_order_line_id,
            purchase_contract_id=purchase_contract_id,
            purchase_contract_line_id=purchase_contract_line_id,
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            quantity=quantity,
            unit=unit,
        )

    async def resolve_pending_inspections_for_contract(
        self,
        *,
        purchase_contract_id: str,
        passed: bool,
        inspection_id: str,
        inspection_code: str,
        occurred_at: date,
    ) -> int:
        """按入库单行逐笔判定待检量：通过转可用，不通过扣减并写退回流出。"""
        pending_rows = await self._repository.list_open_pending_inspections(purchase_contract_id)
        resolved_at = datetime.now(UTC)
        resolved_count = 0
        for row in pending_rows:
            marked = await self._repository.mark_pending_inspection_resolved(
                pending_id=row.id,
                status="passed" if passed else "rejected",
                inspection_id=inspection_id,
                inspection_code=inspection_code,
                resolved_at=resolved_at,
            )
            if not marked:
                continue
            quantity = Decimal(row.quantity)
            available_delta = quantity if passed else Decimal("0")
            await self.increase_balance(
                warehouse_id=row.warehouse_id,
                warehouse_name=row.warehouse_name,
                location_id=row.location_id,
                location_name=row.location_name,
                product_id=row.product_id,
                product_code=row.product_code,
                product_name=row.product_name,
                available_delta=available_delta,
                pending_delta=-quantity,
                unit=row.unit,
            )
            if not passed:
                await self.add_ledger(
                    warehouse_id=row.warehouse_id,
                    warehouse_name=row.warehouse_name,
                    location_id=row.location_id,
                    location_name=row.location_name,
                    product_id=row.product_id,
                    product_code=row.product_code,
                    product_name=row.product_name,
                    direction="out",
                    quantity=quantity,
                    unit=row.unit,
                    stock_status="rejected",
                    source_type="quality_inspection",
                    source_id=inspection_id,
                    source_code=inspection_code,
                    occurred_at=occurred_at,
                    remark=f"{inspection_code} QC 不合格退回",
                )
            resolved_count += 1
        return resolved_count
