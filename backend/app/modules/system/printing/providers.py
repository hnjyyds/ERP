from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.masterdata.customers.repositories import CustomerRepository
from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.masterdata.suppliers.repositories import SupplierRepository
from app.modules.purchase.contracts.repositories import PurchaseContractRepository
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sample.requests.repositories import SampleRequestRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.repositories import AuthRepository
from app.modules.system.company.repositories import CompanyRepository
from app.modules.system.printing.services import PrintingService


async def get_printing_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PrintingService:
    return PrintingService(
        contract_repository=ExportContractRepository(session),
        customer_repository=CustomerRepository(session),
        sample_request_repository=SampleRequestRepository(session),
        purchase_contract_repository=PurchaseContractRepository(session),
        product_repository=ProductRepository(session),
        supplier_repository=SupplierRepository(session),
        company_repository=CompanyRepository(session),
        data_scope_resolver=DataScopeResolver(AuthRepository(session)),
    )
