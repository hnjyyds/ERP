import asyncio
import base64

from app.modules.masterdata.customers.repositories import CustomerRepository
from app.modules.masterdata.products.repositories import ProductRepository
from app.modules.masterdata.suppliers.repositories import SupplierRepository
from app.modules.purchase.contracts.repositories import (
    PurchaseContractLineRow,
    PurchaseContractRepository,
    PurchaseContractRow,
)
from app.modules.sales.contracts.repositories import ExportContractRepository
from app.modules.sample.requests.repositories import SampleRequestRepository
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.company.repositories import CompanyInfoRow, CompanyRepository
from app.modules.system.printing.renderer import (
    ContractPrintData,
    PrintContact,
    PrintLine,
    SampleRequestPrintData,
    SampleRequestPrintLine,
    render_contract,
    render_sample_request,
)
from app.modules.system.printing.schemas import DocumentFileResponse, DocumentPrintResponse
from app.modules.system.printing.xls_templates import (
    PURCHASE_CONTRACT_CONTENT_TYPE,
    PURCHASE_CONTRACT_MAX_TEMPLATE_LINES,
    PurchaseContractTemplateCompany,
    PurchaseContractTemplateData,
    PurchaseContractTemplateLine,
    purchase_contract_template_filename,
    render_purchase_contract_template,
)


class PermissionDeniedError(Exception):
    pass


class DocumentNotFoundError(Exception):
    pass


