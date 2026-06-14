from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.customers.repositories import CustomerRepository
from app.modules.masterdata.customers.services import CustomerService


async def get_customer_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CustomerService:
    return CustomerService(CustomerRepository(session))
