from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.masterdata.products.services import ProductService


async def get_product_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ProductService:
    return ProductService(ProductRepository(session))