class PrintingService:
    def __init__(
        self,
        *,
        contract_repository: ExportContractRepository,
        customer_repository: CustomerRepository,
        sample_request_repository: SampleRequestRepository,
        purchase_contract_repository: PurchaseContractRepository,
        product_repository: ProductRepository,
        supplier_repository: SupplierRepository,
        company_repository: CompanyRepository,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._contracts = contract_repository
        self._customers = customer_repository
        self._sample_requests = sample_request_repository
        self._purchase_contracts = purchase_contract_repository
        self._products = product_repository
        self._suppliers = supplier_repository
        self._company = company_repository
        self._data_scope_resolver = data_scope_resolver

    async def print_export_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> DocumentPrintResponse:
        self._require(current_user, "sales:contract:view")
        contract = await self._contracts.get_contract(contract_id)
        if contract is None:
            raise DocumentNotFoundError
        lines = await self._contracts.list_lines(contract_id)
        primary_contact = await self._resolve_primary_contact(contract.customer_id)

        data = ContractPrintData(
            code=contract.code,
            contract_date=contract.contract_date.isoformat(),
            customer_name=contract.customer_name,
            currency=contract.currency,
            trade_term=contract.trade_term,
            planned_ship_date=contract.planned_ship_date.isoformat(),
            payment_terms=contract.payment_terms,
            total_quantity=str(contract.total_quantity),
            total_amount=str(contract.total_amount),
            primary_contact=primary_contact,
            lines=[
                PrintLine(
                    product_code=line.product_code or "",
                    product_name=line.product_name,
                    specification=line.specification or "",
                    quantity=str(line.quantity),
                    unit=line.unit,
                    unit_price=str(line.unit_price),
                    amount=str(line.amount),
                )
                for line in lines
            ],
        )
        html = render_contract(data)
        return DocumentPrintResponse(
            document_type="export_contract",
            document_code=contract.code,
            content_type="text/html",
            html=html,
        )

    async def print_sample_request(
        self,
        *,
        current_user: CurrentUserResponse,
        request_id: str,
    ) -> DocumentPrintResponse:
        self._require(current_user, "sample:request:view")
        sample_request = await self._sample_requests.get_request(request_id)
        if sample_request is None:
            raise DocumentNotFoundError
        lines = await self._sample_requests.list_lines(request_id)
        data = SampleRequestPrintData(
            code=sample_request.code,
            request_date=sample_request.request_date.isoformat(),
            customer_name=sample_request.customer_name,
            product_name=sample_request.product_name or "",
            supplier_name=sample_request.supplier_name or "",
            destination=self._sample_destination_label(sample_request.destination),
            due_date=sample_request.due_date.isoformat() if sample_request.due_date else "",
            requirements=sample_request.requirements,
            sales_user_name=sample_request.sales_user_name or "",
            lines=[
                SampleRequestPrintLine(
                    product_code=line.product_code or "",
                    product_name=line.product_name,
                    specification=line.specification or "",
                    quantity=str(line.quantity),
                    unit=line.unit,
                    requirement=line.requirement or "",
                )
                for line in lines
            ],
        )
        return DocumentPrintResponse(
            document_type="sample_request",
            document_code=sample_request.code,
            content_type="text/html",
            html=render_sample_request(data),
        )

    async def generate_purchase_contract_template(
        self,
        *,
        current_user: CurrentUserResponse,
        contract_id: str,
    ) -> DocumentFileResponse:
        self._require(current_user, "purchase:contract:view")
        contract = await self._purchase_contracts.get_contract(contract_id)
        if contract is None:
            raise DocumentNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and contract.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        lines = await self._purchase_contracts.list_lines(contract_id)
        company = await self._company.get_company_info()
        supplier = await self._purchase_template_supplier(contract)
        data = PurchaseContractTemplateData(
            code=contract.code,
            contract_date=contract.contract_date,
            supplier_name=contract.supplier_name,
            supplier_phone=supplier["phone"],
            supplier_address=supplier["address"],
            supplier_email=supplier["email"],
            buyer_user_name=contract.buyer_user_name or current_user.display_name,
            currency=contract.currency,
            delivery_date=contract.delivery_date,
            payment_terms=contract.payment_terms,
            remarks=contract.remarks or "",
            total_quantity=contract.total_quantity,
            total_amount=contract.total_amount,
            company=self._purchase_template_company(company),
            lines=[
                await self._purchase_template_line(line)
                for line in lines[:PURCHASE_CONTRACT_MAX_TEMPLATE_LINES]
            ],
        )
        content = await asyncio.to_thread(render_purchase_contract_template, data)
        return DocumentFileResponse(
            document_type="purchase_contract_template",
            document_code=contract.code,
            filename=purchase_contract_template_filename(contract.code),
            content_type=PURCHASE_CONTRACT_CONTENT_TYPE,
            content_base64=base64.b64encode(content).decode("ascii"),
        )

    async def _resolve_primary_contact(self, customer_id: str | None) -> PrintContact | None:
        if not customer_id:
            return None
        contacts = await self._customers.list_contacts(customer_id)
        primary = next((contact for contact in contacts if contact.is_primary), None)
        if primary is None and contacts:
            primary = contacts[0]
        if primary is None:
            return None
        return PrintContact(
            name=primary.name,
            title=primary.title,
            email=primary.email,
            phone=primary.phone,
        )

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _sample_destination_label(self, value: str) -> str:
        return {"in_house": "内部打样", "factory": "外发工厂"}.get(value, value)

    def _purchase_template_company(
        self,
        company: CompanyInfoRow | None,
    ) -> PurchaseContractTemplateCompany:
        if company is None:
            return PurchaseContractTemplateCompany(name="", address="", phone="", email="")
        return PurchaseContractTemplateCompany(
            name=company.name,
            address=company.address or company.address_en or "",
            phone=company.phone or "",
            email=company.email or "",
        )

    async def _purchase_template_supplier(
        self,
        contract: PurchaseContractRow,
    ) -> dict[str, str]:
        if contract.supplier_id is None:
            return {"phone": "", "address": "", "email": ""}
        supplier = await self._suppliers.get_supplier(contract.supplier_id)
        if supplier is None:
            return {"phone": "", "address": "", "email": ""}
        contacts = await self._suppliers.list_contacts(supplier.id)
        primary_contact = next((contact for contact in contacts if contact.is_primary), None)
        if primary_contact is None and contacts:
            primary_contact = contacts[0]
        return {
            "phone": primary_contact.phone if primary_contact and primary_contact.phone else "",
            "address": supplier.address or "",
            "email": primary_contact.email if primary_contact and primary_contact.email else "",
        }

    async def _purchase_template_line(
        self,
        line: PurchaseContractLineRow,
    ) -> PurchaseContractTemplateLine:
        remark = line.remark or ""
        image_url = ""
        if line.product_id:
            product = await self._products.get_product(line.product_id)
            if product is not None:
                image_url = product.image_url or ""
                if product.package_info and "包装" not in remark:
                    package_note = f"包装: {product.package_info}"
                    remark = f"{remark}; {package_note}" if remark else package_note
        return PurchaseContractTemplateLine(
            product_code=line.product_code or "",
            product_name=line.product_name,
            specification=line.specification or "",
            model=line.model or "",
            image_url=image_url,
            quantity=self._template_quantity(line.quantity),
            unit_price=self._template_quantity(line.unit_price),
            amount=line.amount,
            remark=remark,
        )

    def _template_quantity(self, value: object) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
