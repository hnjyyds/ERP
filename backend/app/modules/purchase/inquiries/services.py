from decimal import Decimal

from app.db.uow import UnitOfWork
from app.modules.purchase.inquiries.repositories import (
    PurchaseInquiryLineRow,
    PurchaseInquiryLineWrite,
    PurchaseInquiryReferenceRow,
    PurchaseInquiryRepository,
    PurchaseInquiryRow,
    SupplierQuotationRow,
    SupplierSampleEvidenceRow,
)
from app.modules.purchase.inquiries.schemas import (
    VALID_PURCHASE_INQUIRY_STATUSES,
    PurchaseInquiryCreate,
    PurchaseInquiryLineCreate,
    PurchaseInquiryLineResponse,
    PurchaseInquiryListResponse,
    PurchaseInquiryReferenceListResponse,
    PurchaseInquiryReferenceResponse,
    PurchaseInquiryResponse,
    PurchaseInquiryTemplateResponse,
    PurchaseInquiryTemplateSend,
    PurchaseInquiryUpdate,
    SupplierQuotationCreate,
    SupplierQuotationResponse,
    SupplierSampleEvidenceListResponse,
    SupplierSampleEvidenceResponse,
)
from app.modules.system.auth.data_scope import DataScopeResolver
from app.modules.system.auth.schemas import CurrentUserResponse


class PermissionDeniedError(Exception):
    pass


class PurchaseInquiryNotFoundError(Exception):
    pass


