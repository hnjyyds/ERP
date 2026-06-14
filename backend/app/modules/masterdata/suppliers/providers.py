from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.suppliers.repositories import SupplierRepository
from app.modules.masterdata.suppliers.services import SupplierService


async def get_supplier_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SupplierService:
    return SupplierService(SupplierRepository(session))
