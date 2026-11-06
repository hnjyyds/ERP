from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.warehouse.inventory.repositories import InventoryRepository
from app.modules.warehouse.inventory.services import InventoryService


def get_inventory_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InventoryService:
    return InventoryService(InventoryRepository(session))