class PurchaseInquiryService:
    def __init__(
        self,
        repository: PurchaseInquiryRepository,
        *,
        data_scope_resolver: DataScopeResolver,
    ) -> None:
        self._repository = repository
        self._data_scope_resolver = data_scope_resolver

    async def create_inquiry(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: PurchaseInquiryCreate,
    ) -> PurchaseInquiryResponse:
        self._require(current_user, "purchase:inquiry:edit")
        async with UnitOfWork(self._repository.session):
            inquiry = await self._repository.create_inquiry(
                code=payload.code,
                inquiry_date=payload.inquiry_date,
                buyer_user_id=payload.buyer_user_id,
                buyer_user_name=payload.buyer_user_name,
                status="draft",
                remarks=payload.remarks,
                owner_user_id=current_user.id,
            )
            for line in payload.lines:
                await self._repository.add_line(
                    inquiry_id=inquiry.id,
                    product_id=line.product_id,
                    product_code=line.product_code,
                    product_name=line.product_name,
                    specification=line.specification,
                    model=line.model,
                    quantity=line.quantity,
                    unit=line.unit,
                )
        return await self._inquiry_response(inquiry)

    async def update_inquiry(
        self,
        *,
        current_user: CurrentUserResponse,
        inquiry_id: str,
        payload: PurchaseInquiryUpdate,
    ) -> PurchaseInquiryResponse:
        self._require(current_user, "purchase:inquiry:edit")
        inquiry = await self._get_accessible_inquiry(
            current_user=current_user,
            inquiry_id=inquiry_id,
        )
        if inquiry.status != "draft":
            raise ValueError("只有草稿采购询价可以编辑")
        if await self._repository.list_supplier_quotations(inquiry.id):
            raise ValueError("已有供应商报价的采购询价不可编辑")
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.update_inquiry(
                inquiry_id=inquiry.id,
                code=payload.code,
                inquiry_date=payload.inquiry_date,
                buyer_user_id=payload.buyer_user_id,
                buyer_user_name=payload.buyer_user_name,
                remarks=payload.remarks,
            )
            if updated is None:
                raise PurchaseInquiryNotFoundError
            await self._repository.replace_lines(
                inquiry_id=inquiry.id,
                lines=[self._line_write(line) for line in payload.lines],
            )
        return await self._inquiry_response(updated)

    async def list_inquiries(
        self,
        *,
        current_user: CurrentUserResponse,
        q: str | None,
        status: str | None,
        product_id: str | None,
        supplier_id: str | None,
    ) -> PurchaseInquiryListResponse:
        self._require(current_user, "purchase:inquiry:view")
        if status is not None:
            self._validate_status(status)
        owner_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        inquiries, total = await self._repository.list_inquiries(
            q=q,
            status=status,
            product_id=product_id,
            supplier_id=supplier_id,
            owner_user_ids=owner_user_ids,
        )
        return PurchaseInquiryListResponse(
            items=[await self._inquiry_response(item) for item in inquiries],
            total=total,
        )

    async def get_inquiry(
        self,
        *,
        current_user: CurrentUserResponse,
        inquiry_id: str,
    ) -> PurchaseInquiryResponse:
        inquiry = await self._get_accessible_inquiry(
            current_user=current_user,
            inquiry_id=inquiry_id,
        )
        return await self._inquiry_response(inquiry)

    async def add_supplier_quotation(
        self,
        *,
        current_user: CurrentUserResponse,
        inquiry_id: str,
        payload: SupplierQuotationCreate,
    ) -> PurchaseInquiryResponse:
        self._require(current_user, "purchase:inquiry:edit")
        inquiry = await self._get_accessible_inquiry(
            current_user=current_user,
            inquiry_id=inquiry_id,
        )
        lines = await self._repository.list_lines(inquiry.id)
        if not any(line.id == payload.inquiry_line_id for line in lines):
            raise ValueError("供应商报价明细不属于该询价单")
        async with UnitOfWork(self._repository.session):
            await self._repository.add_supplier_quotation(
                inquiry_id=inquiry.id,
                inquiry_line_id=payload.inquiry_line_id,
                supplier_id=payload.supplier_id,
                supplier_name=payload.supplier_name,
                quoted_at=payload.quoted_at,
                unit_price=payload.unit_price,
                currency=payload.currency,
                lead_time_days=payload.lead_time_days,
                min_order_quantity=payload.min_order_quantity,
                sample_available=payload.sample_available,
                remark=payload.remark,
            )
            updated = await self._repository.get_inquiry(inquiry.id)
            if updated is None:
                raise PurchaseInquiryNotFoundError
        return await self._inquiry_response(updated)

    async def send_template(
        self,
        *,
        current_user: CurrentUserResponse,
        inquiry_id: str,
        payload: PurchaseInquiryTemplateSend,
    ) -> PurchaseInquiryTemplateResponse:
        self._require(current_user, "purchase:inquiry:export")
        inquiry = await self._get_accessible_inquiry(
            current_user=current_user,
            inquiry_id=inquiry_id,
        )
        lines = await self._repository.list_lines(inquiry.id)
        async with UnitOfWork(self._repository.session):
            updated = await self._repository.mark_template_sent(
                inquiry_id=inquiry.id,
                template_name=payload.template_name,
                sent_at=inquiry.inquiry_date,
            )
            if updated is None:
                raise PurchaseInquiryNotFoundError
        return PurchaseInquiryTemplateResponse(
            filename=f"{updated.code}-inquiry.txt",
            content_type="text/plain",
            content=self._template_content(updated, lines, payload),
        )

    async def get_supplier_samples(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str | None,
        supplier_id: str | None,
    ) -> SupplierSampleEvidenceListResponse:
        self._require(current_user, "purchase:inquiry:view")
        rows = await self._repository.list_supplier_sample_evidence(
            product_id=product_id,
            supplier_id=supplier_id,
        )
        return SupplierSampleEvidenceListResponse(
            items=[self._sample_response(row) for row in rows],
            total=len(rows),
        )

    async def get_purchase_references(
        self,
        *,
        current_user: CurrentUserResponse,
        product_id: str | None,
    ) -> PurchaseInquiryReferenceListResponse:
        self._require(current_user, "purchase:inquiry:view")
        rows = await self._repository.list_purchase_references(product_id=product_id)
        return PurchaseInquiryReferenceListResponse(
            items=[self._reference_response(row) for row in rows],
            total=len(rows),
        )

    async def _get_accessible_inquiry(
        self,
        *,
        current_user: CurrentUserResponse,
        inquiry_id: str,
    ) -> PurchaseInquiryRow:
        self._require(current_user, "purchase:inquiry:view")
        inquiry = await self._repository.get_inquiry(inquiry_id)
        if inquiry is None:
            raise PurchaseInquiryNotFoundError
        allowed_user_ids = await self._data_scope_resolver.resolve_user_ids(
            current_user=current_user,
        )
        if allowed_user_ids is not None and inquiry.owner_user_id not in allowed_user_ids:
            raise PermissionDeniedError
        return inquiry

    async def _inquiry_response(
        self,
        inquiry: PurchaseInquiryRow,
    ) -> PurchaseInquiryResponse:
        lines = await self._repository.list_lines(inquiry.id)
        quotations = await self._repository.list_supplier_quotations(inquiry.id)
        return PurchaseInquiryResponse(
            id=inquiry.id,
            code=inquiry.code,
            inquiry_date=inquiry.inquiry_date,
            buyer_user_id=inquiry.buyer_user_id,
            buyer_user_name=inquiry.buyer_user_name,
            status=inquiry.status,
            template_name=inquiry.template_name,
            template_sent_at=inquiry.template_sent_at,
            remarks=inquiry.remarks,
            owner_user_id=inquiry.owner_user_id,
            lines=[self._line_response(line) for line in lines],
            quotations=[self._quotation_response(quotation) for quotation in quotations],
        )

    def _line_response(self, line: PurchaseInquiryLineRow) -> PurchaseInquiryLineResponse:
        return PurchaseInquiryLineResponse(
            id=line.id,
            inquiry_id=line.inquiry_id,
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=self._quantity(line.quantity),
            unit=line.unit,
        )

    def _line_write(self, line: PurchaseInquiryLineCreate) -> PurchaseInquiryLineWrite:
        return PurchaseInquiryLineWrite(
            product_id=line.product_id,
            product_code=line.product_code,
            product_name=line.product_name,
            specification=line.specification,
            model=line.model,
            quantity=line.quantity,
            unit=line.unit,
        )

    def _quotation_response(
        self,
        quotation: SupplierQuotationRow,
    ) -> SupplierQuotationResponse:
        return SupplierQuotationResponse(
            id=quotation.id,
            inquiry_id=quotation.inquiry_id,
            inquiry_line_id=quotation.inquiry_line_id,
            product_id=quotation.product_id,
            product_code=quotation.product_code,
            product_name=quotation.product_name,
            supplier_id=quotation.supplier_id,
            supplier_name=quotation.supplier_name,
            quoted_at=quotation.quoted_at,
            unit_price=quotation.unit_price,
            currency=quotation.currency,
            lead_time_days=quotation.lead_time_days,
            min_order_quantity=quotation.min_order_quantity,
            sample_available=quotation.sample_available,
            has_sample=quotation.has_sample,
            remark=quotation.remark,
        )

    def _sample_response(
        self,
        row: SupplierSampleEvidenceRow,
    ) -> SupplierSampleEvidenceResponse:
        return SupplierSampleEvidenceResponse(
            sample_record_id=row.sample_record_id,
            sample_code=row.sample_code,
            sample_type=row.sample_type,
            status=row.status,
            supplier_id=row.supplier_id,
            supplier_name=row.supplier_name,
            product_id=row.product_id,
            product_code=row.product_code,
            product_name=row.product_name,
            received_at=row.received_at,
            quantity=row.quantity,
            unit=row.unit,
        )

    def _reference_response(
        self,
        row: PurchaseInquiryReferenceRow,
    ) -> PurchaseInquiryReferenceResponse:
        return PurchaseInquiryReferenceResponse(
            product_id=row.product_id,
            product_code=row.product_code,
            product_name=row.product_name,
            supplier_name=row.supplier_name,
            reference_price=row.reference_price,
            currency=row.currency,
            quote_date=row.quote_date,
            source_inquiry_no=row.source_inquiry_no,
        )

    def _template_content(
        self,
        inquiry: PurchaseInquiryRow,
        lines: list[PurchaseInquiryLineRow],
        payload: PurchaseInquiryTemplateSend,
    ) -> str:
        recipients = "、".join(payload.recipient_emails) if payload.recipient_emails else "未指定"
        line_text = "\n".join(
            (
                f"- {line.product_code or '未填'} / {line.product_name} / "
                f"{self._quantity(line.quantity)} {line.unit}"
            )
            for line in lines
        )
        return (
            f"采购询价单：{inquiry.code}\n"
            f"模板：{payload.template_name}\n"
            f"询价日期：{inquiry.inquiry_date}\n"
            f"收件供应商：{recipients}\n"
            f"询价商品：\n{line_text}\n"
            "请回复含税/不含税单价、交期、最小起订量和样品可提供情况。"
        )

    def _require(self, current_user: CurrentUserResponse, permission: str) -> None:
        if permission not in current_user.permissions:
            raise PermissionDeniedError

    def _validate_status(self, value: str) -> None:
        if value not in VALID_PURCHASE_INQUIRY_STATUSES:
            raise ValueError("采购询价状态无效")

    def _quantity(self, value: Decimal) -> str:
        return format(value.quantize(Decimal("0.0001")).normalize(), "f")
