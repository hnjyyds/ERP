import csv
from datetime import UTC, datetime
from decimal import Decimal
from io import StringIO

from app.db.uow import UnitOfWork
from app.modules.purchase.inquiries.repositories import (
    PurchaseInquiryReferenceRow,
    PurchaseInquiryRepository,
)
from app.modules.sales.contracts.repositories import ExportContractRepository, ExportContractRow
from app.modules.sales.quotations.repositories import (
    ExportQuotationLineRow,
    ExportQuotationPurchaseReferenceRow,
    ExportQuotationRepository,
    ExportQuotationRow,
)
from app.modules.sales.quotations.schemas import (
    VALID_QUOTATION_EXPORT_FORMATS,
    VALID_QUOTATION_STATUSES,
    ExportQuotationApprove,
    ExportQuotationConfirmContract,
    ExportQuotationContractResponse,
    ExportQuotationCreate,
    ExportQuotationExportResponse,
    ExportQuotationLineResponse,
    ExportQuotationListResponse,
    ExportQuotationPurchaseReferenceListResponse,
    ExportQuotationPurchaseReferenceResponse,
    ExportQuotationResponse,
)
from app.modules.sample.deliveries.repositories import (
    SampleDeliveryFeeRow,
    SampleDeliveryLineRow,
    SampleDeliveryRepository,
    SampleDeliveryRow,
)
from app.modules.sample.deliveries.schemas import (
    SampleDeliveryFeeResponse,
    SampleDeliveryLineResponse,
    SampleDeliveryListResponse,
    SampleDeliveryResponse,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class ExportQuotationNotFoundError(Exception):
    pass


class ExportQuotationService:
    def __init__(
        self,
        repository: ExportQuotationRepository,
        sample_delivery_repository: SampleDeliveryRepository,
        export_contract_repository: ExportContractRepository | None = None,
        purchase_inquiry_repository: PurchaseInquiryRepository | None = None,
        *,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._sample_delivery_repository = sample_delivery_repository
        self._export_contract_repository = export_contract_repository
        self._purchase_inquiry_repository = purchase_inquiry_repository
        self._data_scope_resolver = data_scope_resolver

    async def create_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: ExportQuotationCreate,
    ) -> ExportQuotationResponse:
        self._require(current_user, "sales:quotation:edit")
        async with UnitOfWork(self._repository.session):
            quotation = await self._repository.create_quotation(
                code=payload.code,
                quote_date=payload.quote_date,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                sales_user_id=payload.sales_user_id,
                sales_user_name=payload.sales_user_name,
                currency=payload.currency,
                trade_term=payload.trade_term,
                valid_until=payload.valid_until,
                description=payload.description,
                approval_status="draft",
                owner_user_id=current_user.id,
            )
            total_amount = await self._replace_lines(quotation.id, payload)
            updated_quotation = await self._repository.set_total_amount(
                quotation_id=quotation.id,
                total_amount=total_amount,
            )
            if updated_quotation is None:
                raise ExportQuotationNotFoundError
        return await self._quotation_response(updated_quotation)

    async def update_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
        payload: ExportQuotationCreate,
    ) -> ExportQuotationResponse:
        self._require(current_user, "sales:quotation:edit")
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        if quotation.approval_status != "draft":
            raise ValueError("只有草稿报价可以编辑")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_quotation(
                quotation_id=quotation.id,
                code=payload.code,
                quote_date=payload.quote_date,
                customer_id=payload.customer_id,
                customer_name=payload.customer_name,
                sales_user_id=payload.sales_user_id,
                sales_user_name=payload.sales_user_name,
                currency=payload.currency,
                trade_term=payload.trade_term,
                valid_until=payload.valid_until,
                description=payload.description,
            )
            if updated is None:
                raise ExportQuotationNotFoundError
            total_amount = await self._replace_lines(quotation.id, payload)
            updated = await self._repository.set_total_amount(
                quotation_id=quotation.id,
                total_amount=total_amount,
            )
            if updated is None:
                raise ExportQuotationNotFoundError
        return await self._quotation_response(updated)

    async def list_quotations(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        approval_status: str | None,
        customer_id: str | None,
    ) -> ExportQuotationListResponse:
        self._require(current_user, "sales:quotation:view")
        if approval_status is not None:
            self._validate_status(approval_status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        quotations, total = await self._repository.list_quotations(
            q=q,
            approval_status=approval_status,
            customer_id=customer_id,
            owner_user_ids=owner_user_ids,
        )
        return ExportQuotationListResponse(
            items=[await self._quotation_response(quotation) for quotation in quotations],
            total=total,
        )

    async def get_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
    ) -> ExportQuotationResponse:
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        return await self._quotation_response(quotation)

    async def submit_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
    ) -> ExportQuotationResponse:
        self._require(current_user, "sales:quotation:edit")
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        if quotation.approval_status != "draft":
            raise ValueError("只有草稿报价可以提交")
        async with UnitOfWork(self._repository.session):
            submitted = await self._repository.submit_quotation(quotation.id)
            if submitted is None:
                raise ExportQuotationNotFoundError
        return await self._quotation_response(submitted)

    async def approve_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
        payload: ExportQuotationApprove,
    ) -> ExportQuotationResponse:
        self._require(current_user, "sales:quotation:approve")
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        if quotation.approval_status != "submitted":
            raise ValueError("只有已提交报价可以审批")
        async with UnitOfWork(self._repository.session):
            approved = await self._repository.approve_quotation(
                quotation_id=quotation.id,
                reviewer_name=payload.reviewer_name,
                approved_at=payload.approved_at,
            )
            if approved is None:
                raise ExportQuotationNotFoundError
        return await self._quotation_response(approved)

    async def confirm_contract(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
        payload: ExportQuotationConfirmContract,
    ) -> ExportQuotationContractResponse:
        self._require(current_user, "sales:quotation:edit")
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        if quotation.approval_status != "approved":
            raise ValueError("只有已审批报价可以生成出口合同")
        lines = await self._repository.list_lines(quotation.id)
        async with UnitOfWork(self._repository.session):
            contract_id = None
            if self._export_contract_repository is not None:
                contract = await self._create_contract_from_quotation(
                    current_user=current_user,
                    quotation=quotation,
                    lines=lines,
                    payload=payload,
                )
                contract_id = contract.id
            confirmed = await self._repository.confirm_contract(
                quotation_id=quotation.id,
                confirmed_at=payload.confirmed_at,
                contract_no=payload.contract_no,
                contract_id=contract_id,
            )
            if confirmed is None:
                raise ExportQuotationNotFoundError
        return self._contract_response(confirmed)

    async def _create_contract_from_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation: ExportQuotationRow,
        lines: list[ExportQuotationLineRow],
        payload: ExportQuotationConfirmContract,
    ) -> ExportContractRow:
        if self._export_contract_repository is None:
            raise ExportQuotationNotFoundError
        contract = await self._export_contract_repository.create_contract(
            code=payload.contract_no,
            contract_date=payload.confirmed_at,
            customer_id=quotation.customer_id,
            customer_name=quotation.customer_name,
            sales_user_id=quotation.sales_user_id,
            sales_user_name=quotation.sales_user_name,
            currency=quotation.currency,
            trade_term=quotation.trade_term,
            planned_ship_date=quotation.valid_until or payload.confirmed_at,
            payment_terms="按合同约定",
            source_quotation_id=quotation.id,
            source_quotation_no=quotation.code,
            remarks=quotation.description,
            approval_status="draft",
            owner_user_id=current_user.id,
        )
        for line in lines:
            amount = line.quantity * line.unit_price
            await self._export_contract_repository.add_line(
                contract_id=contract.id,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                specification=line.specification,
                model=line.model,
                quantity=line.quantity,
                unit=line.unit,
                unit_price=line.unit_price,
                amount=amount,
                purchased_quantity="0",
                shipped_quantity="0",
                image_url=None,
                remark=line.remark,
            )
        refreshed = await self._export_contract_repository.refresh_statistics(contract.id)
        if refreshed is None:
            raise ExportQuotationNotFoundError
        return refreshed

    async def get_history(
        self,
        *,
        current_user: CurrentUserResponse,
        customer_id: str | None,
        product_id: str | None,
    ) -> ExportQuotationListResponse:
        self._require(current_user, "sales:quotation:view")
        quotations, total = await self._repository.list_history(
            customer_id=customer_id,
            product_id=product_id,
        )
        return ExportQuotationListResponse(
            items=[await self._quotation_response(quotation) for quotation in quotations],
            total=total,
        )

    async def get_purchase_references(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str | None,
    ) -> ExportQuotationPurchaseReferenceListResponse:
        self._require(current_user, "sales:quotation:view")
        inquiry_rows: list[PurchaseInquiryReferenceRow] = []
        if self._purchase_inquiry_repository is not None:
            inquiry_rows = await self._purchase_inquiry_repository.list_purchase_references(
                product_id=product_id,
            )
        rows = await self._repository.list_purchase_references(product_id=product_id)
        return ExportQuotationPurchaseReferenceListResponse(
            items=[
                *[
                    self._purchase_inquiry_reference_response(row)
                    for row in inquiry_rows
                ],
                *[self._purchase_reference_response(row) for row in rows],
            ],
            total=len(inquiry_rows) + len(rows),
        )

    async def get_sample_deliveries(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
    ) -> SampleDeliveryListResponse:
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        lines = await self._repository.list_lines(quotation.id)
        first_product_id = lines[0].product_id if lines else None
        deliveries, total = await self._sample_delivery_repository.list_quote_history(
            customer_id=quotation.customer_id,
            product_id=first_product_id,
        )
        return SampleDeliveryListResponse(
            items=[await self._sample_delivery_response(delivery) for delivery in deliveries],
            total=total,
        )

    async def export_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
        export_format: str,
    ) -> ExportQuotationExportResponse:
        self._require(current_user, "sales:quotation:export")
        if export_format not in VALID_QUOTATION_EXPORT_FORMATS:
            raise ValueError("报价导出格式无效")
        quotation = await self._get_accessible_quotation(
            current_user=current_user,
            quotation_id=quotation_id,
        )
        lines = await self._repository.list_lines(quotation.id)
        if export_format == "pdf":
            content = self._render_text_export(quotation, lines)
            return ExportQuotationExportResponse(
                filename=f"{quotation.code}.pdf",
                content_type="application/pdf",
                content=content,
            )
        return ExportQuotationExportResponse(
            filename=f"{quotation.code}.csv",
            content_type="text/csv",
            content=self._render_csv_export(quotation, lines),
        )

    async def _replace_lines(
        self,
        quotation_id: str,
        payload: ExportQuotationCreate,
    ) -> Decimal:
        await self._repository.delete_lines(quotation_id)
        total_amount = Decimal("0")
        for line in payload.lines:
            amount = line.quantity * line.unit_price
            total_amount += amount + line.freight_amount
            await self._repository.add_line(
                quotation_id=quotation_id,
                product_id=line.product_id,
                product_code=line.product_code,
                product_name=line.product_name,
                specification=line.specification,
                model=line.model,
                quantity=line.quantity,
                unit=line.unit,
                unit_price=line.unit_price,
                amount=amount,
                freight_method=line.freight_method,
                freight_amount=line.freight_amount,
                purchase_reference_supplier_name=line.purchase_reference_supplier_name,
                purchase_reference_price=line.purchase_reference_price,
                remark=line.remark,
            )
        return total_amount

    async def _get_accessible_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        quotation_id: str,
    ) -> ExportQuotationRow:
        self._require(current_user, "sales:quotation:view")
        quotation = await self._repository.get_quotation(quotation_id)
        if quotation is None:
            raise ExportQuotationNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and quotation.owner_user_id not in allowed_user_ids:
            raise ExportQuotationNotFoundError
        return quotation

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, approval_status: str) -> None:
        if approval_status not in VALID_QUOTATION_STATUSES:
            raise ValueError("报价审批状态无效")

    async def _quotation_response(self, quotation: ExportQuotationRow) -> ExportQuotationResponse:
        lines = await self._repository.list_lines(quotation.id)
        return ExportQuotationResponse(
            id=quotation.id,
            code=quotation.code,
            quote_date=quotation.quote_date,
            customer_id=quotation.customer_id,
            customer_name=quotation.customer_name,
            sales_user_id=quotation.sales_user_id,
            sales_user_name=quotation.sales_user_name,
            currency=quotation.currency,
            trade_term=quotation.trade_term,
            valid_until=quotation.valid_until,
            description=quotation.description,
            total_amount=quotation.total_amount,
            approval_status=quotation.approval_status,
            submitted_at=quotation.submitted_at,
            approved_at=quotation.approved_at,
            reviewer_name=quotation.reviewer_name,
            confirmed_at=quotation.confirmed_at,
            generated_contract_id=quotation.generated_contract_id,
            generated_contract_no=quotation.generated_contract_no,
            owner_user_id=quotation.owner_user_id,
            lines=[self._line_response(line) for line in lines],
        )

    def _line_response(self, line: ExportQuotationLineRow) -> ExportQuotationLineResponse:
        return ExportQuotationLineResponse(
            id=line.id,
            quotation_id=line.quotation_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            unit_price=self._quantity(line.unit_price),
            amount=line.amount,
            freight_method=line.freight_method,
            freight_amount=line.freight_amount,
            purchase_reference_supplier_name=line.purchase_reference_supplier_name,
            purchase_reference_price=line.purchase_reference_price,
            remark=line.remark,
        )

    def _purchase_reference_response(
        self,
        row: ExportQuotationPurchaseReferenceRow,
    ) -> ExportQuotationPurchaseReferenceResponse:
        return ExportQuotationPurchaseReferenceResponse(
            product_id=row.product_id,
            product_code=row.product_code,
            product_name=row.product_name,
            supplier_name=row.supplier_name,
            reference_price=row.reference_price,
            currency=row.currency,
            quote_date=row.quote_date,
            source_quotation_no=row.source_quotation_no,
        )

    def _purchase_inquiry_reference_response(
        self,
        row: PurchaseInquiryReferenceRow,
    ) -> ExportQuotationPurchaseReferenceResponse:
        return ExportQuotationPurchaseReferenceResponse(
            product_id=row.product_id,
            product_code=row.product_code,
            product_name=row.product_name,
            supplier_name=row.supplier_name,
            reference_price=row.reference_price,
            currency=row.currency,
            quote_date=row.quote_date,
            source_quotation_no=row.source_inquiry_no,
        )

    def _contract_response(self, quotation: ExportQuotationRow) -> ExportQuotationContractResponse:
        return ExportQuotationContractResponse(
            quotation_id=quotation.id,
            quotation_no=quotation.code,
            contract_id=quotation.generated_contract_id or "",
            contract_no=quotation.generated_contract_no or "",
            customer_id=quotation.customer_id,
            customer_name=quotation.customer_name,
            confirmed_at=quotation.confirmed_at or quotation.quote_date,
            currency=quotation.currency,
            trade_term=quotation.trade_term,
            total_amount=quotation.total_amount,
        )

    async def _sample_delivery_response(
        self,
        delivery: SampleDeliveryRow,
    ) -> SampleDeliveryResponse:
        lines = await self._sample_delivery_repository.list_lines(delivery.id)
        fees = await self._sample_delivery_repository.list_fees(delivery.id)
        fee_total = Decimal("0")
        for fee in fees:
            fee_total += fee.amount
        return SampleDeliveryResponse(
            id=delivery.id,
            code=delivery.code,
            delivery_date=delivery.delivery_date,
            customer_id=delivery.customer_id,
            customer_name=delivery.customer_name,
            supplier_id=delivery.supplier_id,
            supplier_name=delivery.supplier_name,
            factory_id=delivery.factory_id,
            factory_name=delivery.factory_name,
            recipient_name=delivery.recipient_name,
            recipient_company=delivery.recipient_company,
            recipient_address=delivery.recipient_address,
            express_company=delivery.express_company,
            tracking_no=delivery.tracking_no,
            quote_id=delivery.quote_id,
            quote_no=delivery.quote_no,
            remark=delivery.remark,
            status=delivery.status,
            submitted_at=delivery.submitted_at,
            approved_at=delivery.approved_at,
            reviewer_name=delivery.reviewer_name,
            owner_user_id=delivery.owner_user_id,
            lines=[self._sample_delivery_line_response(line) for line in lines],
            fees=[self._sample_delivery_fee_response(fee) for fee in fees],
            fee_total=self._money(fee_total),
        )

    def _sample_delivery_line_response(
        self,
        line: SampleDeliveryLineRow,
    ) -> SampleDeliveryLineResponse:
        return SampleDeliveryLineResponse(
            id=line.id,
            delivery_id=line.delivery_id,
            sample_record_id=line.sample_record_id,
            sample_code=line.sample_code,
            sample_type=line.sample_type,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
            remark=line.remark,
        )

    def _sample_delivery_fee_response(self, fee: SampleDeliveryFeeRow) -> SampleDeliveryFeeResponse:
        return SampleDeliveryFeeResponse(
            id=fee.id,
            delivery_id=fee.delivery_id,
            fee_type=fee.fee_type,
            amount=self._money(fee.amount),
            currency=fee.currency,
            payer_type=fee.payer_type,
            remark=fee.remark,
        )

    def _render_text_export(
        self,
        quotation: ExportQuotationRow,
        lines: list[ExportQuotationLineRow],
    ) -> str:
        details = "\n".join(
            f"{line.product_code or ''} {line.product_name} {self._quantity(line.quantity)}"
            f" {line.unit} x {self._quantity(line.unit_price)}"
            for line in lines
        )
        return (
            f"EXPORT QUOTATION\n"
            f"Quotation No: {quotation.code}\n"
            f"Customer: {quotation.customer_name}\n"
            f"Trade Term: {quotation.trade_term}\n"
            f"Total: {quotation.currency} {quotation.total_amount}\n"
            f"Generated At: {datetime.now(UTC).isoformat()}\n"
            f"{details}\n"
        )

    def _render_csv_export(
        self,
        quotation: ExportQuotationRow,
        lines: list[ExportQuotationLineRow],
    ) -> str:
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["quotation_no", quotation.code])
        writer.writerow(["customer", quotation.customer_name])
        writer.writerow(["currency", quotation.currency])
        writer.writerow(["trade_term", quotation.trade_term])
        writer.writerow([])
        writer.writerow(
            [
                "product_code",
                "product_name",
                "specification",
                "model",
                "quantity",
                "unit",
                "unit_price",
                "amount",
                "freight_method",
                "freight_amount",
            ]
        )
        for line in lines:
            writer.writerow(
                [
                    line.product_code or "",
                    line.product_name,
                    line.specification or "",
                    line.model or "",
                    self._quantity(line.quantity),
                    line.unit,
                    self._quantity(line.unit_price),
                    line.amount,
                    line.freight_method,
                    line.freight_amount,
                ]
            )
        writer.writerow([])
        writer.writerow(["total", quotation.total_amount])
        return output.getvalue()

    def _money(self, value: Decimal) -> str:
        return f"{value:.2f}"

    def _quantity(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip("0").rstrip(".")
