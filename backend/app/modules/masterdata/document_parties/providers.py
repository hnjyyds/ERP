from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.document_parties.repositories import DocumentPartyRepository
from app.modules.masterdata.document_parties.services import DocumentPartyService
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


async def get_document_party_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DocumentPartyService:
    return DocumentPartyService(
        DocumentPartyRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
