from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.masterdata.products.services import ProductService
from app.modules.warehouse.inventory.repositories import InventoryRepository
from app.modules.warehouse.inventory.services import InventoryService


async def get_product_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ProductService:
    return ProductService(
        ProductRepository(session),
        InventoryService(InventoryRepository(session)),
    )
