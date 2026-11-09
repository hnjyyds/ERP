from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.followup.repositories import FollowupRepository
from app.modules.followup.services import FollowupService
from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.purchase.contracts.services import PurchaseContractService
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sample.records.repositories import SampleRecordRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository


def get_purchase_contract_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PurchaseContractService:
    auth_repository = AuthRepository(session)
    purchase_contract_repository = PurchaseContractRepository(session)
    data_scope_resolver = DataScopeResolver(auth_repository)
    return PurchaseContractService(
        purchase_repository=purchase_contract_repository,
        export_contract_repository=ExportContractRepository(session),
        product_repository=ProductRepository(session),
        followup_service=FollowupService(
            followup_repository=FollowupRepository(session),
            purchase_contract_repository=purchase_contract_repository,
            sample_record_repository=SampleRecordRepository(session),
            data_scope_resolver=data_scope_resolver,
        ),
        data_scope_resolver=data_scope_resolver,
        auth_repository=auth_repository,
    )
