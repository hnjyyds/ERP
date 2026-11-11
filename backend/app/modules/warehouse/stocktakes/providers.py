from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.system.auth.assignees import AssigneeValidator
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.warehouse.inventory.repositories import InventoryRepository
from app.modules.warehouse.inventory.services import InventoryService
from app.modules.warehouse.stocktakes.repositories import StocktakeRepository
from app.modules.warehouse.stocktakes.services import StocktakeService


def get_stocktake_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> StocktakeService:
    auth_repository = AuthRepository(session)
    return StocktakeService(
        stocktake_repository=StocktakeRepository(session),
        inventory_service=InventoryService(InventoryRepository(session)),
        data_scope_resolver=DataScopeResolver(auth_repository),
        assignee_validator=AssigneeValidator(auth_repository),
    )
