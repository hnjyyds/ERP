from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.customers.repositories import CustomerRepository
from app.modules.masterdata.customers.services import CustomerService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


async def get_customer_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CustomerService:
    return CustomerService(
        CustomerRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
