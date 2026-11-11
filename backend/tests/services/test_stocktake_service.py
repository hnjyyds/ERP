from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.system.auth.assignees import AssigneeValidator
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.seed import seed_system_demo_data
from app.modules.warehouse.inventory.repositories import InventoryRepository
from app.modules.warehouse.inventory.services import InventoryService
from app.modules.warehouse.stocktakes.repositories import StocktakeRepository
from app.modules.warehouse.stocktakes.schemas import (
    StocktakeApprove,
    StocktakeCreate,
    StocktakeLineCreate,
    StocktakeSubmit,
)
from app.modules.warehouse.stocktakes.services import PermissionDeniedError, StocktakeService


def _make_service(session: AsyncSession) -> StocktakeService:
    auth_repository = AuthRepository(session)
    return StocktakeService(
        stocktake_repository=StocktakeRepository(session),
        inventory_service=InventoryService(InventoryRepository(session)),
        data_scope_resolver=DataScopeResolver(auth_repository),
        assignee_validator=AssigneeValidator(auth_repository),
    )


def _user(
    permissions: list[str],
    *,
    user_id: str,
    display_name: str,
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user_id,
        username=user_id,
        display_name=display_name,
        department_name="仓库部",
        data_scope="all",
        roles=["仓库专员"],
        permissions=permissions,
    )


def _warehouse_user() -> CurrentUserResponse:
    return _user(
        [
            "warehouse:stocktake:view",
            "warehouse:stocktake:edit",
            "warehouse:stocktake:view_all",
        ],
        user_id="u-warehouse",
        display_name="演示仓库专员",
    )


def _manager_user() -> CurrentUserResponse:
    return _user(
        [
            "warehouse:stocktake:view",
            "warehouse:stocktake:approve",
            "warehouse:stocktake:view_all",
        ],
        user_id="u-001",
        display_name="演示业务主管",
    )


def _payload(actual_quantity: str) -> StocktakeCreate:
    return StocktakeCreate(
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-a-01",
        location_name="A-01",
        count_date=date(2026, 11, 11),
        operator_name="演示仓库专员",
        remark=None,
        lines=[
            StocktakeLineCreate(
                product_id="product-bag",
                product_code="BAG-40",
                product_name="Eco Shopping Bag",
                unit="pcs",
                actual_quantity=actual_quantity,
                remark=None,
            )
        ],
    )


async def _seed_balance(session: AsyncSession, quantity: str) -> None:
    await InventoryRepository(session).increase_balance(
        warehouse_id="wh-ningbo",
        warehouse_name="宁波总仓",
        location_id="loc-a-01",
        location_name="A-01",
        product_id="product-bag",
        product_code="BAG-40",
        product_name="Eco Shopping Bag",
        available_delta=quantity,
        pending_delta="0",
        unit="pcs",
    )
    await session.commit()


async def test_stocktake_create_snapshots_book_quantity(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        await _seed_balance(session, "100")
        service = _make_service(session)

        stocktake = await service.create_stocktake(
            current_user=_warehouse_user(),
            payload=_payload("90"),
        )

    assert stocktake.code.startswith("ST-")
    assert stocktake.status == "draft"
    assert len(stocktake.lines) == 1
    assert stocktake.lines[0].book_quantity == "100"
    assert stocktake.lines[0].actual_quantity == "90"
    assert stocktake.lines[0].difference_quantity == "-10"


async def test_stocktake_approve_applies_difference_and_writes_ledger(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        await _seed_balance(session, "100")
        service = _make_service(session)
        created = await service.create_stocktake(
            current_user=_warehouse_user(),
            payload=_payload("120"),
        )
        await service.submit_stocktake(
            current_user=_warehouse_user(),
            order_id=created.id,
            payload=StocktakeSubmit(reviewer_id="u-001"),
        )

        approved = await service.approve_stocktake(
            current_user=_manager_user(),
            order_id=created.id,
            payload=StocktakeApprove(approved_at=date(2026, 11, 11)),
        )
        balances, _ = await InventoryRepository(session).list_balances(q="BAG-40")
        ledgers, _ = await InventoryRepository(session).list_ledgers(source_id=approved.id)
        second_attempt = await StocktakeRepository(session).approve_order(
            approved.id,
            reviewer_id="u-001",
            reviewer_name="演示业务主管",
            approved_at=date(2026, 11, 11),
        )

    assert approved.status == "approved"
    assert balances[0].available_quantity == "120"
    assert len(ledgers) == 1
    assert ledgers[0].direction == "in"
    assert ledgers[0].quantity == "20"
    assert ledgers[0].source_type == "stocktake"
    assert ledgers[0].remark == "盘点调整"
    # 状态条件更新：同一张单只能完成一次库存调整。
    assert second_attempt is None


async def test_stocktake_approve_rejects_insufficient_available_stock(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        await _seed_balance(session, "10")
        service = _make_service(session)
        created = await service.create_stocktake(
            current_user=_warehouse_user(),
            payload=_payload("0"),
        )
        await service.submit_stocktake(
            current_user=_warehouse_user(),
            order_id=created.id,
            payload=StocktakeSubmit(reviewer_id="u-001"),
        )
        # 创建后可用库存被其它单据占用，审批时不允许造成负库存。
        await InventoryService(InventoryRepository(session)).decrease_available_balance(
            warehouse_id="wh-ningbo",
            warehouse_name="宁波总仓",
            location_id="loc-a-01",
            location_name="A-01",
            product_id="product-bag",
            product_code="BAG-40",
            product_name="Eco Shopping Bag",
            quantity="10",
            unit="pcs",
            allow_negative=False,
        )
        await session.commit()

        with pytest.raises(ValueError, match="可用库存不足"):
            await service.approve_stocktake(
                current_user=_manager_user(),
                order_id=created.id,
                payload=StocktakeApprove(approved_at=date(2026, 11, 11)),
            )
        assert (await StocktakeRepository(session).get_order(created.id)).status == "submitted"


async def test_stocktake_requires_approval_permission(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        await seed_system_demo_data(session)
        service = _make_service(session)
        with pytest.raises(PermissionDeniedError):
            await service.create_stocktake(
                current_user=_user(
                    ["warehouse:stocktake:view"],
                    user_id="u-warehouse",
                    display_name="演示仓库专员",
                ),
                payload=_payload("1"),
            )
