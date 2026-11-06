from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import resolve_limit, resolve_offset
from app.modules.warehouse.inventory.models import InventoryBalance, InventoryLedger


@dataclass(frozen=True)
class InventoryBalanceRow:
    id: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    product_id: str | None
    product_code: str | None
    product_name: str
    available_quantity: str
    locked_quantity: str
    pending_inspection_quantity: str
    unit: str
    created_at: datetime


@dataclass(frozen=True)
class InventoryLedgerRow:
    id: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    product_id: str | None
    product_code: str | None
    product_name: str
    direction: str
    quantity: str
    unit: str
    stock_status: str
    source_type: str
    source_id: str
    source_code: str
    occurred_at: date
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ProductLedgerEntryRow:
    source_code: str
    occurred_at: date
    direction: str
    quantity: Decimal
    unit: str
    warehouse_name: str
    location_name: str


class InventoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

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
        balance = await self._get_balance(
            warehouse_id=warehouse_id,
            location_id=location_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            unit=unit,
        )
        if balance is None:
            balance = InventoryBalance(
                warehouse_id=warehouse_id,
                warehouse_name=warehouse_name,
                location_id=location_id,
                location_name=location_name,
                product_id=product_id,
                product_code=product_code,
                product_name=product_name,
                available_quantity=Decimal("0"),
                locked_quantity=Decimal("0"),
                pending_inspection_quantity=Decimal("0"),
                unit=unit,
            )
            self.session.add(balance)
        balance.warehouse_name = warehouse_name
        balance.location_name = location_name
        balance.product_name = product_name
        balance.available_quantity += Decimal(str(available_delta))
        balance.pending_inspection_quantity += Decimal(str(pending_delta))
        await self.session.flush()
        return self._map_balance(balance)

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
        balance = await self._get_balance(
            warehouse_id=warehouse_id,
            location_id=location_id,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            unit=unit,
        )
        quantity_decimal = Decimal(str(quantity))
        if balance is None:
            if not allow_negative:
                return None
            balance = InventoryBalance(
                warehouse_id=warehouse_id,
                warehouse_name=warehouse_name,
                location_id=location_id,
                location_name=location_name,
                product_id=product_id,
                product_code=product_code,
                product_name=product_name,
                available_quantity=Decimal("0"),
                locked_quantity=Decimal("0"),
                pending_inspection_quantity=Decimal("0"),
                unit=unit,
            )
            self.session.add(balance)
        if balance.available_quantity < quantity_decimal and not allow_negative:
            return None
        balance.warehouse_name = warehouse_name
        balance.location_name = location_name
        balance.product_name = product_name
        balance.available_quantity -= quantity_decimal
        await self.session.flush()
        return self._map_balance(balance)

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
        ledger = InventoryLedger(
            warehouse_id=warehouse_id,
            warehouse_name=warehouse_name,
            location_id=location_id,
            location_name=location_name,
            product_id=product_id,
            product_code=product_code,
            product_name=product_name,
            direction=direction,
            quantity=Decimal(str(quantity)),
            unit=unit,
            stock_status=stock_status,
            source_type=source_type,
            source_id=source_id,
            source_code=source_code,
            occurred_at=occurred_at,
            remark=remark,
        )
        self.session.add(ledger)
        await self.session.flush()
        return self._map_ledger(ledger)

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
        statement = select(InventoryBalance)
        count_statement = select(func.count()).select_from(InventoryBalance)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    InventoryBalance.warehouse_name.ilike(pattern),
                    InventoryBalance.location_name.ilike(pattern),
                    InventoryBalance.product_code.ilike(pattern),
                    InventoryBalance.product_name.ilike(pattern),
                )
            )
        if warehouse_id:
            conditions.append(InventoryBalance.warehouse_id == warehouse_id)
        if location_id:
            conditions.append(InventoryBalance.location_id == location_id)
        if product_id:
            conditions.append(InventoryBalance.product_id == product_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                InventoryBalance.warehouse_name.asc(),
                InventoryBalance.location_name.asc(),
                InventoryBalance.product_name.asc(),
            )
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = await self._balance_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_balance(row) for row in rows], int(total or 0)

    async def list_ledgers(
        self,
        *,
        q: str | None = None,
        source_id: str | None = None,
        product_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[InventoryLedgerRow], int]:
        statement = select(InventoryLedger)
        count_statement = select(func.count()).select_from(InventoryLedger)
        conditions = []
        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    InventoryLedger.source_code.ilike(pattern),
                    InventoryLedger.product_code.ilike(pattern),
                    InventoryLedger.product_name.ilike(pattern),
                    InventoryLedger.warehouse_name.ilike(pattern),
                )
            )
        if source_id:
            conditions.append(InventoryLedger.source_id == source_id)
        if product_id:
            conditions.append(InventoryLedger.product_id == product_id)
        for condition in conditions:
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        statement = (
            statement.order_by(
                InventoryLedger.occurred_at.desc(),
                InventoryLedger.created_at.desc(),
            )
            .limit(resolve_limit(limit))
            .offset(resolve_offset(offset))
        )
        rows = await self._ledger_scalars(statement)
        total = await self.session.scalar(count_statement)
        return [self._map_ledger(row) for row in rows], int(total or 0)

    async def list_product_ledger_entries(
        self,
        *,
        product_id: str,
        limit: int = 100,
    ) -> list[ProductLedgerEntryRow]:
        rows = await self.session.execute(
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
            .limit(resolve_limit(limit))
        )
        return [
            ProductLedgerEntryRow(
                source_code=source_code,
                occurred_at=occurred_at,
                direction=direction,
                quantity=Decimal(str(quantity or 0)),
                unit=unit,
                warehouse_name=warehouse_name,
                location_name=location_name,
            )
            for (
                source_code,
                occurred_at,
                direction,
                quantity,
                unit,
                warehouse_name,
                location_name,
            ) in rows.all()
        ]

    async def _get_balance(
        self,
        *,
        warehouse_id: str,
        location_id: str,
        product_id: str | None,
        product_code: str | None,
        product_name: str,
        unit: str,
    ) -> InventoryBalance | None:
        statement = (
            select(InventoryBalance)
            .where(InventoryBalance.warehouse_id == warehouse_id)
            .where(InventoryBalance.location_id == location_id)
            .where(InventoryBalance.product_code == product_code)
            .where(InventoryBalance.product_name == product_name)
            .where(InventoryBalance.unit == unit)
        )
        if product_id is None:
            statement = statement.where(InventoryBalance.product_id.is_(None))
        else:
            statement = statement.where(InventoryBalance.product_id == product_id)
        return await self.session.scalar(statement)

    async def _balance_scalars(
        self,
        statement: Select[tuple[InventoryBalance]],
    ) -> list[InventoryBalance]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    async def _ledger_scalars(
        self,
        statement: Select[tuple[InventoryLedger]],
    ) -> list[InventoryLedger]:
        result = await self.session.scalars(statement)
        return list(result.unique())

    def _map_balance(self, balance: InventoryBalance) -> InventoryBalanceRow:
        return InventoryBalanceRow(
            id=balance.id,
            warehouse_id=balance.warehouse_id,
            warehouse_name=balance.warehouse_name,
            location_id=balance.location_id,
            location_name=balance.location_name,
            product_id=balance.product_id,
            product_code=balance.product_code,
            product_name=balance.product_name,
            available_quantity=self._quantity(balance.available_quantity),
            locked_quantity=self._quantity(balance.locked_quantity),
            pending_inspection_quantity=self._quantity(balance.pending_inspection_quantity),
            unit=balance.unit,
            created_at=balance.created_at,
        )

    def _map_ledger(self, ledger: InventoryLedger) -> InventoryLedgerRow:
        return InventoryLedgerRow(
            id=ledger.id,
            warehouse_id=ledger.warehouse_id,
            warehouse_name=ledger.warehouse_name,
            location_id=ledger.location_id,
            location_name=ledger.location_name,
            product_id=ledger.product_id,
            product_code=ledger.product_code,
            product_name=ledger.product_name,
            direction=ledger.direction,
            quantity=self._quantity(ledger.quantity),
            unit=ledger.unit,
            stock_status=ledger.stock_status,
            source_type=ledger.source_type,
            source_id=ledger.source_id,
            source_code=ledger.source_code,
            occurred_at=ledger.occurred_at,
            remark=ledger.remark,
            created_at=ledger.created_at,
        )

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
