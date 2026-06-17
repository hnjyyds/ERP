from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sales.contracts.services import ExportContractService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


def get_export_contract_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ExportContractService:
    return ExportContractService(
        ExportContractRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
